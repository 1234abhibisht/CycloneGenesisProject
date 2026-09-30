"""Local research API. Real IBTrACS/ERA5 data; no fabricated operational forecasts."""
from pathlib import Path
from datetime import datetime, timezone
from threading import RLock
from functools import lru_cache
import json, math, io, time
from urllib.request import urlopen, Request
import numpy as np
import pandas as pd
import joblib
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).parent / 'research_data'
manifest = json.loads((ROOT/'manifest.json').read_text())
archive = pd.read_pickle(ROOT/'ibtracs_ni.pkl')
frames = {task: pd.read_pickle(ROOT/task/'test_prepared.pkl') for task in ['intensity','track','formation']}
features = {task: json.loads((ROOT/task/'features.json').read_text()) for task in frames}
preprocessors = {task: joblib.load(ROOT/task/'preprocessing.joblib') for task in frames}
metrics = {task: json.loads((ROOT/task/'metrics.json').read_text()) for task in frames}
models = {}
for task, names in [('intensity',['wind_24h']),('track',['target_dlat','target_dlon']),('formation',['formation'])]:
    for name in names:
        model = xgb.XGBClassifier(n_jobs=2) if task=='formation' else xgb.XGBRegressor(n_jobs=2)
        model.load_model(ROOT/task/f'{name}.ubj')
        models[name] = model
districts = json.loads((ROOT/'districts.json').read_text())
threshold_info = json.loads((ROOT/'formation'/'decision_threshold.json').read_text())
cases = frames['intensity'].merge(frames['track'][['row_id']], on='row_id').sort_values('time')
names = archive.groupby('SID').NAME.first().to_dict()
case_records = [{'id': str(r.row_id), 'stormId':r.SID, 'name':str(names.get(r.SID,r.SID)), 'time':pd.Timestamp(r.time).isoformat()+'Z', 'wind':float(r.wind)} for r in cases.itertuples()]
state_lock = RLock()
state = {'mode':'replay', 'caseId':str(cases.loc[cases.wind.idxmax()].row_id)}
live_cache = {'at':0, 'value':None}
app = FastAPI(title='Vector Minds · Cyclone Research API', version='4.0.0-research')
app.add_middleware(CORSMiddleware, allow_origins=['http://127.0.0.1:3000','http://localhost:3000'], allow_methods=['GET','POST'], allow_headers=['Content-Type','X-Operator-Key','X-Subscription-Token'])

def now(): return datetime.now(timezone.utc).isoformat()
def finite(value): return float(value) if pd.notna(value) and math.isfinite(float(value)) else None
def iso(value): return pd.Timestamp(value).isoformat().replace('+00:00','')+'Z'
def grade(wind):
    if wind is None: return None
    return next((label for threshold,label in [(120,'SuCS'),(90,'ESCS'),(64,'VSCS'),(48,'SCS'),(34,'CS'),(28,'DD')] if wind>=threshold),'D')
def selected_row():
    with state_lock: selected = state['caseId']
    return cases.loc[cases.row_id.astype(str)==selected].iloc[0]
def point(row):
    wind = finite(row['NEWDELHI_WIND'])
    return {'timestamp':iso(row['ISO_TIME']),'lat':float(row['LAT']),'lon':float(row['LON']),'windSpeed':wind,'pressure':finite(row['NEWDELHI_PRES']),'nature':'TS','stormSpeed':None,'stormDir':None,'imdGrade':grade(wind)}
def historical_storm(sid, issue=None):
    rows = archive[archive.SID==sid]
    if rows.empty: raise HTTPException(404,'Storm not found in the local IBTrACS archive.')
    all_rows = rows
    if issue is not None: rows = rows[pd.to_datetime(rows.ISO_TIME)<=pd.Timestamp(issue)]
    pts = [point(r) for r in rows.to_dict('records')]
    if not pts: raise HTTPException(404,'No observation at or before the selected time.')
    return {'id':sid,'name':str(names.get(sid,sid)),'season':int(all_rows.SEASON.iloc[0]),'basin':'NI','subBasin':str(all_rows.SUBBASIN.iloc[0]),'status':'active' if issue is not None else 'dissipated','dataSource':'replay' if issue is not None else 'historical','isReplay':issue is not None,'lastUpdated':pts[-1]['timestamp'],'startDate':pts[0]['timestamp'],'endDate':pts[-1]['timestamp'],'maxWind':finite(rows.NEWDELHI_WIND.max()),'minPressure':finite(rows.NEWDELHI_PRES.min()),'peakIMDGrade':grade(finite(rows.NEWDELHI_WIND.max())),'currentPosition':pts[-1],'track':pts,'source':'NOAA IBTrACS v04r01 · IMD wind/pressure'}

def replay_storm():
    row = selected_row()
    storm = historical_storm(row.SID,row.time)
    storm['environmental'] = {'seaSurfaceTemp':finite(row.sst_mean),'windShear':None,'relativeHumidity':None,'surfacePressure':finite(row.msl_mean),'surfaceWind':finite(row.speed10_mean),'airTemperature':finite(row.t2m_mean),'dewpoint':finite(row.d2m_mean)}
    storm['environmentalSource'] = 'ERA5 reanalysis · issue-time spatial averages'
    storm['caseId'] = str(row.row_id)
    return storm

def live_observations():
    # NOAA's ACTIVE file means records from the last seven days. Only observations
    # no older than 24 hours are displayed as current; never equate feed failure with all-clear.
    with state_lock:
        if live_cache['value'] is not None and time.monotonic()-live_cache['at']<300: return live_cache['value']
    url='https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.ACTIVE.list.v04r01.csv'
    try:
        with urlopen(Request(url,headers={'User-Agent':'CycloneAI-Research/4.0'}),timeout=6) as response:
            raw=response.read(30_000_000)
        data=pd.read_csv(io.BytesIO(raw),skiprows=[1],low_memory=False,na_values=[' '])
        data=data[(data.BASIN=='NI') & (data.TRACK_TYPE=='main')].copy()
        for col in ['LAT','LON','NEWDELHI_WIND','NEWDELHI_PRES']: data[col]=pd.to_numeric(data[col],errors='coerce')
        data=data.dropna(subset=['LAT','LON'])
        cutoff=pd.Timestamp.now(tz='UTC')-pd.Timedelta(hours=24)
        storms=[]
        for sid, rows in data.groupby('SID'):
            rows=rows.sort_values('ISO_TIME'); latest=pd.to_datetime(rows.ISO_TIME.iloc[-1],utc=True)
            if latest<cutoff or latest>pd.Timestamp.now(tz='UTC')+pd.Timedelta(hours=1): continue
            latest_wind=finite(rows.NEWDELHI_WIND.iloc[-1])
            if latest_wind is None or latest_wind<34 or str(rows.NATURE.iloc[-1])!='TS': continue
            pts=[point(r) for r in rows.to_dict('records')]
            storms.append({'id':sid,'name':str(rows.NAME.iloc[-1]),'season':int(rows.SEASON.iloc[-1]),'basin':'NI','subBasin':str(rows.SUBBASIN.iloc[-1]),'status':'active','dataSource':'live','isReplay':False,'lastUpdated':pts[-1]['timestamp'],'currentPosition':pts[-1],'track':pts,'source':'NOAA IBTrACS ACTIVE · provisional, within 24h'})
        result={'status':'LIVE' if storms else 'NO_ACTIVE_CYCLONE','active':bool(storms),'data':storms,'sources':['NOAA IBTrACS ACTIVE'],'lastChecked':now(),'monitoringRegion':'North Indian Ocean','environmentalBaseline':{},'message':'Latest provisional records; consult IMD for current operational status.'}
    except Exception:
        result={'status':'OFFLINE','active':False,'unavailable':True,'data':[],'message':'Current NOAA observations could not be verified. Use historical replay or official IMD advisories.'}
    with state_lock: live_cache.update(at=time.monotonic(),value=result)
    return result

@app.get('/api/cyclone/active')
def active():
    with state_lock: mode=state['mode']
    if mode=='live': return live_observations()
    return {'status':'REPLAY','active':True,'data':[replay_storm()],'lastUpdated':now()}

class ModeSelection(BaseModel):
    mode: str
    caseId: str | None = None

@app.get('/api/mode')
def get_mode():
    with state_lock: return {'operational_mode':state['mode'],'caseId':state['caseId']}

@app.post('/api/mode')
def set_mode(payload:ModeSelection):
    if payload.mode not in ['live','replay']: raise HTTPException(422,'Mode must be live or replay.')
    if payload.caseId is not None and payload.caseId not in {c['id'] for c in case_records}: raise HTTPException(422,'Unknown research case.')
    with state_lock:
        state['mode']=payload.mode
        if payload.caseId is not None: state['caseId']=payload.caseId
    return {'success':True,**get_mode()}

@app.get('/api/research/cases')
def get_cases(): return {'cases':case_records,**get_mode()}

@lru_cache(maxsize=180)
def infer_case(case_id):
    row=cases.loc[cases.row_id.astype(str)==case_id].iloc[0]
    input_row=row.to_frame().T
    transformed={task:preprocessors[task].transform(input_row[features[task]].astype(float)) for task in ['intensity','track']}
    wind=float(models['wind_24h'].predict(transformed['intensity'])[0])
    lat=float(row.lat)+float(models['target_dlat'].predict(transformed['track'])[0])
    lon=float(row.lon)+float(models['target_dlon'].predict(transformed['track'])[0])
    return {'stormId':row.SID,'caseId':case_id,'issuedAt':iso(row.time),'generatedAt':now(),'modelVersion':'ERA5-IBTrACS-XGBoost-24h','dataSource':'replay','forecastPoints':[{'forecastHour':24,'lat':lat,'lon':lon,'predictedWind':wind,'predictedPressure':None,'predictedIMDGrade':grade(wind),'uncertainty':None,'timestamp':iso(row.time+pd.Timedelta(hours=24))}],'intensityForecasts':[{'forecastHour':24,'windSpeed':wind,'pressure':None,'imdGrade':grade(wind),'trend':'intensifying' if wind>row.wind+2 else 'weakening' if wind<row.wind-2 else 'stable'}],'verification':{'lat':float(row.lat_24h),'lon':float(row.lon_24h),'wind':float(row.wind_24h),'timestamp':iso(row.time+pd.Timedelta(hours=24))},'limitations':['Retrospective test case; ERA5 reanalysis and revised best tracks are not operational inputs.','Only the 24-hour endpoint is predicted. No calibrated uncertainty cone, pressure or landfall model is supplied.']}

@app.get('/api/cyclone/{storm_id}/predictions')
def predictions(storm_id:str):
    with state_lock: mode,case_id=state['mode'],state['caseId']
    if mode!='replay': raise HTTPException(409,'This research model requires aligned ERA5 features; live inference is not configured.')
    result=infer_case(case_id)
    if storm_id not in ['ACTIVE',result['stormId']]: raise HTTPException(404,'Select a matching test case before running this storm.')
    return {'status':200,'stormId':result['stormId'],'data':result}

@app.get('/api/historical/catalog')
def catalog():
    items=[]
    for sid,rows in archive.groupby('SID'):
        items.append({'id':sid,'name':str(names[sid]),'season':int(rows.SEASON.iloc[0]),'basin':'NI','subBasin':str(rows.SUBBASIN.iloc[0]),'maxWind':finite(rows.NEWDELHI_WIND.max()),'minPressure':finite(rows.NEWDELHI_PRES.min()),'startDate':iso(rows.ISO_TIME.iloc[0]),'endDate':iso(rows.ISO_TIME.iloc[-1]),'totalSteps':len(rows),'modelCases':sum(c['stormId']==sid for c in case_records)})
    return {'storms':sorted(items,key=lambda r:r['startDate'],reverse=True),'source':manifest['archive'],'status':200}

@app.get('/api/historical/{storm_id}/replay')
def archive_detail(storm_id:str): return {'data':historical_storm(storm_id),'status':200}

@app.get('/api/districts/coastal')
def roster(): return {'districts':[{'id':d['id'],'name':d['name'],'state':d['state'],'centroid':[d['lat'],d['lon']]} for d in districts], 'source':'Existing reference centroids; not administrative boundary polygons.'}

@app.get('/api/cyclone/{storm_id}/risk')
def risk(storm_id:str):
    result=predictions(storm_id)['data']
    row=cases.loc[cases.row_id.astype(str)==result['caseId']].iloc[0]
    end=result['forecastPoints'][0]
    # Local equirectangular distance to a straight segment, explicitly a geometric screen.
    scale=111.195; coslat=math.cos(math.radians(float(row.lat)))
    start=np.array([float(row.lon)*coslat,float(row.lat)])*scale
    finish=np.array([end['lon']*coslat,end['lat']])*scale
    direction=finish-start; denom=float(direction@direction)
    output=[]
    for district in districts:
        pos=np.array([district['lon']*coslat,district['lat']])*scale
        frac=float(np.clip((pos-start)@direction/denom,0,1)) if denom else 0
        distance=float(np.linalg.norm(pos-(start+frac*direction)))
        level='RED' if distance<=50 else 'ORANGE' if distance<=150 else 'YELLOW' if distance<=300 else 'GREEN'
        output.append({'districtId':district['id'],'districtName':district['name'],'state':district['state'],'centroid':[district['lat'],district['lon']],'distanceKm':round(distance,1),'warningLevel':level,'estimatedWindKts':None,'expectedSurgeM':None,'statusText':'Geometric proximity only','closestHour':None})
    return {'status':200,'stormId':result['stormId'],'stormName':names[result['stormId']],'dataSource':'replay','issuedAt':result['issuedAt'],'generatedAt':now(),'districts':output,'method':'Reference centroid distance to the straight line joining the observed position and predicted +24h endpoint. ≤50 / ≤150 / ≤300 km are illustrative proximity bands, not hazard probabilities, official alerts, landfall or evacuation zones.'}

@app.get('/api/basin/risk')
def formation():
    with state_lock: mode=state['mode']
    if mode!='replay': raise HTTPException(409,'Formation research uses archived ERA5 inputs. Select replay.')
    issue=pd.Timestamp(selected_row().time).floor('6h')
    rows=frames['formation'][frames['formation'].time==issue]
    if rows.empty: raise HTTPException(404,'No prepared formation grid at this issue time.')
    x=preprocessors['formation'].transform(rows[features['formation']])
    scores=models['formation'].predict_proba(x)[:,1]
    cells=[{'id':str(r.cell),'lat':float(r.lat),'lon':float(r.lon),'score':float(score),'sst':finite(r.sst_mean),'observedOnset':int(r.target)} for r,score in zip(rows.itertuples(),scores)]
    return {'data':{'issuedAt':iso(issue),'source':'ERA5 + IBTrACS · held-out test split','threshold':threshold_info,'cells':cells,'description':'Uncalibrated XGBoost score for first observed IMD wind ≥34 kt in a 5° cell within 24h. This is a threshold-onset research proxy, not an operational genesis probability.'}}

@app.get('/api/models/performance')
def performance(): return {'metrics':metrics,'training':manifest['training'],'models':[{'name':'XGBoost formation','status':'Loaded','artifact':'formation.ubj'},{'name':'XGBoost intensity +24h','status':'Loaded','artifact':'wind_24h.ubj'},{'name':'XGBoost track +24h','status':'Loaded','artifact':'target_dlat.ubj + target_dlon.ubj'},{'name':'EfficientNet satellite features','status':'Planned in presentation; no trained artifact supplied'},{'name':'ConvLSTM temporal fusion','status':'Planned in presentation; no trained artifact supplied'},{'name':'Pressure / landfall / surge','status':'No validated trained model supplied'}], 'limitations':['Retrospective reanalysis, small storm sample, and best-track revisions limit operational interpretation.','Formation test recall is 22.5% at the validation-selected threshold.','Intensity validation MAE is worse than persistence; test MAE is better. Report both.']}

@app.get('/api/research/manifest')
def provenance(): return {**manifest,'models':performance(),'sources':[{'name':'IBTrACS','status':'Integrated','description':'Local North Indian Ocean main tracks, 1980–2025; IMD wind and pressure.'},{'name':'ERA5','status':'Integrated','description':'Prepared 1990–2008 SST, 10 m wind, 2 m temperature/dewpoint and mean sea-level pressure.'},{'name':'NOAA / INSAT satellite training','status':'Not integrated','description':'No aligned satellite training set or EfficientNet/ConvLSTM checkpoint is supplied.'},{'name':'NASA GIBS imagery','status':'Visualization only','description':'External map tiles are not model input.'}]}

@app.get('/api/system/status')
def health():
    return {'status':'RESEARCH_READY','system':'Vector Minds Cyclone AI','version':'4.0.0-research',**get_mode(),'timestamp':now(),'ml_inference_engine':{'models_loaded':True,'intensity_horizons':['24h'],'trajectory_model':True,'rapid_intensification':False},'historical_archive':{'total_storms':manifest['archive']['storms'],'sources':['NOAA IBTrACS v04r01']},'sqlite_database':{'status':'Local file bundle','total_records_stored':manifest['archive']['rows'],'persistence_enabled':False},'gis_risk_engine':{'status':'Geometric screening only','coastal_districts_monitored':len(districts),'surge_model':'Unavailable','warning_tiers':[]}}

# Keep research snapshots immutable across concurrent case selection.
def planning_forecast_snapshot():
    with state_lock: mode,case_id=state['mode'],state['caseId']
    if mode!='replay': raise HTTPException(409,'A current cyclone forecast is not configured. Select an archived case for an exercise, or define an official advisory area.')
    result=infer_case(case_id)
    row=cases.loc[cases.row_id.astype(str)==case_id].iloc[0]
    endpoint=result['forecastPoints'][0]
    return {'caseId':case_id,'name':names[result['stormId']],'stormId':result['stormId'],'issuedAt':result['issuedAt'],'dataSource':'replay','points':[[float(row.lat),float(row.lon)],[endpoint['lat'],endpoint['lon']]]}

from weather_api import router as weather_router
from planning_api import create_router as create_planning_router
app.include_router(weather_router)
app.include_router(create_planning_router(planning_forecast_snapshot,districts))

if __name__=='__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=8000)

