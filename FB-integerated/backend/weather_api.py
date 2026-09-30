"""GFS forecasts from Open-Meteo; no synthetic fallback and no model mixing."""
import json, math, time
from datetime import datetime, timezone
from threading import Lock
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from fastapi import APIRouter, HTTPException, Query

router=APIRouter(prefix='/api/weather',tags=['Weather explorer'])
FIELDS=['wind_speed_10m','wind_direction_10m','wind_gusts_10m','precipitation','pressure_msl','temperature_2m','cloud_cover']
cache={}; lock=Lock()

def now(): return datetime.now(timezone.utc).isoformat()
def coordinates(lat,lon):
    if not all(math.isfinite(v) for v in [lat,lon]) or not (-90<=lat<=90 and -180<=lon<=180):
        raise HTTPException(422,'Coordinates must be finite WGS84 latitude/longitude.')

def fetch_forecasts(points):
    key=tuple((round(lat,3),round(lon,3)) for lat,lon in points)
    with lock:
        item=cache.get(key)
        if item and time.monotonic()-item[0]<900: return item[1]
    params={'latitude':','.join(str(p[0]) for p in key),'longitude':','.join(str(p[1]) for p in key),'hourly':','.join(FIELDS),'forecast_days':4,'timezone':'GMT','wind_speed_unit':'kn','models':'gfs_seamless'}
    url='https://api.open-meteo.com/v1/gfs?'+urlencode(params)
    try:
        with urlopen(Request(url,headers={'User-Agent':'CycloneAI-Research/4.1'}),timeout=18) as response:
            raw=response.read(5_000_001)
        if len(raw)>5_000_000: raise ValueError('Response exceeds expected size')
        payload=json.loads(raw)
        rows=payload if isinstance(payload,list) else [payload]
        if len(rows)!=len(key): raise ValueError('Incomplete location coverage')
        results=[]; cutoff=datetime.now(timezone.utc).replace(minute=0,second=0,microsecond=0)
        for (lat,lon),row in zip(key,rows):
            hourly=row['hourly']; units=row['hourly_units']; times=hourly['time']
            indices=[i for i,t in enumerate(times) if datetime.fromisoformat(t).replace(tzinfo=timezone.utc)>=cutoff][:72]
            if len(indices)<24: raise ValueError('Provider returned stale or short forecast')
            values={f:[hourly[f][i] if hourly[f][i] is not None and math.isfinite(hourly[f][i]) else None for i in indices] for f in FIELDS}
            results.append({'lat':lat,'lon':lon,'gridLat':row['latitude'],'gridLon':row['longitude'],'times':[times[i]+'Z' for i in indices],'values':values,'units':{f:units[f] for f in FIELDS}})
        result={'source':'NOAA GFS via Open-Meteo','sourceUrl':'https://open-meteo.com/en/docs/gfs-api','model':'GFS seamless','fetchedAt':now(),'forecastRunAt':None,'timeZone':'UTC','points':results,'note':'Numerical weather forecast, separate from the archived XGBoost cyclone model. Retrieval time is not model initialization time.'}
    except Exception as exc:
        raise HTTPException(503,'GFS provider unavailable. No replacement weather values are generated.') from exc
    with lock:
        if len(cache)>=40: cache.pop(next(iter(cache)))
        cache[key]=(time.monotonic(),result)
    return result

@router.get('/point')
def point(lat:float=Query(...,ge=-90,le=90),lon:float=Query(...,ge=-180,le=180)):
    coordinates(lat,lon)
    return fetch_forecasts([(lat,lon)])

@router.get('/grid')
def grid(lat:float=Query(15,ge=0,le=35),lon:float=Query(85,ge=50,le=105)):
    coordinates(lat,lon)
    # Twenty-five samples over a 12-degree square: arrows, not invented fine-resolution fields.
    centre=(round(lat),round(lon))
    points=[(centre[0]+dy,centre[1]+dx) for dy in [-6,-3,0,3,6] for dx in [-6,-3,0,3,6]]
    return {**fetch_forecasts(points),'sampleSpacingDegrees':3,'samplingNote':'25 forecast sample points spaced 3° apart. Not radar, flood extent, or a high-resolution hazard map.'}
