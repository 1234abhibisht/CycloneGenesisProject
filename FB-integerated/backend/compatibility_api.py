"""Adapters for the preserved frontend. No synthetic forecasts or impacts."""
from fastapi import FastAPI, HTTPException
import research_api as research

app=FastAPI(title='Cyclone AI · preserved frontend integration')

@app.get('/api/basin/risk')
def basin():
    result=research.formation()['data']
    return {'data':{'generatedAt':result['issuedAt'],'source':result['source'],'status':'LATEST_AVAILABLE',
      'summary':result['description']+' Bands describe scores only, not hazard severity.',
      'zones':[{'id':c['id'],'name':f"ERA5 cell {c['id']}",'basin':'North Indian Ocean','lat':c['lat'],'lon':c['lon'],
        'sst':c['sst'] or 0,'shear':0,'humidity':0,'probability':round(c['score']*100,2),
        'riskLevel':'HIGH' if c['score']>=.5 else 'MODERATE' if c['score']>=.1 else 'LOW'} for c in result['cells']]}}

@app.get('/api/historical/catalog')
def catalog():
    result=research.catalog()
    result['storms']=[{**s,'peakIMDGrade':research.grade(s['maxWind']),'landfallLocation':'Not assessed','landfallDate':'',
        'summary':'NOAA IBTrACS historical observations; IMD wind and pressure.'} for s in result['storms']]
    return result

@app.get('/api/historical/{storm_id}/replay')
def replay(storm_id:str,step:int=0):
    storm=research.historical_storm(storm_id)
    points=[{**point,'step':i} for i,point in enumerate(storm['track'])]
    index=max(0,min(step,len(points)-1))
    return {'status':200,'data':{'storm':{**storm,'landfallLocation':'Not assessed','summary':'Recorded historical track; not a current forecast.'},
      'replayState':{'currentStep':index,'totalSteps':len(points),'currentObservation':points[index],
       'observedTrackSoFar':points[:index+1],'actualFutureTrack':points[index+1:]}}}

@app.get('/api/sql/records')
def records(limit:int=10):
    rows=research.archive.sort_values('ISO_TIME',ascending=False).head(max(1,min(limit,100)))
    return {'records':[{'storm_id':r['SID'],'name':r['NAME'],'timestamp':research.iso(r['ISO_TIME']),
      'lat':float(r['LAT']),'lon':float(r['LON']),'wind_speed':research.finite(r['NEWDELHI_WIND']),
      'pressure':research.finite(r['NEWDELHI_PRES']),'source':'IBTrACS archive'} for r in rows.to_dict('records')]}

@app.get('/api/sources/status')
def sources():
    return {'sources':[{'source':s['name'],'purpose':s['description'],'role':s['status'],
       'status':'AVAILABLE' if s['status']=='Integrated' else 'UNAVAILABLE','checkedAt':research.now()} for s in research.provenance()['sources']]}

@app.get('/api/cyclone/{storm_id}/{feature}')
def optional_feature(storm_id:str,feature:str):
    if feature=='predictions':return research.predictions(storm_id)
    if feature=='risk':return research.risk(storm_id)
    raise HTTPException(409,'No validated '+feature+' output is available. Follow official IMD and local authority guidance.')

app.mount('/',research.app)
