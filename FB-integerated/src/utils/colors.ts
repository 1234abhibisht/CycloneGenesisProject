import type { IMDGrade } from '../types/cyclone';
import type { RiskLevel } from '../types/risk';

export const getIMDGradeColor = (grade: IMDGrade): string => {
  switch (grade) {
    case 'D': return '#10B981'; // green
    case 'DD': return '#F59E0B'; // yellow
    case 'CS': return '#F97316'; // orange
    case 'SCS': return '#EA580C'; // dark orange
    case 'VSCS': return '#EF4444'; // red
    case 'ESCS': return '#DC2626'; // intense red
    case 'SuCS': return '#A855F7'; // purple
    default: return '#64748B';
  }
};

export const getRiskLevelColor = (level: RiskLevel): string => {
  switch (level) {
    case 'RED': return '#EF4444';
    case 'ORANGE': return '#F97316';
    case 'YELLOW': return '#F59E0B';
    case 'GREEN': return '#10B981';
    default: return '#64748B';
  }
};

export const getSSHSColor = (category: number): string => {
  switch (category) {
    case -1: return '#38BDF8';
    case 0: return '#10B981';
    case 1: return '#F59E0B';
    case 2: return '#F97316';
    case 3: return '#EF4444';
    case 4: return '#DC2626';
    case 5: return '#A855F7';
    default: return '#64748B';
  }
};

export const getEnvironmentalColor = (_variable: string, _value: number): string => {
  return '#38BDF8';
};

export const getCycloneTrackColor = (windKnots: number): string => {
  if (windKnots < 34) return '#38BDF8';
  if (windKnots < 48) return '#10B981';
  if (windKnots < 64) return '#F59E0B';
  if (windKnots < 90) return '#F97316';
  if (windKnots < 120) return '#EF4444';
  return '#A855F7';
};
