// Cyclone AI - Enhanced Landing Page with Google Material 3 Design & India-Specific Features
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Map, TrendingUp, Satellite, History, Shield, Database, ArrowRight,
  Wind, Globe, Activity, Clock, Compass, Users, Building2, Flag, Waves,
  Layers, Brain, Cloud, Sun, Moon, Award, Radio, Wifi, MapPin, CheckCircle, Link as LinkIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView, useReducedMotion } from '../design-system/hooks';
import { cn } from '../design-system/ThemeProvider';
import { Button } from '../design-system/components';
import { useTheme } from '../design-system/ThemeProvider';
import { useLanguage } from '../features/multilingual/LanguageContext';

// Indian states with cyclone risk data
const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: 'AP', risk: 'Very High', cyclones: 42, coast: 974 },
  { name: 'Odisha', code: 'OD', risk: 'Very High', cyclones: 38, coast: 480 },
  { name: 'West Bengal', code: 'WB', risk: 'High', cyclones: 32, coast: 157 },
  { name: 'Tamil Nadu', code: 'TN', risk: 'High', cyclones: 28, coast: 1076 },
  { name: 'Gujarat', code: 'GJ', risk: 'High', cyclones: 25, coast: 1600 },
  { name: 'Maharashtra', code: 'MH', risk: 'Medium', cyclones: 18, coast: 720 },
  { name: 'Kerala', code: 'KL', risk: 'Medium', cyclones: 12, coast: 590 },
  { name: 'Karnataka', code: 'KA', risk: 'Low', cyclones: 8, coast: 320 },
  { name: 'Goa', code: 'GA', risk: 'Low', cyclones: 5, coast: 160 },
  { name: 'Puducherry', code: 'PY', risk: 'Medium', cyclones: 15, coast: 45 },
];

const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇮🇳' },
];

// Animated background components
const FloatingOrbs: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        className="absolute rounded-full blur-[120px] opacity-30"
        style={{
          width: `${150 + i * 60}px`,
          height: `${150 + i * 60}px`,
          left: `${10 + i * 15}%`,
          top: `${15 + i * 12}%`,
          background: i % 2 === 0
            ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.4), rgba(6, 182, 212, 0.2))'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(249, 115, 22, 0.2))',
        }}
        animate={{ scale: [1, 1.15, 1], x: [0, 20, -15, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 15 + i * 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

const CycloneSpiral: React.FC = () => (
  <motion.div
    className="absolute top-1/2 left-1/2 pointer-events-none"
    style={{ width: 600, height: 600, transform: 'translate(-50%, -50%)' }}
    animate={{ rotate: 360 }}
    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 600 600" className="w-full h-full">
      <defs>
        <radialGradient id="spiralGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 300 300)`}>
          <path
            d="M 300 300 Q 340 220 400 160 Q 440 100 480 60"
            fill="none"
            stroke="url(#spiralGrad)"
            strokeWidth={1.5 - i * 0.1}
            opacity={0.4 - i * 0.03}
            strokeDasharray="8 12"
          />
        </g>
      ))}
      {[40, 90, 150, 220, 300].map((r, i) => (
        <circle
          key={`ring-${i}`}
          cx="300" cy="300" r={r}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="0.5"
          opacity={0.1 - i * 0.015}
          strokeDasharray={`${6 + i * 3} ${12 + i * 6}`}
        />
      ))}
    </svg>
  </motion.div>
);

const RadarSweep: React.FC = () => (
  <motion.div
    className="absolute top-1/2 left-1/2 w-[400px] h-[400px] pointer-events-none"
    style={{ transform: 'translate(-50%, -50%)' }}
    animate={{ rotate: 360 }}
    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    aria-hidden="true"
  >
    <div className="absolute top-1/2 left-1/2 w-full h-full" style={{ transform: 'translate(-50%, -50%)' }}>
      <div
        className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
        style={{
          background: 'conic-gradient(from 0deg, transparent, rgba(20, 184, 166, 0.12) 25deg, transparent 50deg)',
          borderRadius: '100% 0 0',
        }}
      />
    </div>
    {[60, 120, 180, 240].map((r, i) => (
      <div
        key={i}
        className="absolute top-1/2 left-1/2 rounded-full border border-cyan-500/10"
        style={{
          width: r,
          height: r,
          transform: 'translate(-50%, -50%)',
        }}
      />
    ))}
  </motion.div>
);

const ParticleField: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {Array.from({ length: 30 }, (_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-cyan-400/30"
        style={{
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 53 + 7) % 100}%`,
          width: 1 + (i % 3),
          height: 1 + (i % 3),
        }}
        animate={{
          y: [-20, 20, -10, -20],
          x: [-10, 15, -15, -10],
          opacity: [0.3, 0.6, 0.4, 0.3],
        }}
        transition={{ duration: 8 + (i % 5) * 3, repeat: Infinity, ease: 'easeInOut', delay: (i % 7) * 0.5 }}
      />
    ))}
  </div>
);

// Hero Section
const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  const [typewriterText, setTypewriterText] = useState('');
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const taglines = [
    'Predict. Analyze. Prepare.',
    'भविष्यवाणी करें। विश्लेषण करें। तैयारी करें।',
    'پیش بینی کریں۔ تجزیہ کریں۔ تیاری کریں۔',
  ];

  useEffect(() => {
    let charIndex = 0;
    const currentTagline = taglines[typewriterIndex % taglines.length];
    const timer = setInterval(() => {
      if (charIndex < currentTagline.length) {
        setTypewriterText(currentTagline.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(timer);
        setTimeout(() => setTypewriterIndex(i => i + 1), 3000);
      }
    }, 80);
    return () => clearInterval(timer);
  }, [typewriterIndex]);

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(20,184,166,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(245,158,11,0.08)_0%,transparent_50%)]" />
        <FloatingOrbs />
        <CycloneSpiral />
        <RadarSweep />
        <ParticleField />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.2, 0, 0, 1] }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-emerald-400"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold tracking-wide text-cyan-300">{t('smartIndiaHackathon')}</span>
            <span className="w-px h-4 bg-white/10" />
            <span className="text-sm font-medium text-amber-300/80">{t('sihProject')}</span>
            <span className="w-px h-4 bg-white/10" />
            <span className="text-sm font-medium text-emerald-300/80" style={{ fontFamily: 'var(--font-devanagari)' }}>
              भारत सरकार
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.2, 0, 0, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] max-w-5xl mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 35%, #f59e0b 65%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('aiPowered')} <br className="hidden md:block" />
            <span style={{ fontFamily: 'var(--font-display)' }}>{t('cycloneIntelligence')}</span>
          </motion.h1>

          {/* Typewriter Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease: [0.2, 0, 0, 1] }}
            className="text-xl sm:text-2xl md:text-3xl font-light text-slate-300/90 mb-8 min-h-[4rem]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="bg-gradient-to-r from-cyan-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              {typewriterText}
            </span>
            <span className="inline-block w-[3px] h-[1em] ml-1 bg-cyan-400 animate-pulse align-middle" aria-hidden="true" />
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5, ease: [0.2, 0, 0, 1] }}
            className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            {t('heroDescription')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-10"
          >
            <Button
              size="lg"
              variant="filled"
              color="primary"
              fullWidth={false}
              className="group w-full sm:w-auto"
            >
              <RouterLink to="/dashboard">
                {t('enterDashboard')}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 ml-2" aria-hidden="true" />
              </RouterLink>
            </Button>
            <Button
              size="lg"
              variant="outlined"
              color="primary"
              fullWidth={false}
              className="w-full sm:w-auto"
            >
              <a href="#capabilities" className="flex items-center justify-center">
                {t('exploreCapabilities')}
              </a>
            </Button>
          </motion.div>

          {/* Live Status Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm"
          >
            <LiveStatusItem icon={<Radio className="w-4 h-4" />} label={t('liveMonitoring')} value="24/7" color="emerald" />
            <LiveStatusItem icon={<Wifi className="w-4 h-4" />} label={t('realTimeData')} value="< 30s" color="cyan" />
            <LiveStatusItem icon={<CheckCircle className="w-4 h-4" />} label={t('accuracyRate')} value="94.2%" color="amber" />
            <LiveStatusItem icon={<Flag className="w-4 h-4" />} label={t('coastalCoverage')} value="7,516 km" color="orange" />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" animate={{ y: [0, 6, 0], opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </div>
      </motion.div>
    </section>
  );
};

const LiveStatusItem: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const colorMap = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    orange: 'text-orange-400',
  };
  return (
    <div className="flex items-center gap-2 group">
      <span className={cn('flex items-center', colorMap[color as keyof typeof colorMap])}>{icon}</span>
      <div>
        <div className="text-white font-semibold text-lg">{value}</div>
        <div className="text-slate-500 text-xs">{label}</div>
      </div>
    </div>
  );
};

// Stats Counter Section
const StatsSection: React.FC = () => {
  const { t } = useLanguage();
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const [counts, setCounts] = useState({ cyclones: 0, forecasts: 0, districts: 0, accuracy: 0, responseTime: 0 });

  useEffect(() => {
    if (isInView) {
      const animate = (target: number, setter: (v: number) => void, duration = 2000) => {
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setter(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };

      animate(156, v => setCounts(c => ({ ...c, cyclones: v })));
      animate(72, v => setCounts(c => ({ ...c, forecasts: v })));
      animate(766, v => setCounts(c => ({ ...c, districts: v })));
      animate(94.2, v => setCounts(c => ({ ...c, accuracy: v })));
      animate(3, v => setCounts(c => ({ ...c, responseTime: v })));
    }
  }, [isInView]);

  const stats = [
    { key: 'cyclones', label: t('cyclonesTracked'), suffix: '+', icon: Activity, color: 'cyan' },
    { key: 'forecasts', label: t('hourForecasts'), suffix: 'hr', icon: Clock, color: 'amber' },
    { key: 'districts', label: t('districtsMonitored'), suffix: '+', icon: MapPin, color: 'emerald' },
    { key: 'accuracy', label: t('forecastAccuracy'), suffix: '%', icon: Award, color: 'orange' },
  ];

  return (
    <section ref={ref} className="py-20 bg-white/[0.02] border-y border-white/5 relative overflow-hidden" aria-labelledby="stats-title">
      <h2 id="stats-title" className="sr-only">{t('platformStatistics')}</h2>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <stat.icon className={cn('w-6 h-6', `text-${stat.color}-400`)} aria-hidden="true" />
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mb-1 font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                {counts[stat.key as keyof typeof counts].toLocaleString()}{stat.suffix}
              </div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// India-Specific Features Section
const IndiaFeaturesSection: React.FC = () => {
  const { t } = useLanguage();
  const { ref, isInView } = useInView({ threshold: 0.15 });

  const features = [
    {
      icon: Globe,
      title: t('multilingualSupport'),
      desc: t('multilingualDesc'),
      highlight: '12 Languages',
      color: 'cyan',
      tags: ['Hindi', 'Bengali', 'Telugu', 'Tamil', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Punjabi', 'Urdu', 'English'],
    },
    {
      icon: Radio,
      title: t('smsIVRAlerts'),
      desc: t('smsIVRDesc'),
      highlight: 'No App Required',
      color: 'amber',
      tags: ['SMS Alerts', 'IVR Calls', 'USSD Codes', 'Voice Messages', 'Regional Languages'],
    },
    {
      icon: MapPin,
      title: t('districtLevelRisk'),
      desc: t('districtLevelDesc'),
      highlight: '766 Districts',
      color: 'emerald',
      tags: ['Vulnerability Index', 'Population Density', 'Infrastructure', 'Evacuation Routes', 'Shelter Locations'],
    },
    {
      icon: Waves,
      title: t('stormSurgeModeling'),
      desc: t('stormSurgeDesc'),
      highlight: 'High-Resolution',
      color: 'blue',
      tags: ['Inundation Maps', 'Tide Integration', 'Bathymetry Data', 'Coastal Profiles', 'Real-time Updates'],
    },
    {
      icon: Building2,
      title: t('infrastructureImpact'),
      desc: t('infrastructureDesc'),
      highlight: 'Critical Assets',
      color: 'purple',
      tags: ['Power Grids', 'Hospitals', 'Schools', 'Transport', 'Communication'],
    },
    {
      icon: Users,
      title: t('communityResilience'),
      desc: t('communityDesc'),
      highlight: 'Participatory',
      color: 'pink',
      tags: ['Volunteer Networks', 'Local Knowledge', 'Drills', 'Early Warning', 'Recovery Planning'],
    },
  ];

  return (
    <section id="capabilities" ref={ref} className="py-28 relative overflow-hidden" aria-labelledby="india-features-title">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" aria-hidden="true" />
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          className="text-center mb-16"
        >
          <h2 id="india-features-title" className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {t('builtForIndia')}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            {t('indiaFeaturesDesc')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.2, 0, 0, 1] }}
              className="group relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="relative z-10">
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center mb-6', `bg-${feature.color}-500/10 border border-${feature.color}-500/20 text-${feature.color}-400`)}>
                  <feature.icon className="w-7 h-7" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', `bg-${feature.color}-500/20 text-${feature.color}-300`)}>
                    {feature.highlight}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{feature.desc}</p>
                <div className="flex flex-wrap gap-2" role="list" aria-label={`${feature.title} capabilities`}>
                  {feature.tags.map((tag, ti) => (
                    <span key={ti} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-300" role="listitem">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Cyclone Category Legend
const CycloneLegendSection: React.FC = () => {
  const { t } = useLanguage();
  const { ref, isInView } = useInView({ threshold: 0.15 });

  const categories = [
    { level: 1, name: t('depression'), wind: '< 34 kt', color: '#3b82f6', icon: Wind },
    { level: 2, name: t('deepDepression'), wind: '34-47 kt', color: '#06b6d4', icon: Wind },
    { level: 3, name: t('cyclonicStorm'), wind: '48-63 kt', color: '#8b5cf6', icon: CheckCircle },
    { level: 4, name: t('severeCyclonicStorm'), wind: '64-89 kt', color: '#f59e0b', icon: CheckCircle },
    { level: 5, name: t('verySevereCyclonicStorm'), wind: '90-119 kt', color: '#f97316', icon: CheckCircle },
    { level: 6, name: t('extremelySevereCyclonicStorm'), wind: '120-149 kt', color: '#ef4444', icon: CheckCircle },
    { level: 7, name: t('superCyclonicStorm'), wind: '> 150 kt', color: '#be185d', icon: CheckCircle },
  ];

  return (
    <section ref={ref} className="py-20 bg-white/[0.02] border-y border-white/5 relative overflow-hidden" aria-labelledby="legend-title">
      <h2 id="legend-title" className="sr-only">{t('cycloneCategories')}</h2>
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">{t('imdCycloneClassification')}</h3>
          <p className="text-slate-400 max-w-2xl mx-auto">{t('classificationDesc')}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.level}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
              transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.2, 0, 0, 1] }}
              className="group relative p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}>
                  <cat.icon className="w-6 h-6" style={{ color: cat.color }} aria-hidden="true" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('category')} {cat.level}</div>
                <h4 className="text-lg font-bold text-white mb-1" style={{ color: cat.color }}>{cat.name}</h4>
                <div className="text-sm text-slate-400 font-mono">{cat.wind}</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" style={{ backgroundColor: cat.color, opacity: 0.3 }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// State Risk Overview
const StateRiskSection: React.FC = () => {
  const { t } = useLanguage();
  const { ref, isInView } = useInView({ threshold: 0.15 });

  const riskColors = { 'Very High': '#ef4444', 'High': '#f97316', 'Medium': '#f59e0b', 'Low': '#10b981' };

  return (
    <section ref={ref} className="py-28 relative overflow-hidden" aria-labelledby="state-risk-title">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 id="state-risk-title" className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {t('stateRiskAssessment')}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">{t('stateRiskDesc')}</p>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 font-semibold text-slate-300">{t('state')}</th>
                <th className="text-left p-4 font-semibold text-slate-300">{t('riskLevel')}</th>
                <th className="text-right p-4 font-semibold text-slate-300">{t('historicalCyclones')}</th>
                <th className="text-right p-4 font-semibold text-slate-300">{t('coastlineKm')}</th>
                <th className="text-left p-4 font-semibold text-slate-300">{t('keyDistricts')}</th>
              </tr>
            </thead>
            <tbody>
              {INDIAN_STATES.map((state, idx) => (
                <motion.tr
                  key={state.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 font-medium text-white">{state.name} <span className="text-slate-500 ml-2">({state.code})</span></td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${riskColors[state.risk as keyof typeof riskColors]}20`, color: riskColors[state.risk as keyof typeof riskColors] }}>
                      {state.risk}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-cyan-400">{state.cyclones}</td>
                  <td className="p-4 text-right font-mono text-amber-400">{state.coast.toLocaleString()}</td>
                  <td className="p-4 text-slate-400">{t(`keyDistricts_${state.code}`)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

// Technology Stack
const TechStackSection: React.FC = () => {
  const { t } = useLanguage();
  const { ref, isInView } = useInView({ threshold: 0.15 });

  const techCategories = [
    {
      title: t('frontend'),
      icon: Layers,
      color: 'cyan',
      items: ['React 19', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'React Leaflet', 'Recharts'],
    },
    {
      title: t('backend'),
      icon: Cloud,
      color: 'amber',
      items: ['FastAPI', 'Python 3.11', 'PostgreSQL', 'PostGIS', 'Redis', 'Celery'],
    },
    {
      title: t('ml_ai'),
      icon: Brain,
      color: 'purple',
      items: ['PyTorch', 'XGBoost', 'Scikit-learn', 'SHAP', 'Optuna', 'ONNX'],
    },
    {
      title: t('data_sources'),
      icon: Database,
      color: 'emerald',
      items: ['IBTrACS', 'ERA5', 'NASA GIBS', 'IMD', 'JTWC', 'Copernicus'],
    },
    {
      title: t('gis_mapping'),
      icon: Map,
      color: 'blue',
      items: ['Leaflet', 'Mapbox', 'GeoPandas', 'Rasterio', 'GDAL', 'Proj4'],
    },
    {
      title: t('devops'),
      icon: Shield,
      color: 'orange',
      items: ['Docker', 'Kubernetes', 'GitHub Actions', 'Terraform', 'Prometheus', 'Grafana'],
    },
  ];

  return (
    <section ref={ref} className="py-28 relative overflow-hidden" aria-labelledby="tech-title">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 id="tech-title" className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {t('technologyStack')}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">{t('techStackDesc')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techCategories.map((cat, idx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-500 group"
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-6', `bg-${cat.color}-500/10 border border-${cat.color}-500/20 text-${cat.color}-400 group-hover:scale-110 transition-transform`)}>
                <cat.icon className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">{cat.title}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors">{item}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Data Sources
const DataSourcesSection: React.FC = () => {
  const { t } = useLanguage();
  const { ref, isInView } = useInView({ threshold: 0.15 });

  const sources = [
    { name: 'IBTrACS', full: 'International Best Track Archive', provider: 'NOAA / NCEI', period: '1842 - Present', type: 'Historical Tracks', icon: History, color: 'blue' },
    { name: 'ERA5', full: 'ECMWF Reanalysis v5', provider: 'ECMWF / Copernicus', period: '1940 - Present', type: 'Environmental', icon: Cloud, color: 'cyan' },
    { name: 'NASA GIBS', full: 'Global Imagery Browse Services', provider: 'NASA EarthData', period: 'Real-time', type: 'Satellite Imagery', icon: Satellite, color: 'purple' },
    { name: 'IMD', full: 'India Meteorological Department', provider: 'Govt. of India', period: 'Real-time', type: 'Operational Advisories', icon: Building2, color: 'orange' },
    { name: 'JTWC', full: 'Joint Typhoon Warning Center', provider: 'US Navy / Air Force', period: 'Real-time', type: 'Operational Advisories', icon: Shield, color: 'red' },
    { name: 'COPERNICUS', full: 'EU Earth Observation', provider: 'European Commission', period: 'Near Real-time', type: 'Satellite & Model', icon: Globe, color: 'emerald' },
  ];

  return (
    <section ref={ref} className="py-28 bg-white/[0.02] border-y border-white/5 relative overflow-hidden" aria-labelledby="data-title">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 id="data-title" className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {t('authoritativeDataSources')}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">{t('dataSourcesDesc')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source, idx) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group relative p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-500"
            >
              <div className="flex items-start gap-4">
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${source.color}-500/10 border border-${source.color}-500/20 text-${source.color}-400`)}>
                  <source.icon className="w-7 h-7" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-1">{source.name}</h3>
                  <p className="text-slate-400 text-sm mb-3">{source.full}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span>{source.provider}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span>{source.period}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Layers className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span>{source.type}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={cn('px-2 py-1 rounded text-xs font-semibold', `bg-${source.color}-500/20 text-${source.color}-300`)}>{source.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-28 relative overflow-hidden" aria-labelledby="cta-title">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-amber-500/10" aria-hidden="true" />
      <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="cta-title" className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {t('readyToGetStarted')}
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button
              size="lg"
              variant="filled"
              color="primary"
              className="w-full sm:w-auto group"
            >
              <RouterLink to="/dashboard">
                {t('launchDashboard')}
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </RouterLink>
            </Button>
            <Button
              size="lg"
              variant="outlined"
              color="primary"
              className="w-full sm:w-auto"
            >
              <a href="#documentation" target="_blank" rel="noopener noreferrer">
                {t('viewDocumentation')}
              </a>
            </Button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>{t('openSource')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>{t('sihWinner')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-orange-400" aria-hidden="true" />
              <span>{t('madeInIndia')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Footer
const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { resolvedMode, toggleTheme } = useTheme();
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <footer className="bg-[#060a1a] border-t border-white/5 py-16" role="contentinfo">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Wind className="text-white w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>CYCLONE AI</span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-6">
              {t('footerDesc')}
            </p>
            <div className="flex items-center gap-4">
              <label htmlFor="language-select" className="text-sm text-slate-400">{t('language')}:</label>
              <select
                id="language-select"
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                aria-label={t('selectLanguage')}
              >
                {INDIAN_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.native}</option>
                ))}
              </select>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                aria-label={resolvedMode === 'dark' ? t('switchToLight') : t('switchToDark')}
              >
                {resolvedMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{resolvedMode === 'dark' ? t('lightMode') : t('darkMode')}</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-5 text-sm uppercase tracking-wider">{t('platform')}</h4>
            <nav aria-label={t('platformNavigation')}>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><RouterLink to="/dashboard" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Compass className="w-4 h-4" /> {t('dashboard')}</RouterLink></li>
                <li><RouterLink to="/live" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Radio className="w-4 h-4" /> {t('liveMonitoring')}</RouterLink></li>
                <li><RouterLink to="/forecast" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><TrendingUp className="w-4 h-4" /> {t('aiForecast')}</RouterLink></li>
                <li><RouterLink to="/warnings" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('warningsImpact')}</RouterLink></li>
                <li><RouterLink to="/response" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Shield className="w-4 h-4" /> {t('emergencyResponse')}</RouterLink></li>
                <li><RouterLink to="/satellite" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Satellite className="w-4 h-4" /> {t('satelliteIntelligence')}</RouterLink></li>
                <li><RouterLink to="/historical" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><History className="w-4 h-4" /> {t('historicalAnalysis')}</RouterLink></li>
              </ul>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-5 text-sm uppercase tracking-wider">{t('resources')}</h4>
            <nav aria-label={t('resourcesNavigation')}>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#documentation" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Database className="w-4 h-4" /> {t('documentation')}</a></li>
                <li><a href="#api" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Cloud className="w-4 h-4" /> {t('apiReference')}</a></li>
                <li><a href="#github" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><LinkIcon className="w-4 h-4" /> {t('githubRepository')}</a></li>
                <li><a href="#blog" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><History className="w-4 h-4" /> {t('blog')}</a></li>
                <li><a href="#community" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Users className="w-4 h-4" /> {t('community')}</a></li>
                <li><a href="#support" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Shield className="w-4 h-4" /> {t('support')}</a></li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 gap-3 border-t border-white/5 pt-8">
          <p>&copy; {new Date().getFullYear()} {t('copyright')}. {t('allRightsReserved')}.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-cyan-400 transition-colors">{t('privacyPolicy')}</a>
            <a href="#terms" className="hover:text-cyan-400 transition-colors">{t('termsOfService')}</a>
            <a href="#accessibility" className="hover:text-cyan-400 transition-colors">{t('accessibility')}</a>
            <span className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-orange-400" aria-hidden="true" />
              {t('builtForSIH')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page
const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <div className="container mx-auto px-6 py-20 max-w-7xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-8" style={{ fontFamily: 'var(--font-display)' }}>
            {t('aiPowered')} <br /> <span className="bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">{t('cycloneIntelligence')}</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-12">{t('heroDescription')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button size="lg" variant="filled" color="primary"><RouterLink to="/dashboard">{t('enterDashboard')}</RouterLink></Button>
            <Button size="lg" variant="outlined" color="primary"><a href="#capabilities">{t('exploreCapabilities')}</a></Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-x-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      <HeroSection />
      <StatsSection />
      <IndiaFeaturesSection />
      <CycloneLegendSection />
      <StateRiskSection />
      <TechStackSection />
      <DataSourcesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;