// Cyclone AI Design System - Custom Hooks
import { useState, useEffect, useCallback, useRef } from 'react';

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Breakpoint hooks
export function useBreakpoint() {
  const xs = useMediaQuery('(max-width: 599px)');
  const sm = useMediaQuery('(min-width: 600px) and (max-width: 904px)');
  const md = useMediaQuery('(min-width: 905px) and (max-width: 1239px)');
  const lg = useMediaQuery('(min-width: 1240px) and (max-width: 1439px)');
  const xl = useMediaQuery('(min-width: 1440px) and (max-width: 1919px)');
  useMediaQuery('(min-width: 1920px)');

  if (xs) return 'xs';
  if (sm) return 'sm';
  if (md) return 'md';
  if (lg) return 'lg';
  if (xl) return 'xl';
  return 'xxl';
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 904px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 600px) and (max-width: 1239px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1240px)');
}

// Reduced motion hook
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// Theme hook
export function useColorScheme(): 'light' | 'dark' {
  return useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
}

// Intersection Observer hook
export function useInView(options: IntersectionObserverInit = {}): { ref: React.RefObject<HTMLElement | null>; isInView: boolean } {
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: '0px',
      ...options,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return { ref, isInView };
}

// Window size hook
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

// Scroll position hook
export function useScrollPosition(): { x: number; y: number } {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = () => setPosition({ x: window.scrollX, y: window.scrollY });
    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    return () => window.removeEventListener('scroll', updatePosition);
  }, []);

  return position;
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// Session storage hook
export function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
}

// Click outside hook
export function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Keyboard shortcut hook
export function useKeyboardShortcut(keys: string[], callback: () => void, options: { preventDefault?: boolean; stopPropagation?: boolean; target?: EventTarget } = {}) {
  const { preventDefault = true, stopPropagation = false, target = window } = options;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const pressedKeys: string[] = [];
      if (e.ctrlKey || e.metaKey) pressedKeys.push('mod');
      if (e.shiftKey) pressedKeys.push('shift');
      if (e.altKey) pressedKeys.push('alt');
      pressedKeys.push(e.key.toLowerCase());

      const match = keys.some(key => {
        const keyParts = key.toLowerCase().split('+');
        return keyParts.every(k => pressedKeys.includes(k)) && pressedKeys.length === keyParts.length;
      });

      if (match) {
        if (preventDefault) e.preventDefault();
        if (stopPropagation) e.stopPropagation();
        callback();
      }
    };

    target.addEventListener('keydown', handler as EventListener);
    return () => target.removeEventListener('keydown', handler as EventListener);
  }, [keys, callback, preventDefault, stopPropagation, target]);
}

// Copy to clipboard hook
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopied(false);
    }
  }, []);

  return [copied, copy];
}

// Online status hook
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    setOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

// Geolocation hook
export function useGeolocation(options: PositionOptions = {}): { position: GeolocationPosition | null; error: GeolocationPositionError | null; loading: boolean } {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation not supported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setPosition(pos); setError(null); setLoading(false); },
      (err) => { setError(err); setLoading(false); },
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  return { position, error, loading };
}

// Device orientation hook
export function useDeviceOrientation(): { alpha: number | null; beta: number | null; gamma: number | null } {
  const [orientation, setOrientation] = useState<{ alpha: number | null; beta: number | null; gamma: number | null }>({ alpha: null, beta: null, gamma: null });

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      setOrientation({ alpha: e.alpha, beta: e.beta, gamma: e.gamma });
    };

    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  return orientation;
}

// Battery status hook
export function useBattery(): { charging: boolean; level: number; chargingTime: number | null; dischargingTime: number | null } | null {
  const [battery, setBattery] = useState<{ charging: boolean; level: number; chargingTime: number | null; dischargingTime: number | null } | null>(null);

  useEffect(() => {
    if ('getBattery' in navigator) {
      const batteryPromise = (navigator as unknown as { getBattery: () => Promise<any> }).getBattery();
      batteryPromise.then((b: any) => {
        const updateBattery = () => setBattery({
          charging: b.charging,
          level: b.level,
          chargingTime: b.chargingTime,
          dischargingTime: b.dischargingTime,
        });
        updateBattery();
        b.addEventListener('chargingchange', updateBattery);
        b.addEventListener('levelchange', updateBattery);
        b.addEventListener('chargingtimechange', updateBattery);
        b.addEventListener('dischargingtimechange', updateBattery);
        return () => {
          b.removeEventListener('chargingchange', updateBattery);
          b.removeEventListener('levelchange', updateBattery);
          b.removeEventListener('chargingtimechange', updateBattery);
          b.removeEventListener('dischargingtimechange', updateBattery);
        };
      });
    }
  }, []);

  return battery;
}