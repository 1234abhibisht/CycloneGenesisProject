"""Local preparedness plans, consented area inboxes and reviewed alert delivery.

Research forecasts can create exercises only. Real SMS needs an official advisory,
an operator key, provider credentials and an explicitly verified recipient list.
"""
import base64, hashlib, hmac, json, math, os, re, secrets, sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field
from fastapi.responses import PlainTextResponse
from typing import Annotated

ROOT=Path(__file__).parent/'research_data'
DB=ROOT/'planning.sqlite3'
DIRECTORY=json.loads((ROOT/'shelters_osdma.json').read_text(encoding='utf-8'))
SOURCES=[{'name':'OSDMA shelter directory','url':DIRECTORY['sourceUrl']},
         {'name':'NDMA cyclone guidance (state authority publication)','url':'https://sdma.maharashtra.gov.in/en/dos-and-donts/'},
         {'name':'Official cyclone advisories','url':'https://rsmcnewdelhi.imd.gov.in/'},
         {'name':'NDMA SACHET alerts','url':'https://sachet.ndma.gov.in/'},
         {'name':'India emergency response — 112','url':'https://112.gov.in/'}]

def now(): return datetime.now(timezone.utc)
def timestamp(): return now().isoformat()
@contextmanager
def connect():
    con=sqlite3.connect(DB,timeout=15)
    con.row_factory=sqlite3.Row
    try:
        with con: yield con
    finally: con.close()

def initialize():
    with connect() as con:
        con.executescript('''
        CREATE TABLE IF NOT EXISTS subscriptions(id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, label TEXT NOT NULL, lat REAL NOT NULL, lon REAL NOT NULL, phone TEXT, consent_at TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
        CREATE TABLE IF NOT EXISTS drafts(id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS deliveries(draft_id TEXT NOT NULL, subscriber_id TEXT NOT NULL, channel TEXT NOT NULL, status TEXT NOT NULL, provider_id TEXT, updated_at TEXT NOT NULL, PRIMARY KEY(draft_id,subscriber_id,channel));
        ''')

def haversine(a,b):
    p1,p2=map(math.radians,[a[0],b[0]])
    dp=p2-p1; dl=math.radians(b[1]-a[1])
    return 6371*2*math.asin(min(1,math.sqrt(math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2)))

def bearing(a,b):
    p1,p2=map(math.radians,[a[0],b[0]]); dl=math.radians(b[1]-a[1])
    return math.atan2(math.sin(dl)*math.cos(p2),math.cos(p1)*math.sin(p2)-math.sin(p1)*math.cos(p2)*math.cos(dl))

def segment_distance(p,a,b):
    length=haversine(a,b)
    if length<1e-8: return haversine(p,a)
    d=haversine(a,p)/6371; delta=bearing(a,p)-bearing(a,b)
    along=math.atan2(math.sin(d)*math.cos(delta),math.cos(d))*6371
    if along<=0: return haversine(p,a)
    if along>=length: return haversine(p,b)
    return abs(math.asin(max(-1,min(1,math.sin(d)*math.sin(delta)))))*6371

def area_distance(p,area):
    pts=area['points']
    return min(segment_distance(p,a,b) for a,b in zip(pts,pts[1:])) if len(pts)>1 else haversine(p,pts[0])

def operator(key):
    expected=os.getenv('CYCLONE_OPERATOR_KEY','')
    if len(expected)<32 or not key or not hmac.compare_digest(key,expected):
        raise HTTPException(403,'A configured operator key is required for real advisory delivery.')

def official_url(value):
    parsed=urlparse(value); host=parsed.hostname or ''
    return parsed.scheme=='https' and not parsed.username and (host.endswith('.gov.in') or host.endswith('.nic.in') or host in ['osdma.org','www.osdma.org'])

def as_utc(value):
    if value.tzinfo is None: raise HTTPException(422,'Advisory times must include a timezone.')
    return value.astimezone(timezone.utc)

class Location(BaseModel):
    lat:float=Field(ge=-90,le=90,allow_inf_nan=False)
    lon:float=Field(ge=-180,le=180,allow_inf_nan=False)
    label:str=Field(default='Selected location',min_length=1,max_length=100)

class PlanRequest(Location):
    people:int=Field(default=1,ge=1,le=50)
    mobility:bool=False
    children:bool=False
    pets:bool=False
    transport:str=Field(default='private',pattern='^(private|walk|assistance)$')
    shelterId:str|None=None
    shelterConfirmed:bool=False

class Subscription(Location):
    consent:bool=False
    phone:str|None=Field(default=None,max_length=20)

class DraftRequest(Location):
    kind:str=Field(default='exercise',pattern='^(exercise|official)$')
    geometry:str=Field(default='forecast',pattern='^(forecast|circle)$')
    radiusKm:float=Field(default=100,ge=5,le=300,allow_inf_nan=False)
    headline:str=Field(default='Cyclone preparedness update',min_length=5,max_length=120)
    message:str=Field(default='',max_length=1200)
    sourceUrl:str=Field(default='',max_length=400)
    issuedAt:datetime|None=None
    expiresAt:datetime|None=None

class DispatchRequest(BaseModel):
    channel:str=Field(default='in_app',pattern='^(in_app|sms)$')
    reviewed:bool=False
    confirmation:str=''

def send_sms(phone,body):
    account=os.getenv('TWILIO_ACCOUNT_SID',''); secret=os.getenv('TWILIO_AUTH_TOKEN',''); sender=os.getenv('TWILIO_FROM_NUMBER','')
    url=f'https://api.twilio.com/2010-04-01/Accounts/{account}/Messages.json'
    request=Request(url,data=urlencode({'To':phone,'From':sender,'Body':body}).encode(),headers={'Authorization':'Basic '+base64.b64encode(f'{account}:{secret}'.encode()).decode(),'Content-Type':'application/x-www-form-urlencoded'})
    with urlopen(request,timeout=10) as response: return json.loads(response.read(100_000))

def create_router(forecast_snapshot,roster):
    initialize()
    router=APIRouter(prefix='/api/planning',tags=['Preparedness and warning delivery'])

    @router.get('/status')
    def status():
        sms=bool(re.fullmatch(r'AC[0-9a-fA-F]{32}',os.getenv('TWILIO_ACCOUNT_SID','')) and os.getenv('TWILIO_AUTH_TOKEN') and os.getenv('TWILIO_FROM_NUMBER') and len(os.getenv('CYCLONE_OPERATOR_KEY',''))>=32 and os.getenv('CYCLONE_SMS_VERIFIED_RECIPIENTS'))
        return {'smsConfigured':sms,'inAppAvailable':True,'directoryCount':len(DIRECTORY['shelters']),'directoryRetrievedAt':DIRECTORY['retrievedAt'],'coverage':DIRECTORY['coverage'],'sources':SOURCES,'deliveryNote':'No automatic public broadcast. Review each frozen draft. Research exercises cannot be sent by SMS.'}

    @router.get('/shelters')
    def shelters(lat:float=Query(...,ge=-90,le=90),lon:float=Query(...,ge=-180,le=180),radiusKm:float=Query(50,ge=1,le=100)):
        location=Location(lat=lat,lon=lon)
        found=[]
        for row in DIRECTORY['shelters']:
            distance=haversine((location.lat,location.lon),(row['lat'],row['lon']))
            if distance<=radiusKm:
                found.append({**row,'distanceKm':round(distance,2),'mapUrl':f"https://www.google.com/maps/search/?api=1&query={row['lat']},{row['lon']}"})
        return {'shelters':sorted(found,key=lambda r:r['distanceKm'])[:30],'totalNearby':len(found),'source':DIRECTORY['source'],'sourceUrl':DIRECTORY['sourceUrl'],'retrievedAt':DIRECTORY['retrievedAt'],'coverage':DIRECTORY['coverage'],'distanceType':'Straight-line distance; not road distance or travel time.'}

    @router.post('/plan')
    def plan(payload:PlanRequest):
        nearby=shelters(payload.lat,payload.lon,50)
        selected=next((s for s in nearby['shelters'] if s['id']==payload.shelterId),None)
        if payload.shelterId and selected is None: raise HTTPException(422,'Choose a shelter from the nearby directory results.')
        needs=[]
        if payload.mobility: needs.append('Arrange accessible transport, a support person and power/medication needs with the local response team.')
        if payload.children: needs.append('Assign an adult to each child; carry identification and feeding supplies and agree a family contact.')
        if payload.pets: needs.append('Ask whether animals are accepted and arrange a separate approved shelter if necessary.')
        if payload.transport in ['walk','assistance']: needs.append('Request local evacuation transport if a safe journey cannot be completed. Do not attempt a flooded crossing.')
        tasks=[{'stage':'Confirm your destination','items':['Ask local authorities which shelter is open, suitable and reachable. The nearest directory entry is only a candidate.','Confirm space for your household, accessibility, an alternate shelter and a route avoiding closures.']},
               {'stage':'Prepare to leave','items':[f'Account for all {payload.people} household members and agree a meeting point and contact.','Pack water, ready-to-eat food, medicines, identification, torch, phone and charger.']+needs},
               {'stage':'When instructed to evacuate','items':['Follow the departure time and route given by local officials; do not wait for this model to update.','Never walk or drive through floodwater. Stay away from beaches, downed wires and damaged structures.']},
               {'stage':'At the shelter and afterward','items':['Register your household on arrival and tell your contact where you are.','Stay sheltered during the eye of the storm; return only after authorities say it is safe.']}]
        confirmed=bool(selected and payload.shelterConfirmed)
        return {'createdAt':timestamp(),'location':payload.model_dump(include={'lat','lon','label'}),'householdSize':payload.people,'status':'User-confirmed destination; follow local instructions' if confirmed else 'Destination and route confirmation required','selectedShelter':selected,'destinationConfirmedByUser':confirmed,'nearby':nearby,'steps':tasks,'routeStatus':'Not verified — no live flood, road-closure, surge or shelter-occupancy feed is connected.','departureTime':None,'safeRoute':None,'emergency':{'number':'112','scope':'India — immediate emergency assistance only'},'sources':SOURCES,'note':'Preparedness plan, not an evacuation order or a guarantee of safety. No personal location is stored by this plan endpoint.'}

    @router.get('/plan.txt', response_class=PlainTextResponse)
    def export_plan(payload:Annotated[PlanRequest, Query()]):
        result=plan(payload)
        destination=result['selectedShelter']
        lines=['CYCLONE AI — HOUSEHOLD PREPAREDNESS PLAN',result['status'],
               f"Prepared: {result['createdAt']}",
               f"Location: {payload.label} ({payload.lat}, {payload.lon})",
               f"People: {payload.people}",
               f"Destination: {destination['name']}, {destination['district']}; {destination['lat']}, {destination['lon']}" if destination else 'Destination: Not confirmed',
               result['routeStatus']]
        for stage in result['steps']:
            lines.extend(['',stage['stage'],*['[ ] '+item for item in stage['items']]])
        lines.extend(['','Immediate emergency in India: 112',result['note'],*[source['name']+': '+source['url'] for source in result['sources']]])
        return PlainTextResponse('\n'.join(lines),headers={'Content-Disposition':'attachment; filename="cyclone-household-plan.txt"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})

    @router.post('/subscriptions')
    def subscribe(payload:Subscription):
        if not payload.consent: raise HTTPException(422,'Explicit consent is required to save an area subscription.')
        phone=payload.phone.strip() if payload.phone else None
        if phone and not re.fullmatch(r'\+[1-9]\d{7,14}',phone): raise HTTPException(422,'Use an international phone number beginning with +.')
        sid=secrets.token_urlsafe(16); token=secrets.token_urlsafe(32)
        with connect() as con:
            con.execute('INSERT INTO subscriptions VALUES(?,?,?,?,?,?,?,1)',(sid,hashlib.sha256(token.encode()).hexdigest(),payload.label,round(payload.lat,3),round(payload.lon,3),phone,timestamp()))
        return {'id':sid,'token':token,'label':payload.label,'message':'Area saved on this local server. Keep this browser token to read alerts or unsubscribe. Phone delivery also requires operator verification.'}

    def subscriber(sid,token):
        with connect() as con: row=con.execute('SELECT * FROM subscriptions WHERE id=? AND active=1',(sid,)).fetchone()
        if row is None or not token or not hmac.compare_digest(row['token_hash'],hashlib.sha256(token.encode()).hexdigest()): raise HTTPException(403,'Subscription token is invalid.')
        return row

    @router.get('/subscriptions/{sid}/inbox')
    def inbox(sid:str,x_subscription_token:str|None=Header(default=None)):
        subscriber(sid,x_subscription_token)
        with connect() as con: rows=con.execute("SELECT d.payload, x.updated_at FROM deliveries x JOIN drafts d ON d.id=x.draft_id WHERE x.subscriber_id=? AND x.channel='in_app' AND x.status='published' ORDER BY x.updated_at DESC LIMIT 30",(sid,)).fetchall()
        return {'alerts':[{**json.loads(r['payload']),'receivedAt':r['updated_at'],'expired':datetime.fromisoformat(json.loads(r['payload'])['expiresAt'])<now()} for r in rows]}

    @router.post('/subscriptions/{sid}/unsubscribe')
    def unsubscribe(sid:str,x_subscription_token:str|None=Header(default=None)):
        subscriber(sid,x_subscription_token)
        with connect() as con: con.execute('DELETE FROM subscriptions WHERE id=?',(sid,))
        return {'unsubscribed':True}

    @router.post('/drafts')
    def draft(payload:DraftRequest,x_operator_key:str|None=Header(default=None)):
        if payload.kind=='official':
            operator(x_operator_key)
            if payload.geometry!='circle': raise HTTPException(422,'Real advisories must use an operator-selected area, not the archived model path.')
            if not official_url(payload.sourceUrl) or not payload.message.strip(): raise HTTPException(422,'Provide the official HTTPS government advisory URL and its reviewed message.')
            if not payload.issuedAt or not payload.expiresAt: raise HTTPException(422,'Advisory issue and expiry times are required.')
            issued,expiry=as_utc(payload.issuedAt),as_utc(payload.expiresAt)
            if not now()-timedelta(hours=24)<=issued<=now()+timedelta(minutes=5) or not now()<expiry<=now()+timedelta(hours=24) or issued>=expiry: raise HTTPException(422,'Advisory must be current, with a valid expiry within 24 hours.')
        else:
            issued=now(); expiry=now()+timedelta(hours=1)
        snapshot=None
        if payload.geometry=='forecast':
            snapshot=forecast_snapshot()
            area={'points':snapshot['points'],'radiusKm':payload.radiusKm,'type':'research-corridor','note':'User-selected distance from the +24h research guide line; not a hazard footprint or probability cone.'}
        else: area={'points':[[payload.lat,payload.lon]],'radiusKm':payload.radiusKm,'type':'operator-circle','note':'Area chosen by the operator; not an official warning polygon.'}
        with connect() as con: subs=con.execute('SELECT id,lat,lon,phone FROM subscriptions WHERE active=1').fetchall()
        recipients=[r['id'] for r in subs if area_distance((r['lat'],r['lon']),area)<=payload.radiusKm]
        districts=[{'name':r['name'],'state':r['state'],'distanceKm':round(area_distance((r['lat'],r['lon']),area),1)} for r in roster if area_distance((r['lat'],r['lon']),area)<=payload.radiusKm]
        if payload.kind=='exercise':
            body='EXERCISE ONLY — NOT A CURRENT CYCLONE WARNING. '+payload.headline+'. '+(f"Archived model case {snapshot['name']}, issued {snapshot['issuedAt']}. " if snapshot else '')+'This is a local preparedness drill. Check official IMD/SACHET advisories for current conditions.'
        else: body='CYCLONE AI — relayed advisory, not issued by this app. '+payload.headline+'. '+payload.message.strip()+' Source: '+payload.sourceUrl
        value={'id':secrets.token_urlsafe(16),'kind':payload.kind,'headline':payload.headline,'message':body,'issuedAt':issued.isoformat(),'expiresAt':expiry.isoformat(),'createdAt':timestamp(),'sourceUrl':payload.sourceUrl if payload.kind=='official' else 'https://rsmcnewdelhi.imd.gov.in/','area':area,'forecast':snapshot,'recipientIds':recipients,'recipientCount':len(recipients),'districtReferences':districts,'districtNote':'Matching reference centroids only. Not a full list of exposed settlements.'}
        with connect() as con: con.execute('INSERT INTO drafts VALUES(?,?,?)',(value['id'],json.dumps(value),timestamp()))
        return {k:v for k,v in value.items() if k!='recipientIds'}

    @router.post('/drafts/{draft_id}/dispatch')
    def dispatch(draft_id:str,payload:DispatchRequest,x_operator_key:str|None=Header(default=None)):
        if not payload.reviewed or payload.confirmation!='SEND': raise HTTPException(422,'Review the exact message, area, mode and recipient count, then confirm SEND.')
        with connect() as con: row=con.execute('SELECT payload FROM drafts WHERE id=?',(draft_id,)).fetchone()
        if row is None: raise HTTPException(404,'Draft not found.')
        item=json.loads(row['payload'])
        if datetime.fromisoformat(item['expiresAt'])<=now(): raise HTTPException(409,'This draft has expired; create and review a new draft.')
        if item['kind']=='official' or payload.channel=='sms': operator(x_operator_key)
        if payload.channel=='sms':
            if item['kind']!='official': raise HTTPException(409,'Research exercises cannot be sent by SMS.')
            if not status()['smsConfigured']: raise HTTPException(409,'SMS provider and verified recipients are not configured.')
        verified=set(filter(None,os.getenv('CYCLONE_SMS_VERIFIED_RECIPIENTS','').split(',')))
        counts={'published':0,'queued':0,'failed':0,'unknown':0,'skipped':0}
        for sid in item['recipientIds']:
            with connect() as con:
                con.execute('BEGIN IMMEDIATE')
                recipient=con.execute('SELECT * FROM subscriptions WHERE id=? AND active=1',(sid,)).fetchone()
                previous=con.execute('SELECT status FROM deliveries WHERE draft_id=? AND subscriber_id=? AND channel=?',(draft_id,sid,payload.channel)).fetchone()
                if previous or recipient is None or (payload.channel=='sms' and recipient['phone'] not in verified): counts['skipped']+=1; continue
                # Claim before contacting provider. Ambiguous failures are never automatically resent.
                con.execute('INSERT INTO deliveries VALUES(?,?,?,?,?,?)',(draft_id,sid,payload.channel,'sending',None,timestamp()))
            outcome='published'; provider_id=None
            if payload.channel=='sms':
                try:
                    reply=send_sms(recipient['phone'],item['message']); provider_id=reply.get('sid')
                    outcome='queued' if provider_id else 'unknown'
                except Exception: outcome='unknown'
            with connect() as con: con.execute('UPDATE deliveries SET status=?,provider_id=?,updated_at=? WHERE draft_id=? AND subscriber_id=? AND channel=?',(outcome,provider_id,timestamp(),draft_id,sid,payload.channel))
            counts[outcome]+=1
        return {'draftId':draft_id,'channel':payload.channel,'results':counts,'note':'Queued means accepted by the provider, not confirmed delivered. Unknown attempts require operator reconciliation; they are not automatically retried.'}

    return router
