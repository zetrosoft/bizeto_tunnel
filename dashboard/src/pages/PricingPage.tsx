import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  X, 
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  LayoutDashboard,
  Globe,
  Zap,
  Server,
  ShieldCheck
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/Shared';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const copy: Record<string, any> = {
  en: {
    title: "Zero Commitments. Pay Only For What You Use",
    subtitle: "One revolutionary tier for everyone. Transparent, efficient, and yours forever.",
    monthly: "/mo",
    features: "Included Features",
    tunnels: "Concurrent Tunnels",
    customDomains: "Custom Domains (BYOD)",
    subdomains: "Random Subdomains",
    tcpSupport: "TCP & HTTP Full Proxy",
    httpOnly: "HTTP Only",
    tls: "End-to-End TLS 1.3 Encryption",
    secureYamux: "Secure Yamux Multiplexing",
    compareTitle: "Detailed Feature Comparison",
    compareDesc: "Everything you need to know about our infrastructure capabilities.",
    cta: "Use this Plan",
    back: "Back to Home",
    backDashboard: "Dashboard",
    featMaxTunnels: "Max Tunnels",
    featCustomDomain: "Custom Domain",
    featTCP: "TCP Proxy",
    featTLS: "TLS 1.3",
    featYamux: "Yamux Stream",
    featDDoS: "Anti-DDoS",
    featSupport: "Priority Support",
    priceBonus: "🎁 New Users: 500MB Initialization Bonus",
    startsFrom: "Starting From",
    pageTitle: "Choose Your Speed.",
    pageSub: "Start for free and scale only when you're ready.",
    tierFreeTitle: "Free Tier",
    tierFreeSub: "Perfect for experiments, prototypes, and testing webhooks.",
    tierFreeFeat1: "1 Active Tunnel (HTTP & Raw TCP)",
    tierFreeFeat2: "1GB High-Speed Bandwidth",
    tierFreeFeat3: "128kb/s Limit After 30 Days",
    tierFreeCTA: "Start Creating for Free",
    tierPaygTitle: "Pay-As-You-Go",
    tierPaygSub: "Professional infrastructure with zero monthly commitments.",
    tierPaygFeat1: "Infinite Concurrent Tunnels",
    tierPaygFeat2: "Top Up balance never expires",
    tierPaygFeat3: "Priority Traffic (High QoS)",
    tierPaygCTA: "Get Premium Access",
    newCustomerOnly: "For new customers only",
  },
  id: {
    title: "Mulai Tanpa Komitmen, Bayar Sesuai Kebutuhan",
    subtitle: "Satu paket revolusioner untuk semua skala. Transparan, hemat, dan berlaku selamanya.",
    monthly: "/bln",
    features: "Fitur yang Didapat",
    tunnels: "Tunnel Bersamaan",
    customDomains: "Domain Kustom (BYOD)",
    subdomains: "Subdomain Acak",
    tcpSupport: "Proxy TCP & HTTP Penuh",
    httpOnly: "Hanya HTTP",
    tls: "Enkripsi End-to-End TLS 1.3",
    secureYamux: "Multiplexing Yamux Aman",
    compareTitle: "Perbandingan Fitur Detail",
    compareDesc: "Semua yang perlu Anda ketahui tentang kapabilitas infrastruktur kami.",
    cta: "Gunakan Paket Ini",
    back: "Kembali ke Beranda",
    backDashboard: "Dashboard",
    featMaxTunnels: "Maksimal Tunnel",
    featCustomDomain: "Domain Kustom",
    featTCP: "Proxy TCP",
    featTLS: "TLS 1.3",
    featYamux: "Stream Yamux",
    featDDoS: "Anti-DDoS",
    featSupport: "Dukungan Prioritas",
    priceBonus: "🎁 Bonus 500MB khusus pelanggan baru.",
    startsFrom: "Mulai Dari",
    pageTitle: "Pilih Kecepatan Anda.",
    pageSub: "Mulai gratis dan skalakan hanya saat Anda siap.",
    tierFreeTitle: "Paket Gratis",
    tierFreeSub: "Cocok untuk eksperimen, prototipe, dan pengujian webhook.",
    tierFreeFeat1: "1 Tunnel Aktif (HTTP & Raw TCP)",
    tierFreeFeat2: "1GB Bandwidth Kecepatan Tinggi",
    tierFreeFeat3: "Limit 128kb/s Setelah 30 Hari",
    tierFreeCTA: "Mulai Berkarya Gratis",
    tierPaygTitle: "Bayar Sesuai Pakai",
    tierPaygSub: "Infrastruktur profesional tanpa biaya bulanan tetap.",
    tierPaygFeat1: "Tunnel Simultan Tak Terbatas",
    tierPaygFeat2: "Saldo Top Up tidak akan hangus",
    tierPaygFeat3: "Prioritas Trafik (High QoS)",
    tierPaygCTA: "Dapatkan Akses Premium",
    newCustomerOnly: "Khusus pelanggan baru",
  }
};

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [lang, setLang] = useState<'id' | 'en'>((localStorage.getItem('lang') as 'id' | 'en') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>(lang === 'id' ? 'IDR' : 'USD');
  const [exchangeRate, setExchangeRate] = useState<number>(16500); // Default, will update dynamically

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

    // 3. Fetch Pricing Plans
    fetch(`${API_BASE_URL}/api/pricing-plans`)
      .then(res => res.json())
      .then(data => setPlans(Array.isArray(data) ? data : []));
  }, []);

  const t = copy[lang];

  const paygPlan = plans.find(p => p.name.toLowerCase().includes('bayar') || p.name.toLowerCase().includes('pay'));
  const paygId = paygPlan ? paygPlan.id : '44444444-4444-4444-4444-444444444444';

  const getBasePrice = (plan: any, isPAYG = false) => {
    if (currency === 'IDR') {
      if (isPAYG || plan.name.toLowerCase().includes('pay')) return 5000;
      if (plan.name.toLowerCase().includes('pro')) return 49000;
      if (plan.name.toLowerCase().includes('enterprise')) return 990000;
      return plan.price_monthly * exchangeRate;
    }
    // For USD (Global Market)
    if (isPAYG || plan.name.toLowerCase().includes('pay')) return 1.00;
    if (plan.name.toLowerCase().includes('pro')) return 15.00;
    if (plan.name.toLowerCase().includes('enterprise')) return 199.00;
    return plan.price_monthly;
  };

  const formatPrice = (val: number) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    return `$${val}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900 transition-colors duration-300">
      {/* Header */}
      <header className="h-20 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50 overflow-hidden">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center -ml-4">
            <img 
              src="/brand/logo-horizontal.png" 
              alt="Bizeto Tunnel™" 
              className="h-28 w-auto object-contain brightness-110 contrast-125 dark:invert dark:hue-rotate-180 dark:brightness-200" 
            />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center">
             <Button variant="outline" className="h-9 gap-2 px-4 font-bold border-zinc-200 dark:border-emerald-500/50 dark:bg-emerald-500/5 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all shadow-sm">
                {user ? <LayoutDashboard className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {user ? t.backDashboard : t.back}
             </Button>
          </Link>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <button 
            onClick={() => {
              const nextLang = lang === 'en' ? 'id' : 'en';
              setLang(nextLang);
              // Sync currency with language
              setCurrency(nextLang === 'id' ? 'IDR' : 'USD');
              localStorage.setItem('lang', nextLang);
            }}
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight">{t.pageTitle}</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{t.pageSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-8">
            {plans?.filter(p => p.is_active).map((plan) => {
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
                      <div className="absolute top-4 right-4 z-30 group-hover:scale-110 transition-transform duration-500 scale-90 sm:scale-100">
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
                        {features.map((feat: string, i: number) => (
                          <div key={i} className={`flex items-start gap-3 text-sm font-bold ${isPAYG ? 'text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {isPAYG ? <Zap className="w-5 h-5 text-emerald-400 shrink-0" /> : <Check className="w-5 h-5 text-zinc-400 shrink-0" />}
                            <span className="leading-tight">{feat}</span>
                          </div>
                        ))}
                      </div>                    </div>

                    <div className={`mt-10 pt-6 border-t relative z-10 ${isPAYG ? 'border-zinc-800' : 'border-zinc-100 dark:border-zinc-800'}`}>
                      {isFree ? (
                        <Link to={user ? "/dashboard" : "/login"}>
                          <Button variant="outline" className="w-full h-14 font-black uppercase tracking-widest text-sm !bg-zinc-950 !text-white hover:!bg-black dark:!bg-zinc-100 dark:!text-zinc-950 dark:hover:!bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all border-none scale-100 hover:scale-[1.02] active:scale-95">
                            {t.tierFreeCTA}
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link to={`/plan/${plan.id}`}>
                            <Button className="w-full h-14 bg-amber-500 text-amber-950 hover:bg-amber-400 font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_rgba(245,158,11,0.4)] border-2 border-amber-400/50 transition-all active:scale-95">
                              {t.tierPaygCTA}
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
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 py-12 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Bizeto Tunnel Inc. Built for creators.</p>
      </footer>
    </div>
  );
}
