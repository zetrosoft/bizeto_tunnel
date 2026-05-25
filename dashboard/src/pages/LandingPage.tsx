import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, ShieldCheck, Zap, Globe, Lock, 
  Terminal, ArrowRight, Copy, Check, ArrowRightCircle, XCircle, Sun, Moon
} from 'lucide-react';
import { Button, Badge, Card } from '../components/ui/Shared';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  max_tunnels: number;
  custom_domain: boolean;
  tcp_support: boolean;
  price_idr: number;
  price_usd: number;
  promo_price_idr: number;
  promo_price_usd: number;
  features_list: string;
  is_active: boolean;
}

const copy: Record<string, Record<string, any>> = {
  en: {
    navFeatures: "Why Bizeto Tunnel™?",
    navHowItWorks: "The Experience",
    navPricing: "Plans",
    navLogin: "Sign In",
    navSignup: "Join Now",
    heroBadge: "The Future of Development is Here",
    heroTitle1: "From Local Code to",
    heroTitle2: "Global Impact.",
    heroSub: "Stop fighting network configurations. Bizeto Tunnel™ bridges the gap between your creative space and the world instantly. Deploy, test, and share your vision with zero friction.",
    heroCTA1: "Start Your Journey",
    heroCTA2: "Explore the Tech",
    termInstall: "# 1. Portal to the world",
    termExpose: "# 2. Your vision, live in seconds",
    termConnecting: "Opening your secure bridge to the world...",
    termAuth: "Identity verified. You are ready.",
    termEstablished: "Connection perfect. The world is watching.",
    termStatus: "Status",
    termForwarding: "Your Public URL",
    featTitle: "Empowering your creative flow.",
    featSub: "We handle the complex pipes so you can focus on building what matters. Experience a deployment workflow that feels like magic.",
    feat1Title: "Brand Authority",
    feat1Desc: "Keep your professional identity. Map your custom brand to your local workspace in one click.",
    feat2Title: "Invisible Security",
    feat2Desc: "Military-grade encryption that stays out of your way. Automatic protection that lets you sleep soundly.",
    feat3Title: "Total Freedom",
    feat3Desc: "Bypass every barrier. Whether you're behind a strict firewall or a mobile hotspot, your work stays accessible.",
    feat4Title: "Elegant Simplicity",
    feat4Desc: "A single tool, endless possibilities. Designed to be out of sight and out of mind, so you can stay in the flow.",
    feat5Title: "Ultra-Fast Delivery",
    feat5Desc: "Built for speed. Multiplexing technology ensures your data travels the shortest path to your users.",
    feat6Title: "Versatile Connections",
    feat6Desc: "Beyond web apps. Connect anything from smart devices to deep databases with the same ease.",
    archTitle: "Reliability you can lean on.",
    archSub: "Behind the simple interface lies a world-class infrastructure designed to scale with your ambition, from first prototype to global launch.",
    archStep1Title: "Global Presence",
    archStep1Desc: "Your users connect to our nearest edge node for lightning-fast response times.",
    archStep2Title: "Smart Routing",
    archStep2Desc: "We intelligently package your data through secure, high-speed logical tunnels.",
    archStep3Title: "Direct Delivery",
    archStep3Desc: "Your local machine receives the data as if it were sitting right next to the user.",
    useCaseBadge: "Success Story",
    useCaseTitle: "Bridge Your Business to the Cloud.",
    useCaseSub: "Imagine managing 100 retail stores from a single dashboard, printing receipts and syncing stock in real-time without expensive static IPs.",
    useCaseProb: "The Barrier",
    useCaseProbDesc: "Hardware in physical stores often stays 'hidden' from the internet, making remote management a nightmare.",
    useCaseSol: "The Bridge",
    useCaseSolDesc: "Bizeto Tunnel™ turns any local device into a global endpoint. Manage, print, and sync anything, anywhere, as if it were all in one room.",
    priceTitle: "Choose Your Speed. Scale Your Vision.",
    priceSub: "Start for free and scale only when you're ready. Two clear paths to global connectivity, built for developers who value performance and efficiency.",
    tierFreeTitle: "Free Tier",
    tierFreeSub: "Perfect for experiments, prototypes, and testing webhooks.",
    tierFreeFeat1: "1 Active Tunnel (HTTP & Raw TCP)",
    tierFreeFeat2: "1GB High-Speed Bandwidth",
    tierFreeFeat3: "128kb/s Limit After 30 Days",
    tierFreeCTA: "Start Creating for Free",
    tierPaygTitle: "Pay-As-You-Go",
    tierPaygSub: "Professional infrastructure with zero monthly commitments. Scale as you grow.",
    tierPaygFeat1: "Infinite Concurrent Tunnels",
    tierPaygFeat2: "Permanent Non-Expiring Balance",
    tierPaygFeat3: "Priority Traffic (High QoS)",
    tierPaygCTA: "Get Premium Access",
    startsFrom: "Starting From",
    priceBonus: "🎁 New Users: 500MB Initialization Bonus",
    tier1Title: "Creator",
    tier1Sub: "For explorers building their first dreams.",
    tier1CTA: "Use this Plan",
    tier1Feat1: "1 High-Speed Tunnel",
    tier1Feat2: "Instant Subdomain",
    tier2Title: "Professional",
    tier2Sub: "For builders making a living from code.",
    tier2Badge: "Best Value",
    tier2CTA: "Use this Plan",
    tier2Feat1: "Infinite Scaling Tunnels",
    tier2Feat2: "Premium Custom Brand",
    tier3Title: "Visionary",
    tier3Sub: "For teams dominating their industries.",
    tier3CTA: "Contact Our Architects",
    tier3Feat1: "Private Infrastructure",
    tier3Feat2: "Enterprise Identity (SSO)",
    tier3Feat3: "Priority Human Support",
    tier4Title: "Pay-As-You-Go",
    tier4Sub: "Ideal for fluctuating workloads and growing startups. Get premium infrastructure with zero monthly commitment. Scale your tunnels dynamically and only pay for the actual data that bridges your local environment to the world.",
    tier4CTA: "Use this Plan",
    moreDetails: "See Detailed Comparison",
    tier4Feat1: "Zero Fixed Monthly Cost",
    tier4Feat2: "10 Concurrent Tunnels",
    tier4Feat3: "Full TCP/UDP Support",
    tierCommon1: "Built-in Security",
    tierCommon2: "TCP/IoT Readiness",
    ctaTitle: "Unleash your potential.",
    ctaSub: "Stop waiting for 'deployment day'. Make every moment a deployment moment with Bizeto Tunnel™.",
    ctaBtn: "Start Creating for Free",
    footerRights: "Built for creators, by creators."
  },
  id: {
    navFeatures: "Mengapa Bizeto Tunnel™?",
    navHowItWorks: "Pengalaman",
    navPricing: "Paket",
    navLogin: "Masuk",
    navSignup: "Gabung Sekarang",
    heroBadge: "Masa Depan Pengembangan Aplikasi",
    heroTitle1: "Dari Kode Lokal ke",
    heroTitle2: "Karya Global.",
    heroSub: "Berhenti berkutat dengan konfigurasi jaringan yang rumit. Bizeto Tunnel™ menghubungkan ruang kreatif Anda ke dunia secara instan. Uji, pamerkan, dan bagikan visi Anda tanpa hambatan.",
    heroCTA1: "Mulai Petualangan Anda",
    heroCTA2: "Pelajari Teknologi Kami",
    termInstall: "# 1. Gerbang menuju dunia",
    termExpose: "# 2. Karya Anda, online dalam sekejap",
    termConnecting: "Membuka jembatan aman menuju internet...",
    termAuth: "Identitas terverifikasi. Anda siap beraksi.",
    termEstablished: "Koneksi sempurna. Dunia menanti karya Anda.",
    termStatus: "Status",
    termForwarding: "Alamat Publik Anda",
    featTitle: "Mendukung alur kreatif Anda.",
    featSub: "Kami mengurus kerumitan teknis di balik layar agar Anda bisa fokus membangun apa yang penting. Pengalaman publikasi yang terasa seperti keajaiban.",
    feat1Title: "Otoritas Brand",
    feat1Desc: "Jaga identitas profesional Anda. Hubungkan brand kustom Anda ke lingkungan kerja lokal dalam satu klik.",
    feat2Title: "Keamanan Tanpa Beban",
    feat2Desc: "Enkripsi tingkat militer yang bekerja otomatis tanpa mengganggu Anda. Perlindungan yang membuat Anda tenang.",
    feat3Title: "Kebebasan Mutlak",
    feat3Desc: "Tembus segala batasan. Baik di balik firewall kantor maupun hotspot seluler, karya Anda tetap bisa diakses dunia.",
    feat4Title: "Kesederhanaan Elegan",
    feat4Desc: "Satu alat, kemungkinan tak terbatas. Didesain agar tidak terlihat dan tidak merepotkan, menjaga fokus Anda tetap tajam.",
    feat5Title: "Pengiriman Super Cepat",
    feat5Desc: "Dibangun untuk kecepatan. Teknologi multiplexing memastikan data Anda menempuh jalur terpendek ke pengguna.",
    feat6Title: "Koneksi Serbaguna",
    feat6Desc: "Lebih dari sekadar web. Hubungkan apa saja, dari perangkat pintar hingga database mendalam dengan kemudahan yang sama.",
    archTitle: "Reliabilitas yang bisa diandalkan.",
    archSub: "Di balik antarmuka yang sederhana, terdapat infrastruktur kelas dunia yang siap tumbuh bersama ambisi Anda, dari prototipe hingga peluncuran global.",
    archStep1Title: "Kehadiran Global",
    archStep1Desc: "Pengguna Anda terhubung ke node terdekat kami untuk waktu respon secepat kilat.",
    archStep2Title: "Perutean Cerdas",
    archStep2Desc: "Kami mengemas data Anda dengan cerdas melalui terowongan logis berkecepatan tinggi yang aman.",
    archStep3Title: "Pengiriman Langsung",
    archStep3Desc: "Mesin lokal Anda menerima data seolah-olah berada tepat di sebelah pengguna.",
    useCaseBadge: "Kisah Sukses",
    useCaseTitle: "Hubungkan Bisnis Anda ke Cloud.",
    useCaseSub: "Bayangkan mengelola 100 toko retail dari satu layar, mencetak struk, dan sinkronisasi stok real-time tanpa biaya mahal IP statis.",
    useCaseProb: "Hambatan",
    useCaseProbDesc: "Perangkat keras di toko fisik seringkali 'tersembunyi' dari internet, membuat manajemen jarak jauh menjadi sulit.",
    useCaseSol: "Jembatan",
    useCaseSolDesc: "Bizeto Tunnel™ mengubah perangkat lokal apa pun menjadi endpoint global. Kelola, cetak, dan sinkronkan apa pun, di mana pun.",
    priceTitle: "Pilih Kecepatan Anda. Skalakan Visi Anda.",
    priceSub: "Mulai gratis dan skalakan hanya saat Anda siap. Dua jalur jelas menuju konektivitas global, dibangun untuk developer yang mengutamakan performa dan efisiensi.",
    tierFreeTitle: "Paket Gratis",
    tierFreeSub: "Cocok untuk eksperimen, prototipe, dan pengujian webhook.",
    tierFreeFeat1: "1 Tunnel Aktif (HTTP & Raw TCP)",
    tierFreeFeat2: "1GB Bandwidth Kecepatan Tinggi",
    tierFreeFeat3: "Limit 128kb/s Setelah 30 Hari",
    tierFreeCTA: "Mulai Berkarya Gratis",
    tierPaygTitle: "Bayar Sesuai Pakai",
    tierPaygSub: "Infrastruktur profesional tanpa biaya bulanan tetap. Skalakan sesuai pertumbuhan Anda.",
    tierPaygFeat1: "Tunnel Simultan Tak Terbatas",
    tierPaygFeat2: "Saldo Top Up tidak akan hangus",
    tierPaygFeat3: "Prioritas Trafik (High QoS)",
    tierPaygCTA: "Dapatkan Akses Premium",
    startsFrom: "Mulai Dari",
    priceBonus: "🎁 Bonus 500MB khusus pelanggan baru.",
    tier1Title: "Kreator",
    tier1Sub: "Untuk penjelajah yang membangun mimpi pertama mereka.",
    tier1CTA: "Gunakan Paket Ini",
    tier1Feat1: "1 Tunnel Kecepatan Tinggi",
    tier1Feat2: "Subdomain Instan",
    tier2Title: "Profesional",
    tier2Sub: "Untuk pembangun yang hidup dari baris kode.",
    tier2Badge: "Paling Populer",
    tier2CTA: "Gunakan Paket Ini",
    tier2Feat1: "Tunnel Skala Tak Terbatas",
    tier2Feat2: "Brand Kustom Premium",
    tier3Title: "Visioner",
    tier3Sub: "Untuk tim yang mendominasi industri mereka.",
    tier3CTA: "Hubungi Arsitek Kami",
    tier3Feat1: "Infrastruktur Privat",
    tier3Feat2: "Identitas Enterprise (SSO)",
    tier3Feat3: "Dukungan Manusia Prioritas",
    tier4Title: "Bayar Sesuai Pakai",
    tier4Sub: "Sangat ideal untuk startup yang sedang berkembang atau beban kerja yang fluktuatif. Dapatkan akses ke infrastruktur premium tanpa komitmen biaya bulanan tetap. Skalakan tunnel Anda secara dinamis dan hanya bayar untuk trafik data yang benar-benar Anda gunakan.",
    tier4CTA: "Gunakan Paket Ini",
    moreDetails: "Lihat Detail Perbandingan",
    tier4Feat1: "Tanpa Biaya Langganan",
    tier4Feat2: "Biaya per-GB Data",
    tier4Feat3: "Performa Elastis",
    tierCommon1: "Keamanan Terintegrasi",
    tierCommon2: "Siap untuk TCP/IoT",
    ctaTitle: "Bebaskan potensi Anda.",
    ctaSub: "Jangan menunggu 'hari peluncuran'. Jadikan setiap momen sebagai momen peluncuran bersama Bizeto Tunnel™.",
    ctaBtn: "Mulai Berkarya Gratis",
    footerRights: "Dibangun untuk kreator, oleh kreator."
  }
};

export default function LandingPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<'id' | 'en'>((localStorage.getItem('lang') as 'id' | 'en') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [currency, setCurrency] = useState<'IDR' | 'USD'>(lang === 'id' ? 'IDR' : 'USD');
  const [exchangeRate, setExchangeRate] = useState<number>(16500);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // 1. Fetch Dynamic Exchange Rate
    fetch(`${API_BASE_URL}/api/exchange-rate`)
      .then(res => res.json())
      .then(data => {
        if (data && data.USD_TO_IDR) {
          setExchangeRate(data.USD_TO_IDR);
        }
      })
      .catch(err => console.error("Failed to fetch exchange rate:", err));

    // 2. Determine User's Region (Smart Detection - only if no manual choice exists)
    if (!localStorage.getItem('lang')) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.country_code === 'ID') {
            setCurrency('IDR');
            setLang('id');
            localStorage.setItem('lang', 'id');
          }
        })
        .catch(() => {
          // Fallback to timezone detection
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz && (tz.includes('Jakarta') || tz.includes('Makassar') || tz.includes('Jayapura'))) {
            setCurrency('IDR');
            setLang('id');
            localStorage.setItem('lang', 'id');
          }
        });
    }

    // 3. Fetch Plans
    fetch(`${API_BASE_URL}/api/pricing-plans`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlans(data);
        setLoadingPlans(false);
      })
      .catch(err => {
        console.error("Failed to fetch plans:", err);
        setLoadingPlans(false);
      });
    }, []);

  const toggleLang = () => {
    const nextLang = lang === 'en' ? 'id' : 'en';
    setLang(nextLang);
    setCurrency(nextLang === 'id' ? 'IDR' : 'USD');
    localStorage.setItem('lang', nextLang);
  };

  const formatPrice = (val: number) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    return `$${val}`;
  };

  const copyCommand = () => {
    navigator.clipboard.writeText("bizeto-agent start --port 8080");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const t = copy[lang];

  const paygPlan = plans.find(p => p.name.toLowerCase().includes('bayar') || p.name.toLowerCase().includes('pay'));
  const paygId = paygPlan ? paygPlan.id : '44444444-4444-4444-4444-444444444444';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900 transition-colors duration-300">
      
      {/* Navigation */}
      <header className="h-20 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50 overflow-hidden">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center -ml-4">
            <img 
              src="/brand/logo-horizontal.png" 
              alt="Bizeto Tunnel™" 
              className="h-32 w-auto object-contain brightness-110 contrast-125 transition-all hover:scale-105 dark:invert dark:hue-rotate-180 dark:brightness-200" 
            />
          </Link>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="hidden md:flex gap-6 mr-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.navFeatures}</a>
            <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.navHowItWorks}</a>
            <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.navPricing}</a>
          </div>
          <button 
            onClick={toggleLang}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-xs font-black uppercase text-zinc-500"
          >
            {lang}
          </button>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-400" /> : <Moon className="w-4 h-4 text-zinc-500" />}
          </button>
          
          <Link to={user ? "/dashboard" : "/login"}>
            <Button variant="ghost" className="font-semibold">{user ? "Dashboard" : t.navLogin}</Button>
          </Link>
          
          {!user && (
            <Link to="/login">
              <Button className="font-semibold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400">
                {t.navSignup}
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 lg:pt-36 lg:pb-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <Badge variant="default" className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 px-3 py-1">
            <Zap className="w-3 h-3 mr-2 text-emerald-500 inline-block" /> 
            {t.heroBadge}
          </Badge>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
            {t.heroTitle1} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              {t.heroTitle2}
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto lg:mx-0">
            {t.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to={user ? "/dashboard" : "/login"}>
              <Button className="h-14 px-8 text-lg font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 w-full sm:w-auto">
                {user ? "Go to Dashboard" : t.heroCTA1}
              </Button>
            </Link>
            <Link to="/docs">
              <Button variant="outline" className="h-14 px-8 text-lg font-bold w-full sm:w-auto">
                {t.heroCTA2}
              </Button>
            </Link>
          </div>
        </div>

        {/* Terminal Mockup */}
        <div className="flex-1 w-full max-w-xl lg:max-w-none">
          <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl">
            <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="ml-4 text-xs font-mono text-zinc-500 flex-1 text-center pr-12">bash - bizeto</div>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed">
              <div className="text-zinc-400 mb-2">{t.termInstall}</div>
              <div className="text-zinc-300 flex items-center">
                <span className="text-pink-500 mr-2">$</span> curl -sL https://get.bizeto.io | bash
              </div>
              <div className="text-zinc-400 mt-6 mb-2">{t.termExpose}</div>
              <div className="text-white flex justify-between items-center group relative cursor-pointer" onClick={copyCommand}>
                <div><span className="text-pink-500 mr-2">$</span> bizeto-agent start --port 8080</div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-6 text-zinc-400">
                <span className="text-emerald-400">INFO</span> {t.termConnecting}<br/>
                <span className="text-emerald-400">INFO</span> {t.termAuth}<br/>
                <span className="text-emerald-400">INFO</span> {t.termEstablished}
              </div>
              <div className="mt-4 p-4 border border-zinc-800 rounded bg-zinc-900/50">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t.termStatus}</span>
                  <span className="text-emerald-400 font-bold">Online</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-zinc-500">{t.termForwarding}</span>
                  <span className="text-white">https://app-demo.bizeto.io <ArrowRight className="w-3 h-3 inline mx-1"/> localhost:8080</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold dark:text-white tracking-tight mb-4">
              {t.featTitle}
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {t.featSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="w-6 h-6 text-blue-500" />}
              title={t.feat1Title}
              desc={t.feat1Desc}
            />
            <FeatureCard 
              icon={<Lock className="w-6 h-6 text-emerald-500" />}
              title={t.feat2Title}
              desc={t.feat2Desc}
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-indigo-500" />}
              title={t.feat3Title}
              desc={t.feat3Desc}
            />
            <FeatureCard 
              icon={<Terminal className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />}
              title={t.feat4Title}
              desc={t.feat4Desc}
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              title={t.feat5Title}
              desc={t.feat5Desc}
            />
            <FeatureCard 
              icon={<Server className="w-6 h-6 text-purple-500" />}
              title={t.feat6Title}
              desc={t.feat6Desc}
            />
          </div>
        </div>
      </section>

      {/* How it Works / Architecture */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold dark:text-white tracking-tight">
              {t.archTitle}
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {t.archSub}
            </p>
            <ul className="space-y-4 mt-8">
              <li className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-bold dark:text-white">{t.archStep1Title}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.archStep1Desc}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-bold dark:text-white">{t.archStep2Title}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.archStep2Desc}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-bold dark:text-white">{t.archStep3Title}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.archStep3Desc}</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full p-8 bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative min-h-[400px]">
             {/* Abstract Architecture Diagram */}
             <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-md gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <Globe className="w-8 h-8 text-blue-500" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500">Internet</span>
                </div>

                <div className="hidden md:flex flex-col items-center">
                  <ArrowRightCircle className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
                  <span className="text-[10px] text-zinc-400 mt-1">HTTPS</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-zinc-900 dark:bg-white rounded-2xl shadow-xl flex items-center justify-center relative">
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center"><Check className="w-3 h-3 text-white"/></div>
                    <Server className="w-10 h-10 text-white dark:text-zinc-900" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">Bizeto Tunnel™ Edge</span>
                </div>

                <div className="hidden md:flex flex-col items-center">
                  <ArrowRightCircle className="w-6 h-6 text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">Yamux Stream</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <Terminal className="w-8 h-8 text-zinc-800 dark:text-zinc-200" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500">Local Agent</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-white dark:bg-zinc-900/20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <Badge variant="success" className="mb-2">{t.useCaseBadge}</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold dark:text-white tracking-tight">
                {t.useCaseTitle}
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                {t.useCaseSub}
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <span className="text-red-600 dark:text-red-400 font-bold">{t.useCaseProb}</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.useCaseProbDesc}</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.useCaseSol}</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.useCaseSolDesc}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-800">
              <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                <Terminal className="w-5 h-5 text-zinc-500" />
                <span className="text-zinc-300 font-mono text-sm">Cloud Backend (Node.js Example)</span>
              </div>
              <pre className="text-sm text-emerald-400 font-mono overflow-x-auto">
<code>{`const net = require('net');

// 1. Connect to Bizeto Tunnel™ Edge
const printer = net.connect({
  host: 'tcp.bizeto.io',
  port: 24510
}, () => {
  console.log('Connected to remote printer!');
  
  // 2. Send raw ESC/POS commands
  printer.write('\\x1B\\x40'); // Initialize
  printer.write('Order #1234\\n');
  printer.write('Total: $24.50\\n');
  printer.write('\\x1D\\x56\\x41\\x00'); // Cut paper
  
  printer.end();
});`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold dark:text-white tracking-tight mb-4">
              {t.priceTitle}
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {t.priceSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-8">
            {loadingPlans ? (
              <>
                <Card className="p-10 h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"></Card>
                <Card className="p-10 h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"></Card>
              </>
            ) : (plans?.length || 0) === 0 ? (
              <div className="col-span-full text-center py-12">
                 <p className="text-zinc-500 dark:text-zinc-400 font-medium">Pricing plans are temporarily unavailable. Please check back later.</p>
              </div>
            ) : plans?.filter(p => p.is_active).map((plan) => {
              const isPAYG = plan.name.toLowerCase().includes('pay-as-you-go') || plan.name.toLowerCase().includes('bayar');
              const currentPrice = currency === 'IDR' 
                ? (plan.promo_price_idr > 0 ? plan.promo_price_idr : plan.price_idr)
                : (plan.promo_price_usd > 0 ? plan.promo_price_usd : (plan.price_usd || plan.price_monthly));
              
              const isFree = currentPrice === 0;
              const features = plan.features_list ? plan.features_list.split(/\r?\n|\\n/) : [];

              return (
                <div key={plan.id} className="relative pt-4 h-full">
                  {isPAYG && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-amber-500 text-amber-950 font-black text-[10px] px-6 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-xl border-2 border-amber-600/20 whitespace-nowrap">
                        BEST VALUE
                      </div>
                    </div>
                  )}

                  <Card className={`p-10 flex flex-col justify-between group transition-all relative overflow-hidden h-full ${
                    isPAYG 
                      ? 'bg-zinc-950 text-white border-[4px] border-amber-500 shadow-[0_20px_60px_rgba(245,158,11,0.2)] hover:shadow-[0_20px_80px_rgba(245,158,11,0.3)]' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl hover:border-zinc-400'
                  }`}>
                    {isPAYG ? (
                      <div className="absolute bottom-0 right-0 p-8 opacity-10"><Zap className="w-32 h-32 text-amber-500 rotate-12" /></div>
                    ) : (
                      <div className="absolute top-0 right-0 p-8 opacity-5"><Globe className="w-24 h-24" /></div>
                    )}

                    {isPAYG && (
                      <div className="absolute top-6 right-6 z-30 group-hover:scale-110 transition-transform duration-500 scale-90 sm:scale-100">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full border-[3px] border-amber-500/30 border-t-amber-400 border-r-amber-500 animate-[spin_4s_linear_infinite]"></div>
                          <div className="w-24 h-24 rounded-full bg-zinc-900 flex flex-col items-center justify-center relative overflow-hidden border-2 border-amber-500/20">
                            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent"></div>
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest relative z-10">Bonus</span>
                            <span className="text-3xl font-black text-white leading-none relative z-10">500</span>
                            <span className="text-[12px] font-black text-white leading-none relative z-10">MB</span>
                            <span className="text-[8px] text-amber-950 font-black uppercase relative z-10 bg-amber-400 px-2 py-0.5 rounded-full mt-1">FREE</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative z-10 space-y-6">
                      <div className={isPAYG ? "pr-24 sm:pr-28" : ""}>
                        <h3 className={`text-3xl font-black mb-2 ${isPAYG ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>{plan.name}</h3>
                        <p className={`text-sm ${isPAYG ? 'text-zinc-400' : 'text-zinc-500'}`}>{plan.description}</p>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-black ${isPAYG ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                          {isFree ? (lang === 'id' ? 'GRATIS' : 'FREE') : formatPrice(currentPrice)}
                        </span>
                        {!isFree && <span className={`text-xl ${isPAYG ? 'text-zinc-500' : 'text-zinc-400'}`}>/GB</span>}
                      </div>

                      <div className="space-y-4 pt-4">
                        {features.map((feat, i) => (
                          <div key={i} className={`flex items-center gap-3 text-sm font-bold ${isPAYG ? 'text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {isPAYG ? <Zap className="w-5 h-5 text-emerald-400" /> : <Check className="w-5 h-5 text-zinc-400" />}
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`mt-10 pt-6 border-t relative z-10 ${isPAYG ? 'border-zinc-800' : 'border-zinc-100 dark:border-zinc-800'}`}>
                      {isFree ? (
                        <Link to={user ? "/dashboard" : "/login"}>
                          <Button variant="outline" className="w-full h-14 font-black uppercase tracking-widest text-sm !bg-zinc-950 !text-white hover:!bg-black dark:!bg-zinc-100 dark:!text-zinc-950 dark:hover:!bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all border-none scale-100 hover:scale-[1.02] active:scale-95">
                            {user ? "Go to Dashboard" : t.tierFreeCTA}
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link to={user ? "/dashboard" : "/login"}>
                            <Button className="w-full h-14 bg-amber-500 text-amber-950 hover:bg-amber-400 font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_rgba(245,158,11,0.4)] border-2 border-amber-400/50 transition-all active:scale-95">
                              {user ? "Manage Plan" : t.tierPaygCTA}
                            </Button>
                          </Link>
                          <div className="text-center mt-4">
                            <p className="text-[10px] text-amber-500 uppercase tracking-widest font-black italic">{t.priceBonus}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-zinc-900 dark:bg-zinc-50 border-t border-zinc-800 text-center px-6">
        <h2 className="text-3xl lg:text-5xl font-extrabold text-white dark:text-zinc-900 mb-6">
          {t.ctaTitle}
        </h2>
        <p className="text-lg text-zinc-400 dark:text-zinc-500 mb-10 max-w-xl mx-auto">
          {t.ctaSub}
        </p>
        <Link to={user ? "/dashboard" : "/login"} className="inline-block relative group/cta z-10">
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500 rounded-full blur-xl opacity-50 group-hover/cta:opacity-100 transition duration-500 animate-pulse"></div>
          <Button className="relative h-16 px-12 text-xl font-black bg-zinc-950 text-white border-2 border-emerald-500 hover:bg-zinc-900 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400">
               {user ? "Back to Dashboard" : t.ctaBtn}
            </span>
            <ArrowRight className="w-6 h-6 ml-3 text-indigo-400 inline-block group-hover/cta:translate-x-2 transition-transform" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 py-12 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Bizeto Tunnel™ Inc. {t.footerRights}</p>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow">
    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-6 shadow-sm">
      {icon}
    </div>
    <h3 className="text-xl font-bold dark:text-white mb-3">{title}</h3>
    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
      {desc}
    </p>
  </div>
);
