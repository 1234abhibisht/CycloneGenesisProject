// Cyclone AI - Alert System for SMS, IVR, Push Notifications
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type AlertSeverity = 'info' | 'watch' | 'warning' | 'danger' | 'critical';
export type AlertChannel = 'push' | 'sms' | 'ivr' | 'ussd' | 'email' | 'webhook';

export interface Alert {
  id: string;
  type: 'cyclone' | 'storm_surge' | 'heavy_rain' | 'wind' | 'flood' | 'evacuation' | 'all_clear';
  severity: AlertSeverity;
  title: string;
  message: string;
  language: string;
  region: {
    state: string;
    district?: string;
    coordinates?: [number, number];
    radius?: number;
  };
  channels: AlertChannel[];
  metadata: {
    cycloneName?: string;
    category?: number;
    windSpeed?: number;
    pressure?: number;
    surgeHeight?: number;
    rainfall?: number;
    validUntil?: string;
    issuedAt: string;
    issuedBy: string;
  };
  actions: AlertAction[];
  acknowledged: boolean;
  dismissed: boolean;
}

export interface AlertAction {
  label: string;
  type: 'navigate' | 'call' | 'sms' | 'share' | 'acknowledge' | 'dismiss';
  payload: string;
  style: 'primary' | 'secondary' | 'danger';
}

export interface AlertPreferences {
  enabled: boolean;
  channels: AlertChannel[];
  severityThreshold: AlertSeverity;
  regions: string[];
  languages: string[];
  quietHours: { enabled: boolean; start: string; end: string };
  cycloneCategories: number[];
  districts: string[];
}

interface AlertContextValue {
  alerts: Alert[];
  unreadCount: number;
  preferences: AlertPreferences;
  addAlert: (alert: Omit<Alert, 'id' | 'acknowledged' | 'dismissed'>) => void;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (prefs: Partial<AlertPreferences>) => void;
  subscribeToRegion: (region: string) => void;
  unsubscribeFromRegion: (region: string) => void;
  testAlert: (channel: AlertChannel) => void;
  requestPermission: () => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}

const SEVERITY_ORDER: AlertSeverity[] = ['info', 'watch', 'warning', 'danger', 'critical'];

const defaultPreferences: AlertPreferences = {
  enabled: true,
  channels: ['push', 'sms'],
  severityThreshold: 'watch',
  regions: [],
  languages: ['en'],
  quietHours: { enabled: false, start: '22:00', end: '07:00' },
  cycloneCategories: [1, 2, 3, 4, 5, 6, 7],
  districts: [],
};

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cyclone-ai-alerts');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [preferences, setPreferences] = useState<AlertPreferences>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cyclone-ai-alert-prefs');
        return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    localStorage.setItem('cyclone-ai-alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('cyclone-ai-alert-prefs', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'acknowledged' | 'dismissed'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      acknowledged: false,
      dismissed: false,
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 100));

    if (preferences.enabled && SEVERITY_ORDER.indexOf(alert.severity) >= SEVERITY_ORDER.indexOf(preferences.severityThreshold)) {
      sendNotification(newAlert);
    }
  }, [preferences]);

  const sendNotification = async (alert: Alert) => {
    const shouldNotify = alert.channels.some(channel => preferences.channels.includes(channel));
    if (!shouldNotify) return;

    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime >= preferences.quietHours.start || currentTime <= preferences.quietHours.end) {
        return;
      }
    }

    if (alert.channels.includes('push') && preferences.channels.includes('push') && notificationPermission === 'granted') {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/icons/alert-192.png',
        badge: '/icons/badge-72.png',
        tag: alert.id,
        requireInteraction: alert.severity === 'critical' || alert.severity === 'danger',
        data: { alertId: alert.id },
      });
    }

    if (alert.channels.includes('sms') || alert.channels.includes('ivr')) {
      try {
        await fetch('/api/alerts/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alert, channels: alert.channels.filter(c => ['sms', 'ivr'].includes(c)) }),
        });
      } catch (error) {
        console.error('Failed to send SMS/IVR:', error);
      }
    }
  };

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  const updatePreferences = useCallback((prefs: Partial<AlertPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  const subscribeToRegion = useCallback((region: string) => {
    setPreferences(prev => ({
      ...prev,
      regions: [...new Set([...prev.regions, region])],
    }));
  }, []);

  const unsubscribeFromRegion = useCallback((region: string) => {
    setPreferences(prev => ({
      ...prev,
      regions: prev.regions.filter(r => r !== region),
    }));
  }, []);

  const testAlert = useCallback(async (channel: AlertChannel) => {
    const testAlert: Omit<Alert, 'id' | 'acknowledged' | 'dismissed'> = {
      type: 'cyclone',
      severity: 'warning',
      title: 'Test Alert - Cyclone AI',
      message: `This is a test ${channel.toUpperCase()} alert from Cyclone AI. No action required.`,
      language: 'en',
      region: { state: 'Test State', district: 'Test District' },
      channels: [channel],
      metadata: {
        issuedAt: new Date().toISOString(),
        issuedBy: 'Cyclone AI Test System',
      },
      actions: [
        { label: 'Acknowledge', type: 'acknowledge', payload: '', style: 'primary' },
        { label: 'Dismiss', type: 'dismiss', payload: '', style: 'secondary' },
      ],
    };
    addAlert(testAlert);
  }, [addAlert]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission === 'granted';
  }, []);

  const unreadCount = alerts.filter(a => !a.acknowledged && !a.dismissed).length;

  const value: AlertContextValue = {
    alerts,
    unreadCount,
    preferences,
    addAlert,
    acknowledgeAlert,
    dismissAlert,
    clearAll,
    updatePreferences,
    subscribeToRegion,
    unsubscribeFromRegion,
    testAlert,
    requestPermission,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}

export function playAlertSound(severity: AlertSeverity) {
  if (typeof window === 'undefined') return;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  const frequencies = {
    info: 440,
    watch: 523,
    warning: 659,
    danger: 784,
    critical: 1047,
  };
  
  oscillator.frequency.value = frequencies[severity];
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 1);
}

export function vibrateAlert(severity: AlertSeverity) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  
  const patterns = {
    info: [100],
    watch: [200, 100, 200],
    warning: [300, 100, 300, 100, 300],
    danger: [500, 100, 500, 100, 500, 100, 500],
    critical: [1000, 200, 1000, 200, 1000],
  };
  
  navigator.vibrate(patterns[severity]);
}