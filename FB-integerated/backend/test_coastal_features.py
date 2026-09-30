import json, os, sys, tempfile, unittest
from pathlib import Path
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from fastapi import HTTPException
from pydantic import ValidationError
sys.path.insert(0,str(Path(r'D:\SIH\cyclone-ai\backend')))
import planning_api as p
import weather_api as w

class PlanningTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.original_db=p.DB;p.DB=Path(self.tmp.name)/'test.sqlite3'
        self.snapshot={'caseId':'test-case','name':'HISTORICAL TEST','stormId':'test-storm','issuedAt':'2007-06-04T00:00:00Z','dataSource':'replay','points':[[19.8,85.8],[20.0,86.0]]}
        self.router=p.create_router(lambda:dict(self.snapshot),[{'name':'Puri','state':'Odisha','lat':19.8,'lon':85.8}])
        self.calls={r.path:r.endpoint for r in self.router.routes}
        self.env=patch.dict(os.environ,{},clear=True);self.env.start()
    def tearDown(self): self.env.stop();p.DB=self.original_db;self.tmp.cleanup()
    def call(self,path,*args,**kwargs):return self.calls['/api/planning'+path](*args,**kwargs)
    def sub(self,lat=19.8,lon=85.8,phone=None):return self.call('/subscriptions',p.Subscription(lat=lat,lon=lon,consent=True,phone=phone))
    def draft(self,**kwargs):return self.call('/drafts',p.DraftRequest(lat=19.8,lon=85.8,**kwargs),None)
    def dispatch(self,draft,channel='in_app',key=None):return self.call('/drafts/{draft_id}/dispatch',draft['id'],p.DispatchRequest(channel=channel,reviewed=True,confirmation='SEND'),key)
    def test_plan_export_is_downloadable_and_keeps_limitations(self):
        result=self.call('/plan.txt',p.PlanRequest(lat=19.8,lon=85.8,people=4,mobility=True))
        text=result.body.decode('utf-8')
        self.assertIn('attachment;',result.headers['content-disposition'])
        self.assertEqual(result.headers['cache-control'],'no-store')
        self.assertIn('People: 4',text)
        self.assertIn('accessible transport',text)
        self.assertIn('Not verified',text)
        self.assertGreater(len(text.splitlines()),20)
        self.assertNotIn('\\n',text)
    def test_great_circle_distance_and_segment_projection(self):
        self.assertAlmostEqual(p.haversine((0,0),(0,1)),111.195,places=2)
        self.assertAlmostEqual(p.segment_distance((1,1),(0,0),(0,2)),111.195,places=2)
        self.assertAlmostEqual(p.segment_distance((0,-1),(0,0),(0,2)),111.195,places=2)
    def test_consent_and_invalid_coordinates_rejected(self):
        with self.assertRaises(HTTPException):self.call('/subscriptions',p.Subscription(lat=19.8,lon=85.8))
        with self.assertRaises(ValidationError):p.Location(lat=float('nan'),lon=85)
        with self.assertRaises(ValidationError):p.Location(lat=91,lon=85)
    def test_targeting_and_frozen_draft(self):
        inside=self.sub();self.sub(lat=19.0,lon=72.8)
        draft=self.draft(radiusKm=20)
        self.assertEqual(draft['recipientCount'],1);self.assertIn('EXERCISE ONLY',draft['message'])
        self.snapshot['points']=[[10,60],[11,61]]
        self.assertEqual(self.dispatch(draft)['results']['published'],1)
        inbox=self.call('/subscriptions/{sid}/inbox',inside['id'],inside['token'])
        self.assertEqual(inbox['alerts'][0]['area']['points'][0],[19.8,85.8])
    def test_duplicate_dispatch_does_not_repeat(self):
        self.sub();draft=self.draft();self.dispatch(draft)
        self.assertEqual(self.dispatch(draft)['results']['skipped'],1)
    def test_unsubscribe_removes_location_and_blocks_delivery(self):
        sub=self.sub();draft=self.draft()
        self.call('/subscriptions/{sid}/unsubscribe',sub['id'],sub['token'])
        self.assertEqual(self.dispatch(draft)['results']['skipped'],1)
        with self.assertRaises(HTTPException):self.call('/subscriptions/{sid}/inbox',sub['id'],sub['token'])
    def test_inbox_requires_secret(self):
        sub=self.sub()
        with self.assertRaises(HTTPException):self.call('/subscriptions/{sid}/inbox',sub['id'],'wrong')
    def test_exercise_cannot_be_sms(self):
        os.environ['CYCLONE_OPERATOR_KEY']='k'*32
        with patch.object(p,'send_sms') as send:
            with self.assertRaises(HTTPException) as error:self.dispatch(self.draft(),'sms','k'*32)
            self.assertEqual(error.exception.status_code,409);send.assert_not_called()
    def test_review_and_expiry_required(self):
        draft=self.draft()
        with self.assertRaises(HTTPException):self.call('/drafts/{draft_id}/dispatch',draft['id'],p.DispatchRequest(),None)
        with p.connect() as con:
            item=json.loads(con.execute('SELECT payload FROM drafts WHERE id=?',(draft['id'],)).fetchone()[0]);item['expiresAt']=(p.now()-timedelta(seconds=1)).isoformat();con.execute('UPDATE drafts SET payload=? WHERE id=?',(json.dumps(item),draft['id']))
        with self.assertRaises(HTTPException):self.dispatch(draft)
    def test_real_advisory_requires_operator_and_official_source(self):
        args=dict(lat=19.8,lon=85.8,kind='official',geometry='circle',message='Reviewed test bulletin',sourceUrl='https://example.com',issuedAt=p.now(),expiresAt=p.now()+timedelta(hours=1))
        with self.assertRaises(HTTPException):self.call('/drafts',p.DraftRequest(**args),None)
        os.environ['CYCLONE_OPERATOR_KEY']='k'*32
        with self.assertRaises(HTTPException):self.call('/drafts',p.DraftRequest(**args),'k'*32)
        self.assertFalse(p.official_url('https://imd.gov.in.evil.example/x'))
    def test_real_sms_verified_recipient_and_idempotency(self):
        os.environ.update({'CYCLONE_OPERATOR_KEY':'k'*32,'TWILIO_ACCOUNT_SID':'AC'+'a'*32,'TWILIO_AUTH_TOKEN':'unit-test-secret','TWILIO_FROM_NUMBER':'+15005550006','CYCLONE_SMS_VERIFIED_RECIPIENTS':'+15005550001'})
        self.sub(phone='+15005550001');self.sub(phone='+15005550002')
        draft=self.call('/drafts',p.DraftRequest(lat=19.8,lon=85.8,kind='official',geometry='circle',message='Unit test only',sourceUrl='https://rsmcnewdelhi.imd.gov.in/',issuedAt=p.now(),expiresAt=p.now()+timedelta(hours=1)),'k'*32)
        with patch.object(p,'send_sms',return_value={'sid':'test-message'}) as send:
            result=self.dispatch(draft,'sms','k'*32)
            self.assertEqual(result['results']['queued'],1);self.assertEqual(result['results']['skipped'],1)
            self.dispatch(draft,'sms','k'*32);send.assert_called_once()
    def test_shelters_and_plan_do_not_claim_safe_routes(self):
        shelters=self.call('/shelters',19.8135,85.8312,50)
        self.assertGreater(len(shelters['shelters']),0)
        first=shelters['shelters'][0]
        self.assertEqual(first['openStatus'],'Unknown')
        result=self.call('/plan',p.PlanRequest(lat=19.8135,lon=85.8312,people=4,mobility=True,children=True,shelterId=first['id']))
        self.assertIsNone(result['safeRoute']);self.assertIsNone(result['departureTime']);self.assertFalse(result['destinationConfirmedByUser'])
        self.assertIn('support person',' '.join(result['steps'][1]['items']))
    def test_directory_does_not_cover_every_location(self):
        self.assertEqual(self.call('/shelters',13.0,80.2,50)['shelters'],[])

class WeatherTests(unittest.TestCase):
    def setUp(self):w.cache.clear()
    def fixture(self,offset=0):
        start=datetime.now(timezone.utc).replace(minute=0,second=0,microsecond=0)+timedelta(days=offset)
        return {'latitude':13,'longitude':89,'hourly_units':{f:'test-unit' for f in w.FIELDS},'hourly':{'time':[(start+timedelta(hours=i)).strftime('%Y-%m-%dT%H:%M') for i in range(96)],**{f:[None if i==0 else 12.5 for i in range(96)] for f in w.FIELDS}}}
    def test_hour_alignment_nulls_and_cache(self):
        with patch.object(w,'urlopen') as urlopen:
            urlopen.return_value.__enter__.return_value.read.return_value=json.dumps(self.fixture()).encode()
            data=w.fetch_forecasts([(13,89)]);self.assertEqual(len(data['points'][0]['times']),72)
            self.assertIsNone(data['points'][0]['values']['precipitation'][0]);self.assertIsNone(data['forecastRunAt'])
            w.fetch_forecasts([(13,89)]);urlopen.assert_called_once()
    def test_provider_failure_returns_unavailable(self):
        with patch.object(w,'urlopen',side_effect=TimeoutError):
            with self.assertRaises(HTTPException) as error:w.fetch_forecasts([(13,89)])
            self.assertEqual(error.exception.status_code,503)
    def test_stale_or_incomplete_provider_not_relabelled_current(self):
        with patch.object(w,'urlopen') as urlopen:
            urlopen.return_value.__enter__.return_value.read.return_value=json.dumps(self.fixture(-7)).encode()
            with self.assertRaises(HTTPException):w.fetch_forecasts([(13,89)])
            urlopen.return_value.__enter__.return_value.read.return_value=json.dumps(self.fixture()).encode()
            with self.assertRaises(HTTPException):w.fetch_forecasts([(13,89),(14,90)])

if __name__=='__main__':unittest.main()
