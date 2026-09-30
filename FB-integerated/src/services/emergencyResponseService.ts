import { supabase, supabaseEnabled } from '../lib/supabaseClient';

export type FieldDevice = {
  id: string;
  label: string;
  district: string;
  channel: 'SIREN' | 'SMS GATEWAY' | 'SHELTER RADIO' | 'FISHER VHF';
  distanceKm: number;
  battery: number;
  lastSeen: string;
  status: 'READY' | 'CHECK-IN DUE';
};

export type EvacuationPlan = {
  district: string;
  safePlace: string;
  capacity: number;
  occupancy: number;
  route: string;
  evacuationMinutes: number;
  departureBy: string;
};

export const demoDevices: FieldDevice[] = [
  { id: 'OD-PURI-01', label: 'Puri Coastal Siren 01', district: 'Puri', channel: 'SIREN', distanceKm: 3.2, battery: 94, lastSeen: 'Just now', status: 'READY' },
  { id: 'OD-PURI-02', label: 'Puri shelter radio', district: 'Puri', channel: 'SHELTER RADIO', distanceKm: 4.1, battery: 88, lastSeen: '1 min ago', status: 'READY' },
  { id: 'WB-S24-07', label: 'Sundarbans VHF relay', district: 'South 24 Parganas', channel: 'FISHER VHF', distanceKm: 8.7, battery: 76, lastSeen: '2 min ago', status: 'READY' },
  { id: 'AP-SRI-03', label: 'Srikakulam SMS gateway', district: 'Srikakulam', channel: 'SMS GATEWAY', distanceKm: 11.4, battery: 63, lastSeen: '7 min ago', status: 'CHECK-IN DUE' },
  { id: 'OD-GAN-04', label: 'Ganjam Coastal Siren 04', district: 'Ganjam', channel: 'SIREN', distanceKm: 14.8, battery: 91, lastSeen: 'Just now', status: 'READY' },
];

export const demoEvacuations: EvacuationPlan[] = [
  { district: 'Puri', safePlace: 'Puri Municipal Cyclone Shelter', capacity: 850, occupancy: 210, route: 'NH-316 → Block Road 4', evacuationMinutes: 34, departureBy: 'T−05:20' },
  { district: 'South 24 Parganas', safePlace: 'Gosaba High School Shelter', capacity: 620, occupancy: 185, route: 'Gosaba Main Road → School Lane', evacuationMinutes: 48, departureBy: 'T−05:05' },
  { district: 'Srikakulam', safePlace: 'Kalingapatnam Relief Centre', capacity: 540, occupancy: 98, route: 'SH-4 → Relief Centre Road', evacuationMinutes: 42, departureBy: 'T−04:40' },
];

export async function getResponseDevices(): Promise<FieldDevice[]> {
  if (!supabase) return demoDevices;
  const { data, error } = await supabase.from('field_devices').select('*').limit(100);
  if (error || !data?.length) return demoDevices;
  return data as FieldDevice[];
}

export async function queueWarning(deviceIds: string[], district: string, message: string) {
  const dispatchId = `ALERT-${Date.now().toString(36).toUpperCase()}`;
  if (!supabase) return { dispatchId, delivery: 'DEMO QUEUED' as const, persisted: false };

  const { error } = await supabase.from('alert_dispatches').insert({
    dispatch_id: dispatchId,
    district,
    device_ids: deviceIds,
    message,
    status: 'QUEUED',
  });
  return { dispatchId, delivery: error ? 'LOCAL QUEUED' as const : 'QUEUED' as const, persisted: !error };
}

export { supabaseEnabled };
