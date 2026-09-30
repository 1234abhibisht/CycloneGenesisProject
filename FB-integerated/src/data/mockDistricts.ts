import type { District } from '../types/risk';

const createPolygon = (lon: number, lat: number, w: number, h: number): GeoJSON.Polygon => {
  return {
    type: 'Polygon',
    coordinates: [[
      [lon - w/2, lat - h/2],
      [lon + w/2, lat - h/2],
      [lon + w/2, lat + h/2],
      [lon - w/2, lat + h/2],
      [lon - w/2, lat - h/2]
    ]]
  };
};

export const coastalDistricts: District[] = [
  { id: 'd-puri', name: 'Puri', state: 'Odisha', centroid: [19.81, 85.83], geometry: createPolygon(85.83, 19.81, 0.4, 0.4) },
  { id: 'd-ganjam', name: 'Ganjam', state: 'Odisha', centroid: [19.38, 84.92], geometry: createPolygon(84.92, 19.38, 0.5, 0.5) },
  { id: 'd-kendrapara', name: 'Kendrapara', state: 'Odisha', centroid: [20.50, 86.42], geometry: createPolygon(86.42, 20.50, 0.3, 0.3) },
  { id: 'd-jagatsinghpur', name: 'Jagatsinghpur', state: 'Odisha', centroid: [20.26, 86.16], geometry: createPolygon(86.16, 20.26, 0.3, 0.3) },
  { id: 'd-bhadrak', name: 'Bhadrak', state: 'Odisha', centroid: [21.05, 86.51], geometry: createPolygon(86.51, 21.05, 0.4, 0.4) },
  { id: 'd-balasore', name: 'Balasore', state: 'Odisha', centroid: [21.49, 86.92], geometry: createPolygon(86.92, 21.49, 0.5, 0.5) },
  { id: 'd-south24', name: 'South 24 Parganas', state: 'West Bengal', centroid: [22.13, 88.36], geometry: createPolygon(88.36, 22.13, 0.6, 0.6) },
  { id: 'd-medinipur-e', name: 'Medinipur East', state: 'West Bengal', centroid: [21.94, 87.77], geometry: createPolygon(87.77, 21.94, 0.5, 0.5) },
  { id: 'd-kolkata', name: 'Kolkata', state: 'West Bengal', centroid: [22.57, 88.36], geometry: createPolygon(88.36, 22.57, 0.2, 0.2) },
  { id: 'd-srikakulam', name: 'Srikakulam', state: 'Andhra Pradesh', centroid: [18.29, 83.89], geometry: createPolygon(83.89, 18.29, 0.4, 0.4) },
  { id: 'd-vizag', name: 'Visakhapatnam', state: 'Andhra Pradesh', centroid: [17.68, 83.21], geometry: createPolygon(83.21, 17.68, 0.5, 0.5) },
  { id: 'd-eastgodavari', name: 'East Godavari', state: 'Andhra Pradesh', centroid: [17.32, 82.23], geometry: createPolygon(82.23, 17.32, 0.6, 0.6) },
  { id: 'd-krishna', name: 'Krishna', state: 'Andhra Pradesh', centroid: [16.16, 81.04], geometry: createPolygon(81.04, 16.16, 0.5, 0.5) },
  { id: 'd-nellore', name: 'Nellore', state: 'Andhra Pradesh', centroid: [14.44, 79.98], geometry: createPolygon(79.98, 14.44, 0.6, 0.6) },
  { id: 'd-chennai', name: 'Chennai', state: 'Tamil Nadu', centroid: [13.08, 80.27], geometry: createPolygon(80.27, 13.08, 0.3, 0.3) },
  { id: 'd-cuddalore', name: 'Cuddalore', state: 'Tamil Nadu', centroid: [11.74, 79.76], geometry: createPolygon(79.76, 11.74, 0.4, 0.4) },
  { id: 'd-nagapattinam', name: 'Nagapattinam', state: 'Tamil Nadu', centroid: [10.76, 79.84], geometry: createPolygon(79.84, 10.76, 0.3, 0.3) },
  { id: 'd-junagadh', name: 'Junagadh', state: 'Gujarat', centroid: [21.52, 70.46], geometry: createPolygon(70.46, 21.52, 0.7, 0.7) },
  { id: 'd-girsomnath', name: 'Gir Somnath', state: 'Gujarat', centroid: [20.94, 70.68], geometry: createPolygon(70.68, 20.94, 0.5, 0.5) },
  { id: 'd-raigad', name: 'Raigad', state: 'Maharashtra', centroid: [18.52, 73.18], geometry: createPolygon(73.18, 18.52, 0.6, 0.6) }
];
