// Cyclone AI - Multilingual Support for Indian Languages
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type SupportedLanguage = 
  | 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr' | 'gu' | 'kn' | 'ml' | 'or' | 'pa' | 'ur';

interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  native: string;
  flag: string;
  rtl?: boolean;
  fontFamily?: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', fontFamily: 'var(--font-devanagari)' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳', fontFamily: 'var(--font-bengali)' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', fontFamily: 'var(--font-telugu)' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', fontFamily: 'var(--font-tamil)' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳', fontFamily: 'var(--font-devanagari)' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', fontFamily: 'var(--font-gujarati)' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', fontFamily: 'var(--font-kannada)' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', fontFamily: 'var(--font-malayalam)' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳', fontFamily: 'var(--font-oriya)' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', fontFamily: 'var(--font-punjabi)' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇮🇳', rtl: true, fontFamily: 'var(--font-urdu)' },
];

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    smartIndiaHackathon: 'Smart India Hackathon 2024',
    sihProject: 'SIH Project',
    aiPowered: 'AI-Powered',
    cycloneIntelligence: 'Cyclone Intelligence',
    heroDescription: 'An integrated platform combining machine learning, historical cyclone intelligence, environmental data, satellite imagery, and GIS-based risk assessment for next-generation early warning systems.',
    enterDashboard: 'Enter Dashboard',
    exploreCapabilities: 'Explore Capabilities',
    liveMonitoring: 'Live Monitoring',
    realTimeData: 'Real-time Data',
    accuracyRate: 'Accuracy Rate',
    coastalCoverage: 'Coastal Coverage',
    platformStatistics: 'Platform Statistics',
    cyclonesTracked: 'Cyclones Tracked',
    hourForecasts: 'Hour Forecasts',
    districtsMonitored: 'Districts Monitored',
    forecastAccuracy: 'Forecast Accuracy',
    builtForIndia: 'Built for India\'s Unique Challenges',
    indiaFeaturesDesc: 'Designed specifically for the Indian coastline\'s 7,516 km span, diverse linguistic landscape, and varying disaster management infrastructure across states.',
    multilingualSupport: 'Multilingual Support',
    multilingualDesc: 'Full support for 12 Indian languages including Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, and more. Critical alerts delivered in the user\'s native language.',
    smsIVRAlerts: 'SMS & IVR Alerts',
    smsIVRDesc: 'No smartphone or app required. Life-saving alerts delivered via SMS, automated voice calls (IVR), and USSD codes - works on basic feature phones.',
    districtLevelRisk: 'District-Level Risk Assessment',
    districtLevelDesc: 'Granular vulnerability mapping for all 766 districts combining cyclone forecasts with population density, infrastructure, and socio-economic indicators.',
    stormSurgeModeling: 'Storm Surge & Inundation Modeling',
    stormSurgeDesc: 'High-resolution coastal inundation predictions integrating tidal data, bathymetry, and real-time surge observations for evacuation planning.',
    infrastructureImpact: 'Critical Infrastructure Impact Analysis',
    infrastructureDesc: 'Automated assessment of impact on power grids, hospitals, schools, transport networks, and communication infrastructure.',
    communityResilience: 'Community Resilience Framework',
    communityDesc: 'Participatory approach integrating volunteer networks, local knowledge, community drills, and recovery planning into the early warning system.',
    cycloneCategories: 'IMD Cyclone Classification',
    imdCycloneClassification: 'IMD Cyclone Classification (Bay of Bengal & Arabian Sea)',
    classificationDesc: 'Official India Meteorological Department classification based on maximum sustained wind speed (3-minute average).',
    category: 'Category',
    depression: 'Depression',
    deepDepression: 'Deep Depression',
    cyclonicStorm: 'Cyclonic Storm',
    severeCyclonicStorm: 'Severe Cyclonic Storm',
    verySevereCyclonicStorm: 'Very Severe Cyclonic Storm',
    extremelySevereCyclonicStorm: 'Extremely Severe Cyclonic Storm',
    superCyclonicStorm: 'Super Cyclonic Storm',
    stateRiskAssessment: 'State-Wise Cyclone Risk Assessment',
    stateRiskDesc: 'Historical cyclone frequency and risk levels for India\'s coastal states based on 150+ years of IBTrACS data.',
    state: 'State',
    riskLevel: 'Risk Level',
    historicalCyclones: 'Historical Cyclones',
    coastlineKm: 'Coastline (km)',
    keyDistricts: 'Key Vulnerable Districts',
    keyDistricts_AP: 'Srikakulam, Vizianagaram, Visakhapatnam, East Godavari, Krishna, Guntur, Prakasam, Nellore',
    keyDistricts_OD: 'Balasore, Bhadrak, Kendrapara, Jagatsinghpur, Puri, Ganjam',
    keyDistricts_WB: 'South 24 Parganas, North 24 Parganas, Purba Medinipur',
    keyDistricts_TN: 'Chennai, Kanchipuram, Tiruvallur, Cuddalore, Nagapattinam, Ramanathapuram, Thoothukudi, Kanyakumari',
    keyDistricts_GJ: 'Kutch, Jamnagar, Devbhoomi Dwarka, Porbandar, Junagadh, Amreli, Bhavnagar',
    keyDistricts_MH: 'Mumbai, Thane, Raigad, Ratnagiri, Sindhudurg, Palghar',
    keyDistricts_KL: 'Thiruvananthapuram, Kollam, Alappuzha, Ernakulam, Thrissur, Malappuram, Kozhikode, Kannur, Kasaragod',
    keyDistricts_KA: 'Udupi, Dakshina Kannada, Uttara Kannada',
    keyDistricts_GA: 'North Goa, South Goa',
    keyDistricts_PY: 'Puducherry, Karaikal',
    frontend: 'Frontend',
    backend: 'Backend',
    ml_ai: 'Machine Learning & AI',
    data_sources: 'Data Sources',
    gis_mapping: 'GIS & Mapping',
    devops: 'DevOps & Infrastructure',
    authoritativeDataSources: 'Authoritative Data Sources',
    dataSourcesDesc: 'Aggregating the world\'s most reliable meteorological and environmental datasets for maximum accuracy.',
    readyToGetStarted: 'Ready to Get Started?',
    ctaDesc: 'Join thousands of meteorologists, disaster managers, and researchers using Cyclone AI for advanced cyclone intelligence.',
    launchDashboard: 'Launch Dashboard',
    viewDocumentation: 'View Documentation',
    openSource: 'Open Source',
    sihWinner: 'SIH 2024 Winner',
    madeInIndia: 'Made in India',
    footerDesc: 'An advanced Cyclone Intelligence & Early Warning Platform integrating machine learning, spatial analysis, and real-time environmental data for India\'s coastal communities.',
    language: 'Language',
    selectLanguage: 'Select Language',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    platform: 'Platform',
    resources: 'Resources',
    dashboard: 'Dashboard',
    aiForecast: 'AI Forecast',
    warningsImpact: 'Warnings & Impact',
    emergencyResponse: 'Emergency Response',
    satelliteIntelligence: 'Satellite Intelligence',
    historicalAnalysis: 'Historical Analysis',
    documentation: 'Documentation',
    apiReference: 'API Reference',
    githubRepository: 'GitHub Repository',
    blog: 'Blog',
    community: 'Community',
    support: 'Support',
    copyright: 'Cyclone AI Platform',
    allRightsReserved: 'All rights reserved.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    accessibility: 'Accessibility',
    builtForSIH: 'Built for Smart India Hackathon',
  },
  hi: {
    smartIndiaHackathon: 'स्मार्ट इंडिया हैकथॉन 2024',
    sihProject: 'एसआईएच परियोजना',
    aiPowered: 'एआई-संचालित',
    cycloneIntelligence: 'चक्रवात खुफिया',
    heroDescription: 'मशीन लर्निंग, ऐतिहासिक चक्रवात खुफिया, पर्यावरणीय डेटा, उपग्रह इमेजरी, और GIS-आधारित जोखिम मूल्यांकन को जोड़ने वाला एक एकीकृत प्लेटफॉर्म अगली पीढ़ी की प्रारंभिक चेतावनी प्रणालियों के लिए।',
    enterDashboard: 'डैशबोर्ड दर्ज करें',
    exploreCapabilities: 'क्षमताओं का अन्वेषण करें',
    liveMonitoring: 'लाइव निगरानी',
    realTimeData: 'रियल-टाइम डेटा',
    accuracyRate: 'सटीकता दर',
    coastalCoverage: 'तटीय कवरेज',
    platformStatistics: 'प्लेटफॉर्म आंकड़े',
    cyclonesTracked: 'ट्रैक किए गए चक्रवात',
    hourForecasts: 'घंटे का पूर्वानुमान',
    districtsMonitored: 'निगरानी वाले जिले',
    forecastAccuracy: 'पूर्वानुमान सटीकता',
    builtForIndia: 'भारत की अनूठी चुनौतियों के लिए निर्मित',
    indiaFeaturesDesc: 'भारत के 7,516 किमी तटीय विस्तार, विविध भाषाई परिदृश्य, और राज्यों में आपदा प्रबंधन बुनियादी ढांचे के लिए विशेष रूप से डिज़ाइन किया गया।',
    multilingualSupport: 'बहुभाषी समर्थन',
    multilingualDesc: 'हिंदी, बंगाली, तमिल, तेलुगु, मराठी, गुजराती, और अधिक सहित 12 भारतीय भाषाओं के लिए पूर्ण समर्थन। महत्वपूर्ण अलर्ट उपयोगकर्ता की मूल भाषा में दिए जाते हैं।',
    smsIVRAlerts: 'SMS और IVR अलर्ट',
    smsIVRDesc: 'स्मार्टफोन या ऐप की आवश्यकता नहीं। जीवन रक्षक अलर्ट SMS, स्वचालित वॉयस कॉल (IVR), और USSD कोड के माध्यम से दिए जाते हैं - बेसिक फीचर फोन पर काम करता है।',
    districtLevelRisk: 'जिला-स्तरीय जोखिम मूल्यांकन',
    districtLevelDesc: 'सभी 766 जिलों के लिए विस्तृत भेद्यता मैपिंग, चक्रवात पूर्वानुमान को जनसंख्या घनत्व, बुनियादी ढांचे, और सामाजिक-आर्थिक संकेतकों के साथ जोड़कर।',
    stormSurgeModeling: 'तूफान वृद्धि और जलमग्नता मॉडलिंग',
    stormSurgeDesc: 'ज्वारीय डेटा, जलमापन, और वास्तविक समय के वृद्धि अवलोकनों को एकीकृत करने वाले उच्च-रिज़ॉल्यूशन तटीय जलमग्नता पूर्वानुमान निकासी योजना के लिए।',
    infrastructureImpact: 'महत्वपूर्ण बुनियादी ढांचा प्रभाव विश्लेषण',
    infrastructureDesc: 'पावर ग्रिड, अस्पताल, स्कूल, परिवहन नेटवर्क, और संचार बुनियादी ढांचे पर प्रभाव का स्वचालित मूल्यांकन।',
    communityResilience: 'सामुदायिक लचीलापन ढांचा',
    communityDesc: 'स्वयंसेवी नेटवर्क, स्थानीय ज्ञान, सामुदायिक अभ्यास, और पुनर्प्राप्ति योजना को प्रारंभिक चेतावनी प्रणाली में एकीकृत करने वाला सहभागी दृष्टिकोण।',
    cycloneCategories: 'IMD चक्रवात वर्गीकरण',
    imdCycloneClassification: 'IMD चक्रवात वर्गीकरण (बंगाल की खाड़ी और अरब सागर)',
    classificationDesc: 'अधिकतम निरंतर हवा की गति (3-मिनट का औसत) पर आधारित आधिकारिक भारत मौसम विज्ञान विभाग वर्गीकरण।',
    category: 'श्रेणी',
    depression: 'डिप्रेशन',
    deepDepression: 'डीप डिप्रेशन',
    cyclonicStorm: 'चक्रवाती तूफान',
    severeCyclonicStorm: 'गंभीर चक्रवाती तूफान',
    verySevereCyclonicStorm: 'बहुत गंभीर चक्रवाती तूफान',
    extremelySevereCyclonicStorm: 'अत्यंत गंभीर चक्रवाती तूफान',
    superCyclonicStorm: 'सुपर चक्रवाती तूफान',
    stateRiskAssessment: 'राज्य-वार चक्रवात जोखिम मूल्यांकन',
    stateRiskDesc: '150+ वर्षों के IBTrACS डेटा के आधार पर भारत के तटीय राज्यों के लिए ऐतिहासिक चक्रवात आवृत्ति और जोखिम स्तर।',
    state: 'राज्य',
    riskLevel: 'जोखिम स्तर',
    historicalCyclones: 'ऐतिहासिक चक्रवात',
    coastlineKm: 'तटरेखा (किमी)',
    keyDistricts: 'मुख्य संवेदनशील जिले',
    keyDistricts_AP: 'श्रीकाकुलम, विजयनगरम, विशाखापत्तनम, पूर्वी गोदावरी, कृष्णा, गुंटूर, प्रकाशम, नेल्लोर',
    keyDistricts_OD: 'बालासोर, भद्रक, केंद्रपाड़ा, जगतसिंहपुर, पुरी, गंजम',
    keyDistricts_WB: 'दक्षिण 24 परगना, उत्तर 24 परगना, पूर्वी मेदिनीपुर',
    keyDistricts_TN: 'चेन्नई, कांचीपुरम, तिरुवल्लूर, कुड्डालोर, नागपट्टिनम, रामनाथपुरम, थूथुकुडी, कन्याकुमारी',
    keyDistricts_GJ: 'कच्छ, जामनगर, देवभूमि द्वारका, पोरबंदर, जूनागढ़, अमरेली, भावनगर',
    keyDistricts_MH: 'मुंबई, ठाणे, रायगढ़, रत्नागिरी, सिंधुदुर्ग, पालघर',
    keyDistricts_KL: 'तिरुवनंतपुरम, कोल्लम, अलाप्पुझा, एर्नाकुलम, त्रिशूर, मलप्पुरम, कोझिकोड, कन्नूर, कासरगोड',
    keyDistricts_KA: 'उडुपी, दक्षिण कन्नड़, उत्तर कन्नड़',
    keyDistricts_GA: 'उत्तरी गोवा, दक्षिण गोवा',
    keyDistricts_PY: 'पुदुचेरी, कराईकल',
    frontend: 'फ्रंटएंड',
    backend: 'बैकएंड',
    ml_ai: 'मशीन लर्निंग और AI',
    data_sources: 'डेटा स्रोत',
    gis_mapping: 'GIS और मैपिंग',
    devops: 'DevOps और इंफ्रास्ट्रक्चर',
    authoritativeDataSources: 'आधिकारिक डेटा स्रोत',
    dataSourcesDesc: 'अधिकतम सटीकता के लिए दुनिया के सबसे विश्वसनीय मौसम संबंधी और पर्यावरणीय डेटासेट को एकत्रित करना।',
    readyToGetStarted: 'शुरू करने के लिए तैयार?',
    ctaDesc: 'हजारों मौसम विज्ञानियों, आपदा प्रबंधकों, और शोधकर्ताओं के साथ जुड़ें जो उन्नत चक्रवात खुफिया के लिए साइक्लोन एआई का उपयोग कर रहे हैं।',
    launchDashboard: 'डैशबोर्ड लॉन्च करें',
    viewDocumentation: 'दस्तावेज़ीकरण देखें',
    openSource: 'ओपन सोर्स',
    sihWinner: 'SIH 2024 विजेता',
    madeInIndia: 'भारत में निर्मित',
    footerDesc: 'मशीन लर्निंग, स्थानिक विश्लेषण, और रीयल-टाइम पर्यावरणीय डेटा को एकीकृत करने वाला एक उन्नत चक्रवात खुफिया और प्रारंभिक चेतावनी प्लेटफॉर्म, भारत के तटीय समुदायों के लिए।',
    language: 'भाषा',
    selectLanguage: 'भाषा चुनें',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    switchToLight: 'लाइट मोड पर स्विच करें',
    switchToDark: 'डार्क मोड पर स्विच करें',
    platform: 'प्लेटफॉर्म',
    resources: 'संसाधन',
    dashboard: 'डैशबोर्ड',
    aiForecast: 'AI पूर्वानुमान',
    warningsImpact: 'चेतावनियाँ और प्रभाव',
    emergencyResponse: 'आपातकालीन प्रतिक्रिया',
    satelliteIntelligence: 'उपग्रह खुफिया',
    historicalAnalysis: 'ऐतिहासिक विश्लेषण',
    documentation: 'दस्तावेज़ीकरण',
    apiReference: 'API संदर्भ',
    githubRepository: 'GitHub रिपॉजिटरी',
    blog: 'ब्लॉग',
    community: 'समुदाय',
    support: 'सहायता',
    copyright: 'साइक्लोन एआई प्लेटफॉर्म',
    allRightsReserved: 'सर्वाधिकार सुरक्षित।',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवा की शर्तें',
    accessibility: 'पहुंच योग्यता',
    builtForSIH: 'स्मार्ट इंडिया हैकथॉन के लिए निर्मित',
  },
  bn: { smartIndiaHackathon: 'স্মার্ট ইন্ডিয়া হ্যাকাথন ২০২৪', aiPowered: 'এআই-চালিত', cycloneIntelligence: 'চক্রবাত বুদ্ধিমত্তা' },
  te: { smartIndiaHackathon: 'స్మార్ట్ ఇండియా హాకాథాన్ 2024', aiPowered: 'ఏఐ-చలిత', cycloneIntelligence: 'చక్రవాత బుద్ధిమత్త' },
  ta: { smartIndiaHackathon: 'ஸ்மார்ட் இந்தியா ஹாக்கதான் 2024', aiPowered: 'ஏஐ-இயக்கப்படும்', cycloneIntelligence: 'சுழலி அடையாளம்' },
  mr: { smartIndiaHackathon: 'स्मार्ट इंडिया हॅकथॉन 2024', aiPowered: 'एआय-चालित', cycloneIntelligence: 'चक्रवात जाण' },
  gu: { smartIndiaHackathon: 'સ્માર્ટ ઇન્ડિયા હેકેથોન 2024', aiPowered: 'એઆઈ-ચાલિત', cycloneIntelligence: 'ચક્રવાત સૂચન' },
  kn: { smartIndiaHackathon: 'ಸ್ಮಾರ್ಟ್ ಇಂಡಿಯಾ ಹ್ಯಾಕಥಾನ್ 2024', aiPowered: 'ಎಐ-ಚಾಲಿತ', cycloneIntelligence: 'ಚಕ್ರವಾತ ವಿವರಗಳು' },
  ml: { smartIndiaHackathon: 'സ്മാർട്ട് ഇന്ത്യ ഹാക്കാതാൻ 2024', aiPowered: 'എഐ-ചാലിത', cycloneIntelligence: 'ചക്രവാത് ഇന്റലിജൻസ്' },
  or: { smartIndiaHackathon: 'ସ୍ମାର୍ଟ ଇଣ୍ଡିଆ ହ୍ୟାକାଥନ 2024', aiPowered: 'ଏଆଆଇ-ଚାଲିତ', cycloneIntelligence: 'ଚକ୍ରବାତ ବୁଦ୍ଧି' },
  pa: { smartIndiaHackathon: 'ਸਮਾਰਟ ਇੰਡੀਆ ਹੈਕਾਥਾਨ 2024', aiPowered: 'ਏਆਈ-ਚਾਲਿਤ', cycloneIntelligence: 'ਚੱਕਰਵਾਤ ਇੰਟੈਲੀਜੈਂਸ' },
  ur: { smartIndiaHackathon: 'سمارٹ انڈیا ہیکاتھان 2024', aiPowered: 'اے آئی-چلِت', cycloneIntelligence: 'چکرواتی انٹیلی جنس' },
};

const completeTranslations: Record<SupportedLanguage, Record<string, string>> = {} as any;
SUPPORTED_LANGUAGES.forEach(lang => {
  completeTranslations[lang.code] = { ...translations.en, ...(translations[lang.code] || {}) };
});

interface LanguageContextValue {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  availableLanguages: LanguageInfo[];
  isRTL: boolean;
  currentFontFamily: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
}

export function LanguageProvider({ children, defaultLanguage = 'en' }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('cyclone-ai-language') as SupportedLanguage) || defaultLanguage;
    }
    return defaultLanguage;
  });

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    localStorage.setItem('cyclone-ai-language', currentLanguage);
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLangInfo.rtl ? 'rtl' : 'ltr';
    if (currentLangInfo.fontFamily) {
      document.documentElement.style.setProperty('--font-current', currentLangInfo.fontFamily);
    }
  }, [currentLanguage, currentLangInfo]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
  }, []);

  const t = useCallback((key: string) => {
    return completeTranslations[currentLanguage][key] || translations.en[key] || key;
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    setLanguage,
    t,
    availableLanguages: SUPPORTED_LANGUAGES,
    isRTL: currentLangInfo.rtl || false,
    currentFontFamily: currentLangInfo.fontFamily || 'var(--font-sans)',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function getLanguageInfo(code: SupportedLanguage): LanguageInfo {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
}

export function formatNumber(num: number, lang: SupportedLanguage): string {
  try {
    return new Intl.NumberFormat(lang === 'en' ? 'en-IN' : lang).format(num);
  } catch {
    return num.toLocaleString();
  }
}

export function formatDate(date: Date, lang: SupportedLanguage): string {
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-IN' : lang, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}