export const knotsToKmh = (knots: number): number => knots * 1.852;
export const knotsToMph = (knots: number): number => knots * 1.15078;
export const kmhToKnots = (kmh: number): number => kmh / 1.852;

export const formatWindSpeed = (knots: number, unit: 'knots' | 'kmh' | 'mph' = 'knots'): string => {
  if (unit === 'kmh') return `${Math.round(knotsToKmh(knots))} km/h`;
  if (unit === 'mph') return `${Math.round(knotsToMph(knots))} mph`;
  return `${Math.round(knots)} knots`;
};

export const formatPressure = (hPa: number): string => `${Math.round(hPa)} hPa`;

export const formatCoordinate = (value: number, type: 'lat' | 'lon'): string => {
  const isPositive = value >= 0;
  const absValue = Math.abs(value);
  const degrees = Math.floor(absValue);
  const minutes = Math.round((absValue - degrees) * 60);
  
  let dir = '';
  if (type === 'lat') dir = isPositive ? 'N' : 'S';
  if (type === 'lon') dir = isPositive ? 'E' : 'W';
  
  return `${degrees}°${minutes}'${dir}`;
};

export const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' IST';
};

export const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
};

export const formatDistance = (km: number): string => `${Math.round(km)} km`;
