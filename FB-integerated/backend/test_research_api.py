"""Data-contract checks against the fitted artifacts, without retraining."""
import unittest, hashlib, json
from unittest.mock import patch
import numpy as np
import pandas as pd
from fastapi import HTTPException
import research_api as api

class ResearchContract(unittest.TestCase):
    def setUp(self): self.original=dict(api.state)
    def tearDown(self): api.state.update(self.original)

    def test_bundle_hashes(self):
        for path,expected in api.manifest['files'].items():
            self.assertEqual(hashlib.sha256((api.ROOT/path).read_bytes()).hexdigest(),expected,path)

    def test_no_future_inputs(self):
        for task,features in api.features.items():
            self.assertFalse(set(features)&{'target','wind_24h','lat_24h','lon_24h','target_dlat','target_dlon'})
            self.assertEqual(features,list(api.preprocessors[task].feature_names_in_))

    def test_inference_and_replay_coherence(self):
        for case in api.case_records[::17]:
            api.set_mode(api.ModeSelection(mode='replay',caseId=case['id']))
            storm=api.active()['data'][0]
            forecast=api.predictions(storm['id'])['data']
            self.assertEqual(storm['id'],forecast['stormId'])
            self.assertEqual(storm['currentPosition']['timestamp'],forecast['issuedAt'])
            self.assertTrue(all(p['timestamp']<=forecast['issuedAt'] for p in storm['track']))
            self.assertEqual([p['forecastHour'] for p in forecast['forecastPoints']],[24])
            self.assertIsNone(forecast['forecastPoints'][0]['predictedPressure'])
            self.assertIsNone(forecast['forecastPoints'][0]['uncertainty'])
            self.assertEqual(storm['dataSource'],'replay')

    def test_targets_do_not_affect_prediction(self):
        case=api.case_records[0]['id']; index=api.cases.index[api.cases.row_id.astype(str)==case][0]
        before=api.infer_case(case)['forecastPoints']
        cols=['wind_24h','lat_24h','lon_24h']; old=api.cases.loc[index,cols].copy()
        try:
            api.cases.loc[index,cols]=[199,70,150]
            api.infer_case.cache_clear()
            self.assertEqual(before,api.infer_case(case)['forecastPoints'])
        finally:
            api.cases.loc[index,cols]=old;api.infer_case.cache_clear()

    def test_unknown_case_rejected(self):
        with self.assertRaises(HTTPException): api.set_mode(api.ModeSelection(mode='replay',caseId='invalid'))
        self.assertEqual(api.state,self.original)

    def test_no_fabricated_live_forecast(self):
        api.set_mode(api.ModeSelection(mode='live'))
        with self.assertRaises(HTTPException) as context: api.predictions('ACTIVE')
        self.assertEqual(context.exception.status_code,409)

    def test_live_failure_is_not_all_clear(self):
        api.live_cache.update(at=0,value=None)
        with patch.object(api,'urlopen',side_effect=TimeoutError): result=api.live_observations()
        self.assertTrue(result['unavailable']);self.assertEqual(result['status'],'OFFLINE')
        self.assertEqual(result['data'],[])
        api.live_cache.update(at=0,value=None)

    def test_formation_output_contract(self):
        result=api.formation()['data']
        self.assertGreater(len(result['cells']),0)
        self.assertTrue(all(0<=c['score']<=1 for c in result['cells']))
        self.assertIn('Uncalibrated',result['description'])

    def test_risk_remains_coherent_during_case_switch(self):
        first, second = api.case_records[0]['id'], api.case_records[-1]['id']
        api.set_mode(api.ModeSelection(mode='replay',caseId=first))
        expected = api.risk('ACTIVE')
        original_infer = api.infer_case
        def switch_during_inference(case_id):
            api.set_mode(api.ModeSelection(mode='replay',caseId=second))
            return original_infer(case_id)
        with patch.object(api, 'infer_case', side_effect=switch_during_inference):
            actual = api.risk('ACTIVE')
        self.assertEqual(actual['issuedAt'], expected['issuedAt'])
        self.assertEqual(actual['districts'], expected['districts'])

    def test_risk_is_distance_only(self):
        result=api.risk('ACTIVE')
        self.assertEqual(result['dataSource'],'replay')
        self.assertTrue(all(d['expectedSurgeM'] is None and d['estimatedWindKts'] is None for d in result['districts']))
        self.assertTrue(all(d['distanceKm']>=0 for d in result['districts']))

if __name__=='__main__': unittest.main()
