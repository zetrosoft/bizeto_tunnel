import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Check, 
  X, 
  Sun,
  Moon,
  Zap, 
  ShieldCheck, 
  ArrowLeft, 
  Info, 
  ChevronRight, 
  Globe, 
  Server, 
  Cpu,
  Printer,
  Layout,
  Star,
  Flame,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Clock,
  LayoutDashboard,
  Heart,
  Activity,
  Award,
  ZapOff,
  DollarSign
} from 'lucide-react';
import { Card, Button, Badge, AlertDialog } from '../components/ui/Shared';
import { API_BASE_URL } from '../config';

const copy: Record<string, any> = {
  en: {
    back: "Back to Home",
    backDashboard: "Dashboard",
    benefits: "Strategic Value",
    features: "Technical Specs",
    pricing: "Investment Options",
    save: "Efficiency",
    choose: "Empower My Work",
    monthly: "Monthly",
    months: "Months",
    perMonth: "/ month",
    total: "Total Investment",
    bestValue: "MOST AGILE",
    simulation: "A Story of Efficiency",
    comparePro: "VS Fixed Subscription",
    upgradeCopy: "Ready to bridge your local vision to the global stage?",
    trialTitle: "🎁 First-Time Developer's Bonus",
    trialSub: "Start your professional journey with an extra edge. We're instantly adding a 500MB bonus to your very first top-up, regardless of the tier you choose.",
    trialBonusNote: "✨ Infinite Utility: This bonus merges into your permanent balance, ensuring your innovation never has an expiration date.",
    marketingMsg: "Bizeto Tunnel™ isn't just code; it's a human-centric bridge. We combine next-gen tech with an agile mindset to ensure your innovation flows without friction. Our technology serves humanity's creative spirit.",
    useCaseTitle: "Practical Scenarios",
    useCaseHttpTitle: "Web & Webhook Master",
    useCaseHttpDesc: "Instantly expose your local web projects with auto-provisioned HTTPS. Perfect for testing Stripe/Xendit webhooks, showcasing UI progress to clients, or sharing your development server across the globe without touching a single router setting.",
    useCaseTcpTitle: "Deep Infrastructure Access",
    useCaseTcpDesc: "Beyond the browser. Connect securely to your local MySQL/Postgres databases, manage home servers via SSH, or bridge IoT devices from anywhere in the world. Bizeto transforms your local resources into global cloud assets."
  },
  id: {
    back: "Kembali ke Beranda",
    backDashboard: "Dashboard",
    benefits: "Nilai Strategis",
    features: "Spesifikasi Teknis",
    pricing: "Opsi Investasi",
    save: "Efisien",
    choose: "Berdayakan Karya Saya",
    monthly: "Bulanan",
    months: "Bulan",
    perMonth: "/ bulan",
    total: "Total Investasi",
    bestValue: "PALING AGILE",
    simulation: "Kisah Efisiensi Developer",
    comparePro: "VS Langganan Tetap",
    upgradeCopy: "Siap menghubungkan visi lokal Anda ke panggung dunia?",
    trialTitle: "🎁 Bonus Perdana Developer",
    trialSub: "Mulailah perjalanan profesional Anda dengan keuntungan lebih. Dapatkan tambahan 500MB secara instan pada transaksi top-up pertama Anda, apa pun pilihan paketnya.",
    trialBonusNote: "✨ Utilitas Tanpa Batas: Bonus ini menyatu dengan saldo permanen Anda, memastikan inovasi Anda tidak pernah memiliki tanggal kedaluwarsa.",
    marketingMsg: "Bizeto Tunnel™ bukan sekadar kode; ini adalah jembatan yang memanusiakan inovasi. Kami menggabungkan teknologi mutakhir dengan mindset agile untuk memastikan kreativitas Anda mengalir tanpa hambatan. Teknologi ini melayani semangat kreatif manusia.",
    useCaseTitle: "Skenario Praktis",
    useCaseHttpTitle: "Eksperimen Web & Webhook",
    useCaseHttpDesc: "Publikasikan proyek web lokal Anda secara instan dengan HTTPS otomatis. Sangat ideal untuk menguji webhook Stripe/Xendit, memamerkan progres UI ke klien, atau berbagi server pengembangan Anda ke seluruh dunia tanpa menyentuh satu pun pengaturan router.",
    useCaseTcpTitle: "Akses Infrastruktur Mendalam",
    useCaseTcpDesc: "Lebih dari sekadar browser. Hubungkan secara aman ke database MySQL/Postgres lokal Anda, kelola server rumah melalui SSH, atau jembatani perangkat IoT dari mana saja di dunia. Bizeto mengubah sumber daya lokal Anda menjadi aset cloud global."
  }
};

export default function PlanDetailPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]); // For comparison
  const [lang, setLang] = useState<'id' | 'en'>((localStorage.getItem('lang') as 'id' | 'en') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [duration, setDuration] = useState<number>(1);
  const [selectedPaygTier, setSelectedPaygTier] = useState<number>(0);
  const [currency, setCurrency] = useState<'IDR' | 'USD'>(lang === 'id' ? 'IDR' : 'USD');
  const [exchangeRate, setExchangeRate] = useState<number>(16500);

  const paygTiers: Record<string, { amount: number, bytes: string, savings: number }[]> = {
    IDR: [
      { amount: 20000, bytes: "1 GB", savings: 0 },
      { amount: 30000, bytes: "2 GB", savings: 25 },
      { amount: 40000, bytes: "3 GB", savings: 33 },
      { amount: 50000, bytes: "5 GB", savings: 50 },
    ],
    USD: [
      { amount: 4.99, bytes: "1 GB", savings: 0 },
      { amount: 6.99, bytes: "2 GB", savings: 30 },
      { amount: 8.99, bytes: "3 GB", savings: 40 },
      { amount: 9.99, bytes: "5 GB", savings: 60 },
    ]
  };

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{ open: boolean, title: string, message: string, type: 'info' | 'error' | 'success' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ open: true, title, message, type });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/exchange-rate`)
      .then(res => res.json())
      .then(data => {
        if (data && data.USD_TO_IDR) {
          setExchangeRate(data.USD_TO_IDR);
        }
      })
      .catch(err => console.error("Failed to fetch exchange rate:", err));

    // Only detect if no manual preference exists
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
          // Fallback to timezone detection if ipapi fails
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz && (tz.includes('Jakarta') || tz.includes('Makassar') || tz.includes('Jayapura'))) {
            setCurrency('IDR');
            setLang('id');
            localStorage.setItem('lang', 'id');
          }
        });
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/pricing-plans`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlans(data);
          const found = data.find(p => p.id === planId);
          if (found) setPlan(found);
          else navigate('/pricing');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [planId]);

  const handleCheckout = async () => {
    if (!token) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsCheckingOut(true);
    try {
      const currentPaygAmount = paygTiers[currency][selectedPaygTier].amount;
      
      const res = await fetch(`${API_BASE_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          plan_name: plan.name.toUpperCase(),
          duration_months: isPAYG ? 0 : duration,
          topup_amount: isPAYG ? currentPaygAmount : 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Simulasikan webhook di local
        await fetch(`${API_BASE_URL}/api/billing/simulate-webhook`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            plan_name: plan.name.toUpperCase(),
            duration_months: isPAYG ? 0 : duration,
            topup_amount: isPAYG ? currentPaygAmount : 0
          })
        });

        window.location.href = data.invoice_url;
      } else {
        const err = await res.text();
        showAlert("Checkout failed", err, "error");
      }
    } catch (e) {
      showAlert("Connection error", "Failed to reach server during checkout.", "error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 dark:text-white font-black italic animate-pulse">BIZETO ANALYZING...</div>;
  if (!plan) return null;

  const t = copy[lang];
  const isPAYG = plan.name.toLowerCase().includes('pay-as-you-go');
  const isCreator = plan.name.toLowerCase().includes('free') || plan.name.toLowerCase().includes('gratis');

  const getBasePrice = () => {
    if (currency === 'IDR') {
      return plan.promo_price_idr > 0 ? plan.promo_price_idr : plan.price_idr;
    }
    return plan.promo_price_usd > 0 ? plan.promo_price_usd : (plan.price_usd || plan.price_monthly);
  };

  const getPriceForDuration = (dur: number) => {
    const base = getBasePrice();
    let discount = 0;
    if (dur === 6) discount = plan.discount_6_months || 10;
    if (dur === 12) discount = plan.discount_12_months || 20;
    if (dur === 24) discount = plan.discount_24_months || 35;

    const totalBase = base * dur;
    const finalTotal = totalBase * (1 - discount / 100);
    return {
      monthly: finalTotal / dur,
      total: finalTotal,
      discount
    };
  };

  const formatMoney = (val: number) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    return `$${val.toFixed(2)}`;
  };

  const renderPAYGSimulation = () => {
    const paygPrice = getBasePrice(); // per GB
    const proPlan = plans.find(p => p.name.toLowerCase().includes('pro'));
    const proPrice = currency === 'IDR' ? 49000 : (proPlan?.price_monthly || 5);

    // Authentic First-Person Confessions
    const stories = [
      { 
        name: lang === 'id' ? 'Momen Bizeto Nyelametin Muka Saya' : 'The Moment Bizeto Saved Me', 
        situation: lang === 'id' ? 'Pernah nggak, pas mau demo ke klien, tiba-tiba server staging-nya mati? Mau benerin makan waktu lama. Padahal klien udah nungguin link-nya sekarang juga.' : 'Ever had your staging server crash right when a client asks for a demo? Fixing it takes forever, but they want the link right now.',
        traffic: 0.05, 
        icon: ShieldCheck,
        outcome: lang === 'id' ? 'Saya ketik satu baris di CMD, kirim link dari laptop sendiri, klien malah bilang "Wih, cepet banget update-nya!". Tidur jadi nyenyak, reputasi aman.' : 'I ran one command, sent the link from my laptop, and the client said "Wow, that was fast!". Slept like a baby, reputation intact.'
      },
      { 
        name: lang === 'id' ? 'Selamat Tinggal Begadang Webhook' : 'Goodbye Webhook All-Nighters', 
        situation: lang === 'id' ? 'Dulu saya sering begadang cuma gara-gara nungguin webhook dari Stripe nggak nyampe-nyampe ke laptop. Pusing setting IP publik dan port forwarding.' : 'I used to pull all-nighters just because Stripe webhooks wouldn\'t reach my laptop. Port forwarding and public IP settings were a nightmare.',
        traffic: 1.5, 
        icon: Zap,
        outcome: lang === 'id' ? 'Sekarang saya tinggal nyalain Bizeto, URL HTTPS dapet, ngetes payment cuma 5 menit. Sisa malemnya bisa buat ngopi santai.' : 'Now I just fire up Bizeto, get the HTTPS URL, and test payments in 5 minutes. The rest of the night is for relaxing with coffee.'
      },
      { 
        name: lang === 'id' ? 'Project Iseng yang Nggak Mubazir' : 'Side Projects Without the Guilt', 
        situation: lang === 'id' ? 'Saya punya banyak project iseng di Github yang terkubur gitu aja. Mau di-online-kan males bayar VPS bulanan mahal cuma buat pamer ke temen.' : 'I had so many cool side projects buried on Github. I wanted them online but hated paying for monthly VPS just to show them to friends.',
        traffic: 2.2, 
        icon: Cpu,
        outcome: lang === 'id' ? 'Sekarang semua project saya online pake domain keren. Bayarnya recehan, cuma pas ada temen yang iseng nge-klik. Inovasi saya nggak mati.' : 'Now all my projects are live with cool domains. I pay pennies, and only when someone actually clicks. My innovation stays alive.'
      },
    ];

    return (
      <div className="space-y-8 mt-12 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
              <h3 className="text-2xl font-black dark:text-white tracking-tight">{t.simulation}</h3>
            </div>
            <p className="text-zinc-500 text-sm max-w-xl">{lang === 'id' ? 'Teknologi bukan tentang angka, tapi tentang bagaimana ia membantu hidup manusia lebih mudah.' : 'Technology is not about numbers, it is about how it makes human life easier.'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {stories.map((s, i) => {
             const cost = s.traffic * paygPrice;
             return (
               <Card key={i} className="p-8 border-zinc-200 dark:border-zinc-800 flex flex-col justify-between group hover:border-emerald-500 transition-all shadow-xl bg-white dark:bg-zinc-900">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 transition-colors">
                      <s.icon className="w-6 h-6 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <h4 className="font-black text-xl text-indigo-700 dark:text-indigo-400 mb-3">{s.name}</h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed mb-4 italic font-semibold">"{s.situation}"</p>
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                      <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1">{lang === 'id' ? 'Hasil Akhir' : 'Outcome'}</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-emerald-300 leading-tight">{s.outcome}</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">{lang === 'id' ? 'Estimasi Investasi' : 'Estimated Investment'}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatMoney(cost)}</p>
                      <p className="text-[10px] font-bold text-zinc-400">/ {lang === 'id' ? 'Bulan' : 'Month'}</p>
                    </div>
                  </div>
               </Card>
             );
           })}
        </div>

        <div className="relative rounded-3xl p-10 overflow-hidden border-2 border-emerald-500/30 bg-zinc-900 text-white shadow-2xl">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Heart className="w-64 h-64" /></div>
           <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="space-y-6 flex-1">
                 <h4 className="text-4xl font-black tracking-tight leading-tight">{lang === 'id' ? 'Bayar Hanya Untuk Nilai yang Anda Ciptakan.' : 'Pay Only For The Value You Create.'}</h4>
                 <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
                   {lang === 'id' ? 
                    'Kami membuang model langganan tradisional yang kaku. Dengan PAYG, Bizeto menjadi partner yang tumbuh bersama Anda. Tanpa biaya admin, tanpa saldo hangus—hanya efisiensi murni untuk memberdayakan visi digital Anda.' : 
                    'We are discarding rigid traditional subscription models. With PAYG, Bizeto becomes a partner that grows with you. No hidden fees, non-expiring balance—just pure efficiency to empower your digital vision.'}
                 </p>
              </div>
              <div className="grid grid-cols-2 gap-4 shrink-0">
                 <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                    <Award className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Status</p>
                    <p className="text-lg font-black italic">Prestige Access</p>
                 </div>
                 <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                    <ZapOff className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Waste</p>
                    <p className="text-lg font-black italic">Zero Percent</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const getFeatureIcon = (featureName: string) => {
    const lower = featureName.toLowerCase();
    if (lower.includes('tunnel')) return <Cpu className="w-5 h-5 text-indigo-500" />;
    if (lower.includes('bandwidth') || lower.includes('speed')) return <Zap className="w-5 h-5 text-amber-500" />;
    if (lower.includes('tcp') || lower.includes('raw')) return <Activity className="w-5 h-5 text-blue-500" />;
    if (lower.includes('domain')) return <Globe className="w-5 h-5 text-emerald-500" />;
    if (lower.includes('balance') || lower.includes('saldo') || lower.includes('pay')) return <DollarSign className="w-5 h-5 text-emerald-600" />;
    if (lower.includes('priority') || lower.includes('qos')) return <Flame className="w-5 h-5 text-orange-500" />;
    if (lower.includes('security') || lower.includes('encryption')) return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    return <Check className="w-5 h-5 text-zinc-400" />;
  };

  const getFeatureCopy = (featureName: string) => {
    const lower = featureName.toLowerCase();
    if (lang === 'id') {
      if (lower.includes('tunnel')) return "Jalankan banyak aplikasi secara simultan dengan stabil.";
      if (lower.includes('bandwidth')) return "Kecepatan akses maksimal tanpa hambatan atau throttling.";
      if (lower.includes('tcp') || lower.includes('raw')) return "Dukungan penuh untuk protokol non-HTTP (SSH, Database).";
      if (lower.includes('domain')) return "Identitas profesional dengan domain brand Anda sendiri.";
      if (lower.includes('balance') || lower.includes('saldo')) return "Efisiensi biaya, bayar hanya yang Anda gunakan.";
      if (lower.includes('priority')) return "Prioritas trafik tinggi untuk pengalaman tanpa jeda.";
      return "Fitur unggulan untuk memaksimalkan potensi proyek Anda.";
    }
    // English Fallback
    if (lower.includes('tunnel')) return "Run multiple applications simultaneously with high stability.";
    if (lower.includes('bandwidth')) return "Maximum access speed without bottlenecks or throttling.";
    if (lower.includes('tcp') || lower.includes('raw')) return "Full support for non-HTTP protocols (SSH, Databases).";
    if (lower.includes('domain')) return "Professional identity with your own branded domain.";
    if (lower.includes('balance')) return "Cost efficiency, pay only for what you actually use.";
    if (lower.includes('priority')) return "High traffic priority for a lag-free experience.";
    return "Premium feature to maximize your project's potential.";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900 transition-colors duration-300">
      {/* Header - Consistent with PricingPage */}
      <header className="h-20 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50 overflow-hidden">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center -ml-4">
            <img 
              src="/brand/logo-horizontal.png" 
              alt="Bizeto Tunnel™" 
              className="h-28 w-auto object-contain brightness-110 contrast-125 dark:invert dark:hue-rotate-180 dark:brightness-200 transition-all" 
            />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to={user ? "/dashboard" : "/pricing"} className="flex items-center">
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

      <main className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left Column: Details & Pricing */}
          <div className="lg:col-span-3 space-y-12">
             <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <Badge variant="default" className="bg-indigo-600 text-white border-none px-4 py-1 uppercase tracking-tighter font-black">{lang === 'id' ? 'Efisien' : 'Efficient'}</Badge>
                 <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Premium Tier Selection</span>
               </div>
               <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1]">{lang === 'id' ? `Jelajahi Paket ${plan.name}` : `Mastering the ${plan.name} Tier`}</h1>
               <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-4 border-emerald-500 pl-6 py-2 bg-emerald-50/30 dark:bg-emerald-500/5 rounded-r-xl font-medium">
                 "{plan.description || (lang === 'id' ? 'Didesain untuk kebebasan kreatif tanpa batas teknis.' : 'Designed for creative freedom without technical boundaries.')}"
               </p>
             </div>

             {/* Duration Selector (Only for fixed plans) */}
             {!isPAYG && !isCreator && (
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t.pricing}</h3>
                    <Badge variant="success" className="animate-bounce font-black text-[10px] px-3 py-1">UP TO 35% OFF</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 6, 12, 24].map((dur) => {
                      const calc = getPriceForDuration(dur);
                      const active = duration === dur;
                      return (
                        <button 
                          key={dur} 
                          onClick={() => setDuration(dur)}
                          className={`p-5 rounded-2xl border-2 transition-all flex flex-col text-left relative overflow-hidden ${
                            active ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10' : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400'
                          }`}
                        >
                          {calc.discount > 0 && (
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-lg">
                              -{calc.discount}%
                            </div>
                          )}
                          <span className={`text-xs font-black mb-1 uppercase tracking-widest ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{dur} {dur === 1 ? t.monthly : t.months}</span>
                          <span className="text-base font-black text-zinc-900 dark:text-white">{formatMoney(calc.monthly)}</span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase mt-1">{t.perMonth}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <Card className="p-8 bg-zinc-900 text-white border-none shadow-2xl relative overflow-hidden group">
                     <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Flame className="w-48 h-48" /></div>
                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">{t.total}</p>
                           <h4 className="text-5xl font-black tracking-tighter text-white">{formatMoney(getPriceForDuration(duration).total)}</h4>
                           <div className="mt-4 flex items-center gap-2">
                             <div className="p-1 bg-emerald-500/20 rounded">
                               <ShieldCheck className="w-4 h-4 text-emerald-400" />
                             </div>
                             <p className="text-xs text-emerald-400 font-black uppercase tracking-widest">Secure Checkout via Xendit</p>
                           </div>
                        </div>
                        <Button 
                           variant="ghost" 
                           onClick={handleCheckout}
                           disabled={isCheckingOut}
                           className="h-16 px-12 text-xl font-black bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-none shadow-[0_10px_40px_rgba(16,185,129,0.3)] active:scale-95 transition-all rounded-2xl group/btn"
                        >
                           {isCheckingOut ? (
                             <div className="flex items-center gap-3">
                               <div className="w-5 h-5 border-4 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin"></div>
                               <span>{lang === 'id' ? 'Memproses...' : 'Processing...'}</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               {t.choose} <ArrowRight className="w-6 h-6 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                             </div>
                           )}
                        </Button>
                     </div>
                  </Card>
               </div>
             )}

             {/* PAYG Selector */}
             {isPAYG && (
               <div className="space-y-6">
                  <div className="flex items-center gap-3 pt-4">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{lang === 'id' ? 'Pilih Nominal Top-Up' : 'Select Top-Up Amount'}</h3>
                    <Badge variant="default" className="bg-indigo-600 text-white font-black text-[10px] px-3 py-1 uppercase">{lang === 'id' ? 'Tanpa Kedaluwarsa' : 'No Expiry'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {paygTiers[currency].map((tier, idx) => {
                      const active = selectedPaygTier === idx;
                      return (
                        <button 
                          key={idx} 
                          onClick={() => setSelectedPaygTier(idx)}
                          className={`p-5 rounded-2xl border-2 transition-all flex flex-col text-left relative overflow-hidden ${
                            active ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10' : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400'
                          }`}
                        >
                          {tier.savings > 0 && (
                            <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-bl-lg shadow-lg border-b border-l border-amber-500/50">
                              {lang === 'id' ? 'HEMAT' : 'SAVE'} {tier.savings}%
                            </div>
                          )}
                          <span className={`text-sm font-black mb-1 uppercase tracking-widest ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>Top Up {formatMoney(tier.amount)}</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{lang === 'id' ? 'Dapat' : 'Get'} {tier.bytes}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <Card className="p-8 !bg-indigo-600 !text-white border-none shadow-2xl relative overflow-hidden group">
                     <div className="absolute bottom-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform"><Zap className="w-48 h-48" /></div>
                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">{lang === 'id' ? 'Total Pembayaran' : 'Total Payment'}</p>
                           <h4 className="text-5xl font-black tracking-tighter text-white">{formatMoney(paygTiers[currency][selectedPaygTier].amount)}</h4>
                           <div className="mt-4 flex items-center gap-2">
                             <div className="p-1 bg-white/20 rounded">
                               <ShieldCheck className="w-4 h-4 text-white" />
                             </div>
                             <p className="text-xs text-indigo-100 font-black uppercase tracking-widest">{lang === 'id' ? 'Saldo Berlaku Selamanya' : 'Credits Never Expire'}</p>
                           </div>
                        </div>
                        <Button 
                           variant="ghost" 
                           onClick={handleCheckout}
                           disabled={isCheckingOut}
                           className="h-16 px-12 text-xl font-black !bg-white !text-indigo-600 hover:!bg-zinc-100 border-none shadow-xl active:scale-95 transition-all rounded-2xl group/btn"
                        >
                           {isCheckingOut ? (
                             <div className="flex items-center gap-3">
                               <div className="w-5 h-5 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                               <span>{lang === 'id' ? 'Memproses...' : 'Processing...'}</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               {lang === 'id' ? 'Top-Up Sekarang' : 'Top-Up Now'} <ArrowRight className="w-6 h-6 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                             </div>
                           )}
                        </Button>
                     </div>
                  </Card>

                  {/* Bonus Info Banner - Positioned BELOW the payment card */}
                  <div className="p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-3xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Zap className="w-16 h-16 text-amber-500" /></div>
                     <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                           <Award className="w-8 h-8 text-amber-950" />
                        </div>
                        <div className="space-y-1 text-center md:text-left">
                           <h4 className="text-lg font-black text-amber-900 dark:text-amber-400 tracking-tight">{t.trialTitle}</h4>
                           <p className="text-sm text-amber-800 dark:text-amber-300/80 font-medium leading-relaxed">{t.trialSub}</p>
                           <p className="text-xs font-black text-amber-600 dark:text-amber-500 pt-1 uppercase tracking-widest">{t.trialBonusNote}</p>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {/* Creator CTA */}
             {isCreator && (
               <div className="p-10 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden bg-zinc-900 text-white">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Zap className="w-32 h-32 rotate-12" /></div>
                  <div className="relative z-10">
                    <h4 className="text-5xl font-black tracking-tight">FREE FOREVER</h4>
                    <p className="font-black uppercase tracking-[0.2em] text-xs mt-2 text-emerald-400">Start your journey today</p>
                  </div>
                  <Button 
                     variant="ghost" 
                     onClick={handleCheckout}
                     disabled={isCheckingOut}
                     className="relative z-10 h-16 px-12 text-xl font-black border-none shadow-xl active:scale-95 transition-all rounded-2xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  >
                     {isCheckingOut ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-4 rounded-full animate-spin border-zinc-950/20 border-t-zinc-950"></div>
                          <span>{lang === 'id' ? 'Memproses...' : 'Processing...'}</span>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2">
                          {t.choose} <ArrowRight className="w-6 h-6 ml-2" />
                        </div>
                     )}
                  </Button>
               </div>
             )}

             {/* Features Comparison Table */}
             <div className="space-y-6">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t.features}</h3>
                <Card className="overflow-hidden border-zinc-300 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-900">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-100 dark:bg-zinc-900/50 border-b border-zinc-300 dark:border-zinc-800">
                        <tr>
                           <th className="px-6 py-4 font-black uppercase text-zinc-500 dark:text-zinc-400 text-[11px] tracking-widest">{lang === 'id' ? 'Kapabilitas Strategis' : 'Strategic Capabilities'}</th>
                           <th className="px-6 py-4 font-black uppercase text-zinc-900 dark:text-white text-center tracking-widest text-xs bg-zinc-50 dark:bg-zinc-800/30">{plan.name}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                         {plan.features_list ? (
                           plan.features_list.split(/\r?\n|\\n/).map((feat: string, i: number) => (
                             <tr key={i}>
                                <td className="px-6 py-6 flex items-center gap-4">
                                   <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                      {getFeatureIcon(feat)}
                                   </div>
                                   <div>
                                      <p className="font-black text-zinc-900 dark:text-white">{feat}</p>
                                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{getFeatureCopy(feat)}</p>
                                   </div>
                                </td>
                                <td className="px-6 py-6 text-center bg-zinc-50/50 dark:bg-zinc-800/10">
                                   <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                                </td>
                             </tr>
                           ))
                         ) : (
                           <>
                            <tr>
                                <td className="px-6 py-6 flex items-center gap-4">
                                  <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm"><Cpu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" /></div>
                                  <div>
                                      <p className="font-black text-zinc-900 dark:text-white">{lang === 'id' ? 'Agile Tunneling' : 'Agile Tunneling'}</p>
                                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{lang === 'id' ? `${plan.max_tunnels} Koneksi simultan untuk alur kerja yang fleksibel.` : `${plan.max_tunnels} Simultaneous connections for flexible workflow.`}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-6 text-center font-black text-zinc-900 dark:text-white text-2xl bg-zinc-50/50 dark:bg-zinc-800/10">{plan.max_tunnels}</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-6 flex items-center gap-4">
                                  <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm"><Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" /></div>
                                  <div>
                                      <p className="font-black text-zinc-900 dark:text-white">{lang === 'id' ? 'Brand Authority (Custom Domain)' : 'Brand Authority (Custom Domain)'}</p>
                                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{lang === 'id' ? 'Tingkatkan profesionalisme dengan domain milik Anda sendiri.' : 'Elevate professionalism with your own private domain.'}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-6 text-center bg-zinc-50/50 dark:bg-zinc-800/10">{plan.custom_domain ? <Check className="w-8 h-8 text-emerald-500 mx-auto" /> : <X className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />}</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-6 flex items-center gap-4">
                                  <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm"><Zap className="w-5 h-5 text-zinc-600 dark:text-zinc-400" /></div>
                                  <div>
                                      <p className="font-black text-zinc-900 dark:text-white">{lang === 'id' ? 'Universal Protocol Support' : 'Universal Protocol Support'}</p>
                                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{lang === 'id' ? 'Siap untuk HTTP, TCP, bahkan IoT (SSH, MySQL, dll).' : 'Ready for HTTP, TCP, and even IoT (SSH, MySQL, etc).'}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-6 text-center bg-zinc-50/50 dark:bg-zinc-800/10">{plan.tcp_support ? <Check className="w-8 h-8 text-emerald-500 mx-auto" /> : <X className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />}</td>
                            </tr>
                           </>
                         )}
                         <tr className="bg-emerald-50/30 dark:bg-emerald-500/5">
                            <td className="px-6 py-6 flex items-center gap-4">
                               <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm"><ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                               <div>
                                  <p className="font-black text-zinc-900 dark:text-white">{lang === 'id' ? 'Human-Centric Security' : 'Human-Centric Security'}</p>
                                  <p className="text-[11px] text-emerald-600 dark:text-emerald-500 font-bold leading-relaxed">{lang === 'id' ? 'Enkripsi TLS 1.3 end-to-end otomatis yang melindungi data sensitif Anda dari penyadapan pihak ketiga.' : 'Automatic end-to-end TLS 1.3 encryption protecting your sensitive data from third-party interception.'}</p>
                               </div>
                            </td>
                            <td className="px-6 py-6 text-center bg-emerald-100/10 dark:bg-emerald-800/10"><Check className="w-8 h-8 text-emerald-500 mx-auto" /></td>
                         </tr>
                      </tbody>
                   </table>
                </Card>
             </div>
          </div>

          {/* Right Column: Benefits & Marketing */}
          <div className="lg:col-span-2 space-y-8">
             <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-zinc-200 dark:border-zinc-800 shadow-xl space-y-8">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm"><Star className="w-6 h-6 text-amber-500" /></div>
                   <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t.benefits}</h3>
                </div>
                
                   <div className="space-y-8">
                   <div className="space-y-2">
                      <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3"><div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div> {lang === 'id' ? 'Fokus pada Kreasi' : 'Focus on Creation'}</div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{lang === 'id' ? 'Biarkan kami menangani kerumitan jaringan. Anda cukup fokus pada apa yang Anda cintai: Membangun produk luar biasa.' : 'Let us handle the networking complexity. You just focus on what you love: Building extraordinary products.'}</p>
                   </div>
                   <div className="space-y-2">
                      <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3"><div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div> Augmented Workflow</div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{lang === 'id' ? 'CLI Bizeto bertindak sebagai asisten cerdas yang memperluas jangkauan kode lokal Anda ke panggung global secara instan.' : 'Bizeto CLI acts as an intelligent assistant that instantly extends your local code to the global stage.'}</p>
                   </div>
                   <div className="space-y-2">
                      <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3"><div className="w-1.5 h-6 bg-purple-500 rounded-full"></div> {lang === 'id' ? 'Social Impact & Trust' : 'Social Impact & Trust'}</div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{lang === 'id' ? 'Tingkatkan akuntabilitas proyek Anda di mata klien. Berbagi progres secara transparan dan membangun kredibilitas instan.' : 'Elevate your project accountability in the eyes of clients. Share progress transparently and build instant credibility.'}</p>
                   </div>
                </div>

                <div className="pt-8 border-t-2 border-zinc-100 dark:border-zinc-800">
                   <div className="flex items-start gap-4">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-500 shrink-0" />
                      </div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 italic leading-relaxed">
                        "{t.marketingMsg}"
                      </p>
                   </div>
                </div>
             </div>

             {/* Practical Scenarios / Use Cases */}
             <div className="p-8 bg-zinc-900 text-white rounded-3xl border-2 border-zinc-800 shadow-2xl space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Activity className="w-32 h-32" /></div>
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-zinc-800 rounded-xl border border-zinc-700 shadow-sm"><Globe className="w-6 h-6 text-emerald-400" /></div>
                   <h3 className="text-2xl font-black tracking-tight">{t.useCaseTitle}</h3>
                </div>

                <div className="space-y-8 relative z-10">
                   <div className="space-y-3">
                      <div className="flex items-center gap-2">
                         <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded border border-emerald-500/30">HTTP / HTTPS</div>
                         <h4 className="font-black text-white">{t.useCaseHttpTitle}</h4>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                         {t.useCaseHttpDesc}
                      </p>
                   </div>

                   <div className="space-y-3">
                      <div className="flex items-center gap-2">
                         <div className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase rounded border border-indigo-500/30">TCP / RAW</div>
                         <h4 className="font-black text-white">{t.useCaseTcpTitle}</h4>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                         {t.useCaseTcpDesc}
                      </p>
                   </div>
                </div>
             </div>

             {/* Value Tambahan Elit hidden as requested */}
             {/* 
             <div className="p-8 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800">
                <h5 className="font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] text-[11px] mb-6">{lang === 'id' ? 'Value Tambahan Elit' : 'Elite Added Value'}</h5>
                <div className="space-y-5">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm"><Clock className="w-5 h-5 text-zinc-500" /></div>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-400">{lang === 'id' ? 'Akses Prioritas Komunitas Bizeto' : 'Bizeto Community Priority Access'}</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm"><Globe className="w-5 h-5 text-zinc-500" /></div>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-400">{lang === 'id' ? 'Dedicated High-Speed Node Path' : 'Dedicated High-Speed Node Path'}</p>
                   </div>
                   {!plan.name.toLowerCase().includes('enterprise') && (
                     <Link to="/pricing" className="group flex items-center gap-2 pt-6 text-xs font-black text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 transition-colors uppercase tracking-widest">
                        {lang === 'id' ? 'Bandingkan dengan Paket Lain' : 'Compare with Other Tiers'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </Link>
                   )}
                </div>
             </div>
             */}
          </div>
        </div>

        {/* Conditional Simulation */}
        {isPAYG && renderPAYGSimulation()}

        {/* Bottom CTA for PAYG */}
        {isPAYG && (
          <div className="mt-20 py-16 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
             <div className="space-y-4">
                <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {lang === 'id' ? 'Siap Memulai Revolusi Efisiensi Anda?' : 'Ready to Start Your Efficiency Revolution?'}
                </h3>
                <p className="text-zinc-500 max-w-2xl mx-auto font-medium">
                  {lang === 'id' 
                    ? 'Bergabunglah dengan ribuan developer yang telah membebaskan diri dari biaya bulanan kaku. Top-up sekarang dan gunakan sesuai kebutuhan.' 
                    : 'Join thousands of developers who have freed themselves from rigid monthly fees. Top-up now and use only what you need.'}
                </p>
             </div>
             <div className="flex justify-center pt-4">
                <Button 
                   onClick={handleCheckout}
                   disabled={isCheckingOut}
                   className="h-16 px-16 text-xl font-black bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-95 transition-all rounded-2xl group"
                >
                   {isCheckingOut ? (
                     <div className="flex items-center gap-3">
                       <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                       <span>{lang === 'id' ? 'Memproses...' : 'Processing...'}</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-3">
                       {lang === 'id' ? 'Top-Up Sekarang' : 'Top-Up Now'} 
                       <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                     </div>
                   )}
                </Button>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
               {lang === 'id' ? 'Proses Instan • Saldo Permanen • Aman' : 'Instant Process • Permanent Balance • Secure'}
             </p>
          </div>
        )}

        {/* Upsell Copy for Creator */}
        {isCreator && (
          <div className="mt-20 text-center space-y-6">
             <h3 className="text-3xl font-black dark:text-white">{t.upgradeCopy}</h3>
             <div className="flex justify-center gap-4">
                <Link to="/pricing"><Button variant="outline" className="h-12 px-6">{lang === 'id' ? 'Jelajahi Paket Premium' : 'Explore Premium Tiers'}</Button></Link>
             </div>
          </div>
        )}
      </main>

      <footer className="bg-zinc-950 py-12 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Bizeto Tunnel™ Inc. Human-Centric Technology for Global Impact.</p>
      </footer>

      <AlertDialog 
        isOpen={alertConfig.open} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type} 
        onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))} 
      />
    </div>
  );
}

