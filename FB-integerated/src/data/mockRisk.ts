import type { RiskAssessmentResult, DistrictRisk } from '../types/risk';
import { coastalDistricts } from './mockDistricts';

export const mockRiskDistricts: DistrictRisk[] = coastalDistricts.map(d => {
  let level: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE' = 'NONE';
  let reason = 'District is far from the predicted track.';
  let distance = 350;
  let forecastWindow = 'N/A';
  let intersects = false;

  const highRisk = ['Puri', 'Jagatsinghpur', 'Kendrapara'];
  const modRisk = ['Ganjam', 'Bhadrak', 'Balasore', 'Srikakulam'];
  const lowRisk = ['South 24 Parganas', 'Medinipur East', 'Visakhapatnam'];

  if (highRisk.includes(d.name)) {
    level = 'HIGH';
    reason = 'District boundary intersects forecast uncertainty cone within 24-hour forecast window. Direct impact expected.';
    distance = 25;
    forecastWindow = '24-36 hours';
    intersects = true;
  } else if (modRisk.includes(d.name)) {
    level = 'MODERATE';
    reason = 'District is near the expected path and may experience peripheral effects like heavy rainfall and strong winds.';
    distance = 85;
    forecastWindow = '36-48 hours';
    intersects = true;
  } else if (lowRisk.includes(d.name)) {
    level = 'LOW';
    reason = 'District is at the outer edge of the influence zone.';
    distance = 180;
    forecastWindow = '48-72 hours';
    intersects = false;
  }

  return {
    district: d,
    riskLevel: level,
    distanceFromTrack: distance,
    forecastWindow,
    reason,
    intersectsUncertaintyCone: intersects,
  };
});

export const demoRiskAssessment: RiskAssessmentResult = {
  cycloneId: 'DEMO_CYCLONE',
  assessmentTime: new Date().toISOString(),
  districts: mockRiskDistricts,
  summary: {
    high: mockRiskDistricts.filter(d => d.riskLevel === 'HIGH').length,
    moderate: mockRiskDistricts.filter(d => d.riskLevel === 'MODERATE').length,
    low: mockRiskDistricts.filter(d => d.riskLevel === 'LOW').length,
    total: mockRiskDistricts.length,
  },
  dataSource: 'demo',
};
