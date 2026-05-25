import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, AlertDialog, ConfirmDialog } from '../components/ui/Shared';
import BandwidthChart from '../components/BandwidthChart';
import { 
  Users, 
  DollarSign, 
  Settings, 
  Server, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Activity,
  Plus,
  Check,
  Database,
  Monitor,
  Cpu,
  Globe,
  X,
  Sun,
  Moon,
  Zap,
  Info,
  XCircle
} from 'lucide-react';

import { API_BASE_URL } from '../config';

const copy: Record<string, Record<string, string>> = {
  en: {
    centralRelayAdmin: "Central Relay Admin",
    navOverview: "Platform Overview",
    navSessions: "Live Sessions",
    navUsers: "Tenants & Users",
    navPricing: "Pricing Plans",
    navSettings: "System Settings",
    logout: "Logout",
    refresh: "REFRESH DATA",
    syncing: "SYNCING...",
    
    // Cluster Status
    dbConnected: "CONNECTED",
    clusterOptimized: "OPTIMIZED",
    relayHealthy: "HEALTHY",
    traffic24h: "Traffic/24h",
    
    // Overview
    revenue: "Revenue (MRR)",
    activeSubscriptions: "ACTIVE SUBSCRIPTIONS",
    globalTenants: "Global Tenants",
    registeredAccounts: "Registered Accounts",
    liveTunnels: "Live Tunnels",
    connectedSessions: "Connected Sessions",
    totalDomains: "Total Domains",
    domainsAllocated: "Domains Allocated",
    clusterPerformance: "Cluster Performance",
    systemReliability: "System Reliability (SLA)",
    liveConsole: "Live Console",
    
    // Sessions
    activeGlobalSessions: "Active Global Sessions",
    realtimeMonitoring: "Real-time edge device monitoring & traffic metrics",
    online: "Online",
    tableOrigin: "Origin / Identity",
    tableHardware: "Hardware & OS",
    tableNetwork: "Network Metadata",
    tableUptime: "Uptime",
    tableThroughput: "Throughput",
    noSessions: "No agents connected to relay edge cluster.",
    
    // Users
    tenantsAndUsers: "Tenants & Users",
    manageUsers: "Manage all registered users in your SaaS.",
    tableEmail: "Email",
    tableName: "Full Name",
    tableRole: "Role & Plan",
    tableStatus: "Status",
    tableActions: "Actions",
    statusActive: "Active",
    statusDisabled: "Disabled",
    actionEnable: "Enable",
    actionDisable: "Disable",
    
    // Settings
    globalRelayConfig: "Global Relay Configuration",
    controlPort: "Control Port",
    apiPort: "API Port",
    maintenanceMode: "Maintenance Mode",
    offlineMode: "OFFLINE MODE",
    forceDisconnect: "Force disconnect all agents and block new connections.",
    activate: "Activate",

    // Feedback
    errConn: "Connection to relay cluster failed.",
    errToggle: "Failed to toggle user status.",
    errRole: "Failed to update user role.",
    msgPlanSaved: "Pricing plan has been saved.",
    errPlanSave: "Failed to save plan.",
    errConnLost: "Connection lost.",
    planUpdated: "Plan Updated",
    roleUpdated: "Role Updated",
    msgRoleUpdated: "User role has been updated.",
    confirmToggleTitle: "Toggle User",
    confirmToggleMsg: "Are you sure you want to change this user's status?",
    confirmRoleTitle: "Change User Role",
    confirmRoleMsg: "Are you sure you want to change this user's role?",

    // Pricing
    pricingTitle: "Manage Pricing Plans",
    addPlan: "Add New Plan",
    editPlan: "Edit Plan",
    monthly: "/mo",
    features: "Key Features",
    tunnels: "Concurrent Tunnels",
    customDomains: "Custom Domains (BYOD)",
    subdomains: "Random Subdomains",
    tcpSupport: "TCP & HTTP Full Proxy",
    httpOnly: "HTTP Only",
    tls: "End-to-End TLS 1.3 Encryption",
    ddos: "Global DDoS Protection",
    secureYamux: "Secure Yamux Multiplexing",
    marketingSub: "Configure your service tiers. Focus on Free and PAYG models for maximum conversion.",
    targetFree: "Perfect for hobbyists & students exploring secure tunneling.",
    targetPAYG: "Professional infrastructure with zero monthly commitments.",
    tooltipYamux: "Yamux multiplexes multiple streams over a single TCP connection, reducing latency.",
    tooltipTLS: "Military-grade encryption ensuring your data cannot be intercepted.",
    tooltipTCP: "Allows tunneling of non-HTTP traffic like SSH, Databases, and Game Servers.",
    compareTitle: "Feature Comparison Matrix",
    compareDesc: "A detailed breakdown of capabilities across all tiers.",
    featMaxTunnels: "Max Concurrent Tunnels",
    featCustomDomain: "Custom Domain Support (BYOD)",
    featTCP: "TCP Proxy (Non-HTTP)",
    featDDoS: "Global DDoS Protection",
    featYamux: "Yamux Multiplexing",
    featTLS: "End-to-End TLS 1.3",
    featPort: "Dynamic Port Forwarding",
    featSupport: "Premium Support",
    featSLA: "99.9% SLA Guarantee",
    descMaxTunnels: "The maximum number of active tunnels you can run simultaneously.",
    descCustomDomain: "Bring Your Own Domain (BYOD). Use your own brand instead of our default subdomains. Auto-SSL included.",
    descTCP: "Proxy raw TCP streams. Essential for tunneling SSH, databases (Postgres, MySQL), and game servers.",
    descDDoS: "Enterprise-grade mitigation against Layer 3/4/7 DDoS attacks at our edge nodes.",
    descYamux: "Multiplexes thousands of logical streams over a single TCP connection to eliminate head-of-line blocking.",
    descTLS: "All traffic between the local agent and the relay edge is encrypted using TLS 1.3.",
    descPort: "Dynamically route traffic to different local ports without restarting the agent.",
    descSupport: "24/7 priority email and chat support with dedicated engineers.",
    descSLA: "Financially backed Service Level Agreement ensuring 99.9% uptime.",
    noPlansFound: "No pricing plans found",
    noPlansSub: "Start by creating your first subscription tier.",
    planName: "Plan Name",
    monthlyPrice: "Monthly Price",
    maxTunnelsLabel: "Max Tunnels",
    supportCustomDomain: "Support Custom Domains (BYOD)",
    supportTCP: "Support TCP Proxy (Non-HTTP)",
    cancel: "Cancel",
    save: "Save Plan",
    planStatus: "Status",
    planStatusActive: "Active",
    planStatusInactive: "Hidden",
    basePriceIDR: "Base Price (IDR)",
    basePriceUSD: "Base Price (USD)",
    promoPriceIDR: "Promo Price (IDR)",
    promoPriceUSD: "Promo Price (USD)",
    featureList: "Features List (One per line)",
    featureListPlaceholder: "1 Active Tunnel\n1GB High-Speed Bandwidth\nPriority Traffic"
  },
  id: {
    centralRelayAdmin: "Admin Relay Pusat",
    navOverview: "Overview Platform",
    navSessions: "Sesi Langsung",
    navUsers: "Penyewa & Pengguna",
    navPricing: "Paket Harga",
    navSettings: "Pengaturan Sistem",
    logout: "Keluar",
    refresh: "PERBARUI DATA",
    syncing: "SINKRONISASI...",
    dbConnected: "TERHUBUNG",
    clusterOptimized: "TEROPTIMASI",
    relayHealthy: "NORMAL",
    traffic24h: "Trafik/24jam",
    revenue: "Pendapatan (MRR)",
    activeSubscriptions: "LANGGANAN AKTIF",
    globalTenants: "Penyewa Global",
    registeredAccounts: "Akun Terdaftar",
    liveTunnels: "Tunnel Aktif",
    connectedSessions: "Sesi Terhubung",
    totalDomains: "Total Domain",
    domainsAllocated: "Domain Dialokasikan",
    clusterPerformance: "Performa Klaster",
    systemReliability: "Reliabilitas Sistem (SLA)",
    liveConsole: "Konsol Langsung",
    activeGlobalSessions: "Sesi Global Aktif",
    realtimeMonitoring: "Pemantauan perangkat edge & metrik trafik real-time",
    online: "Online",
    tableOrigin: "Asal / Identitas",
    tableHardware: "Perangkat & OS",
    tableNetwork: "Metadata Jaringan",
    tableUptime: "Waktu Aktif",
    tableThroughput: "Throughput",
    noSessions: "Tidak ada agen yang terhubung ke klaster relay edge.",
    tenantsAndUsers: "Penyewa & Pengguna",
    manageUsers: "Kelola semua pengguna terdaftar di SaaS Anda.",
    tableEmail: "Email",
    tableName: "Nama Lengkap",
    tableRole: "Peran & Paket",
    tableStatus: "Status",
    tableActions: "Aksi",
    statusActive: "Aktif",
    statusDisabled: "Nonaktif",
    actionEnable: "Aktifkan",
    actionDisable: "Matikan",
    globalRelayConfig: "Konfigurasi Relay Global",
    controlPort: "Port Kontrol",
    apiPort: "Port API",
    maintenanceMode: "Mode Pemeliharaan",
    offlineMode: "MODE OFFLINE",
    forceDisconnect: "Putuskan paksa semua agen dan blokir koneksi baru.",
    activate: "Aktifkan",
    errConn: "Koneksi ke klaster relay gagal.",
    errToggle: "Gagal mengubah status pengguna.",
    errRole: "Gagal memperbarui peran pengguna.",
    msgPlanSaved: "Paket harga telah disimpan.",
    errPlanSave: "Gagal menyimpan paket.",
    errConnLost: "Koneksi terputus.",
    planUpdated: "Paket Diperbarui",
    roleUpdated: "Peran Diperbarui",
    msgRoleUpdated: "Peran pengguna telah diperbarui.",
    confirmToggleTitle: "Ubah Status Pengguna",
    confirmToggleMsg: "Apakah Anda yakin ingin mengubah status pengguna ini?",
    confirmRoleTitle: "Ubah Peran Pengguna",
    confirmRoleMsg: "Apakah Anda yakin ingin mengubah peran pengguna ini?",
    pricingTitle: "Kelola Paket Harga",
    addPlan: "Tambah Paket Baru",
    editPlan: "Edit Paket",
    monthly: "/bln",
    features: "Fitur Unggulan",
    tunnels: "Tunnel Bersamaan",
    customDomains: "Domain Kustom (BYOD)",
    subdomains: "Subdomain Acak",
    tcpSupport: "Proxy TCP & HTTP Penuh",
    httpOnly: "Hanya HTTP",
    tls: "Enkripsi End-to-End TLS 1.3",
    ddos: "Proteksi DDoS Global",
    secureYamux: "Multiplexing Yamux Aman",
    marketingSub: "Rancang tingkatan paket yang sempurna. Fokus pada model Free dan PAYG untuk konversi maksimal.",
    targetFree: "Sempurna untuk pelajar & hobiis yang mulai mencoba secure tunneling.",
    targetPAYG: "Infrastruktur profesional tanpa biaya bulanan tetap.",
    tooltipYamux: "Yamux melakukan multiplexing banyak stream dalam satu koneksi TCP, mengurangi jeda secara drastis.",
    tooltipTLS: "Enkripsi tingkat militer yang memastikan data Anda tidak dapat disadap di tengah jalan.",
    tooltipTCP: "Memungkinkan tunneling untuk trafik selain HTTP seperti SSH, Database, dan Server Game.",
    compareTitle: "Matriks Perbandingan Fitur",
    compareDesc: "Rincian mendalam mengenai kapabilitas di setiap tingkatan paket.",
    featMaxTunnels: "Maksimal Tunnel Bersamaan",
    featCustomDomain: "Domain Kustom Sendiri (BYOD)",
    featTCP: "Proxy TCP (Selain HTTP)",
    featDDoS: "Proteksi Anti-DDoS Global",
    featYamux: "Yamux Multiplexing",
    featTLS: "Enkripsi End-to-End TLS 1.3",
    featPort: "Dynamic Port Forwarding",
    featSupport: "Dukungan Teknis Premium",
    featSLA: "Garansi SLA Uptime 99.9%",
    descMaxTunnels: "Jumlah maksimal agen tunnel aktif yang bisa Anda jalankan dalam waktu bersamaan.",
    descCustomDomain: "Gunakan nama domain brand Anda sendiri alih-alih subdomain acak kami. Sudah termasuk SSL otomatis.",
    descTCP: "Buka akses proxy untuk aliran TCP mentah. Sangat penting untuk remote SSH, database, dan server game.",
    descDDoS: "Mitigasi otomatis terhadap serangan DDoS Layer 3/4/7 langsung di server edge kami.",
    descYamux: "Menggabungkan ribuan aliran logis ke dalam satu koneksi TCP untuk performa tanpa hambatan (zero latency lag).",
    descTLS: "Seluruh lalu lintas dari agen lokal ke server relay dilindungi oleh enkripsi TLS 1.3 tingkat militer.",
    descPort: "Rutekan lalu lintas ke port lokal yang berbeda secara dinamis tanpa perlu merestart agen.",
    descSupport: "Dukungan prioritas 24/7 via email dan chat langsung dengan teknisi handal kami.",
    descSLA: "Perjanjian Tingkat Layanan (SLA) dengan kompensasi finansial untuk menjamin uptime sistem 99.9%.",
    noPlansFound: "Tidak ada paket harga ditemukan",
    noPlansSub: "Mulai dengan membuat tingkatan langganan pertama Anda.",
    planName: "Nama Paket",
    monthlyPrice: "Harga Bulanan",
    maxTunnelsLabel: "Maksimal Tunnel",
    supportCustomDomain: "Dukung Domain Kustom (BYOD)",
    supportTCP: "Dukung Proxy TCP (Selain HTTP)",
    cancel: "Batal",
    save: "Simpan Paket",
    planStatus: "Status",
    planStatusActive: "Aktif",
    planStatusInactive: "Tersembunyi",
    basePriceIDR: "Harga Dasar (IDR)",
    basePriceUSD: "Harga Dasar (USD)",
    promoPriceIDR: "Harga Promo (IDR)",
    promoPriceUSD: "Harga Promo (USD)",
    featureList: "Daftar Fitur (Satu per baris)",
    featureListPlaceholder: "1 Tunnel Aktif\n1GB Bandwidth Kecepatan Tinggi\nPrioritas Trafik"
  }
};

export default function OwnerDashboard() {
  const { logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [lang, setLang] = useState<'id' | 'en'>('en');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(16500);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/exchange-rate`)
      .then(res => res.json())
      .then(data => {
        if (data && data.USD_TO_IDR) setExchangeRate(data.USD_TO_IDR);
      })
      .catch(err => console.error("Failed to fetch exchange rate:", err));

    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLang = () => {
    const nextLang = lang === 'en' ? 'id' : 'en';
    setLang(nextLang);
    setCurrency(nextLang === 'id' ? 'IDR' : 'USD');
  };

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'ID') {
          setCurrency('IDR');
          setLang('id');
        }
      })
      .catch(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz && (tz.includes('Jakarta') || tz.includes('Makassar') || tz.includes('Jayapura'))) {
          setCurrency('IDR');
          setLang('id');
        }
      });
  }, []);

  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{show: boolean, title: string, msg: string, type: 'info' | 'error' | 'success', onConfirm?: () => void}>({
    show: false, title: '', msg: '', type: 'info'
  });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState<any>({
    id: '', name: '', description: '', 
    price_idr: 0, price_usd: 0, 
    promo_price_idr: 0, promo_price_usd: 0,
    max_tunnels: 1, custom_domain: false, tcp_support: false,
    features_list: '',
    discount_6_months: 0, discount_12_months: 0, discount_24_months: 0
  });

  const showInfo = (title: string, msg: string) => setModal({ show: true, title, msg, type: 'info' });
  const showError = (msg: string) => setModal({ show: true, title: 'Error', msg, type: 'error' });
  const askConfirm = (title: string, msg: string, onConfirm: () => void) => setModal({ show: true, title, msg, type: 'info', onConfirm });

  const API_BASE = `${API_BASE_URL}/api/owner`;

  const fetchWithAuth = (url: string, options: any = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': options.body ? 'application/json' : (options.headers?.['Content-Type'] || undefined)
      }
    });
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, tenantsRes, plansRes, sessionsRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/stats`),
        fetchWithAuth(`${API_BASE}/tenants`),
        fetchWithAuth(`${API_BASE}/pricing-plans`),
        fetchWithAuth(`${API_BASE}/sessions`)
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (tenantsRes.ok) setTenants(await tenantsRes.json());
      if (plansRes.ok) {
        const data = await plansRes.json();
        const filtered = (Array.isArray(data) ? data : []).filter(p => 
          p.name.toLowerCase().includes('free') || 
          p.name.toLowerCase().includes('gratis') ||
          p.name.toLowerCase().includes('pay-as-you-go') ||
          p.name.toLowerCase().includes('bayar')
        );
        setPlans(filtered);
      }
      if (sessionsRes.ok) setSessions(await sessionsRes.json());
    } catch (error) {
      showError(copy[lang].errConn);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const toggleUser = async (id: string) => {
    askConfirm(copy[lang].confirmToggleTitle, copy[lang].confirmToggleMsg, async () => {
      await fetchWithAuth(`${API_BASE}/tenants/toggle?id=${id}`, { method: 'POST' });
      fetchData();
    });
  };

  const updateUserRole = async (id: string, newRole: string) => {
    askConfirm(copy[lang].confirmRoleTitle, `${copy[lang].confirmRoleMsg} (${newRole})?`, async () => {
      const res = await fetchWithAuth(`${API_BASE}/tenants/role`, { 
        method: 'POST',
        body: JSON.stringify({ user_id: id, role: newRole })
      });
      if (res.ok) {
        fetchData();
        showInfo(copy[lang].roleUpdated, `${copy[lang].msgRoleUpdated} (${newRole})`);
      } else {
        showError(copy[lang].errRole);
      }
    });
  };

  const openPlanModal = (existingPlan: any = null) => {
    if (existingPlan) {
      setEditPlan({
        ...existingPlan,
        features_list: existingPlan.features_list || '',
        price_idr: existingPlan.price_idr || 0,
        price_usd: existingPlan.price_usd || existingPlan.price_monthly || 0,
        promo_price_idr: existingPlan.promo_price_idr || 0,
        promo_price_usd: existingPlan.promo_price_usd || 0,
        is_active: existingPlan.is_active !== undefined ? existingPlan.is_active : true
      });
    } else {
      setEditPlan({ 
        id: '', name: '', description: '', 
        price_idr: 0, price_usd: 0, 
        promo_price_idr: 0, promo_price_usd: 0,
        max_tunnels: 1, custom_domain: false, tcp_support: false,
        features_list: '', is_active: true,
        discount_6_months: 0, discount_12_months: 0, discount_24_months: 0
      });
    }
    setShowPlanModal(true);
  };

  const savePlan = async () => {
    if (!editPlan.name) {
      showError(lang === 'id' ? "Nama paket wajib diisi" : "Plan name is required");
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE}/pricing-plans/upsert`, {
        method: 'POST',
        body: JSON.stringify({ ...editPlan, price_monthly: editPlan.price_usd })
      });
      if (res.ok) {
        setShowPlanModal(false);
        fetchData();
        showInfo(copy[lang].planUpdated, `${copy[lang].msgPlanSaved} (${editPlan.name})`);
      } else {
        showError(copy[lang].errPlanSave);
      }
    } catch (e) {
      showError(copy[lang].errConnLost);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: copy[lang].navOverview, icon: Activity },
    { id: 'sessions', label: copy[lang].navSessions, icon: Server },
    { id: 'users', label: copy[lang].navUsers, icon: Users },
    { id: 'pricing', label: copy[lang].navPricing, icon: DollarSign },
    { id: 'settings', label: copy[lang].navSettings, icon: Settings },
  ];

  const renderOverview = () => {
    const formatValue = (val: number, isCurrency = false) => {
      if (isCurrency && currency === 'IDR') {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val * exchangeRate);
      }
      if (isCurrency) return `$${val}`;
      return val.toLocaleString();
    };

    return (
      <div className="space-y-8 animate-in fade-in pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-l-4 border-l-emerald-500 flex flex-col justify-between group hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{copy[lang].revenue}</h3>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-black dark:text-white">{formatValue(stats?.total_mrr || 0, true)}</p>
              <p className="text-[10px] text-emerald-500 mt-2 flex items-center font-bold"><TrendingUp className="w-3 h-3 mr-1" /> {copy[lang].activeSubscriptions}</p>
            </div>
            <div className="h-12 mt-4 opacity-50">
              <BandwidthChart dataPoints={stats?.history_mrr || [0,0,0,0,0,0,0]} color="emerald" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-blue-500 flex flex-col justify-between group hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{copy[lang].globalTenants}</h3>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-black dark:text-white">{formatValue(stats?.active_tenants || 0)}</p>
              <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-tight">{copy[lang].registeredAccounts}</p>
            </div>
            <div className="h-12 mt-4 opacity-50">
              <BandwidthChart dataPoints={stats?.history_tenants || [0,0,0,0,0,0,0]} color="blue" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-purple-500 group hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{copy[lang].liveTunnels}</h3>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-black dark:text-white">{stats?.active_tunnels || 0}</p>
            <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-tight">{copy[lang].connectedSessions}</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-amber-500 group hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{copy[lang].totalDomains}</h3>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-black dark:text-white">{stats?.total_domains || 0}</p>
            <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-tight">{copy[lang].domainsAllocated}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6 bg-zinc-900 border-zinc-800 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Database className="w-32 h-32 rotate-12" />
            </div>
            <h4 className="text-sm font-black mb-6 flex items-center gap-2 tracking-widest uppercase text-zinc-400">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
               {copy[lang].clusterPerformance}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">PostgreSQL</p>
                <p className="text-sm text-emerald-400 font-bold flex items-center gap-2 leading-none">{copy[lang].dbConnected}</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">Redis Cluster</p>
                <p className="text-sm text-emerald-400 font-bold flex items-center gap-2 leading-none">{copy[lang].clusterOptimized}</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">Relay Node</p>
                <p className="text-sm text-emerald-400 font-bold flex items-center gap-2 leading-none">{copy[lang].relayHealthy}</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">{copy[lang].traffic24h}</p>
                <p className="text-sm text-white font-bold flex items-center gap-2 leading-none">{stats?.traffic_today_mb || 0} MB</p>
              </div>
            </div>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center px-1">
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{copy[lang].systemReliability}</span>
                 <span className="text-[10px] font-black text-emerald-400 uppercase">99.98%</span>
               </div>
               <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 w-[99.9%]"></div>
               </div>
            </div>
          </Card>

          <Card className="p-0 bg-zinc-950 border-zinc-800 shadow-2xl flex flex-col min-h-[340px]">
             <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <div className="flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">{copy[lang].liveConsole}</span>
                <Badge variant="default" className="bg-zinc-800 text-zinc-500 border-none text-[8px] px-1.5 py-0">STDOUT</Badge>
             </div>
             <div className="flex-1 p-4 font-mono text-[10px] leading-relaxed overflow-y-auto space-y-1 scrollbar-hide">
                <div className="text-zinc-500">[{new Date().toLocaleTimeString()}] <span className="text-emerald-500 font-bold">SYS</span> Kernel: Bizeto Tunnel™-Relay v1.0.0 initializing...</div>
                <div className="text-zinc-500">[{new Date().toLocaleTimeString()}] <span className="text-emerald-500 font-bold">SYS</span> Network: Listening on ports 80, 443, 4321</div>
                <div className="text-zinc-500">[{new Date().toLocaleTimeString()}] <span className="text-blue-400 font-bold">INF</span> Auth: JWT Validation Provider ready</div>
                {sessions.slice(0, 8).map((s, i) => (
                  <div key={i} className="text-zinc-300 animate-in slide-in-from-left-2 duration-300">
                    <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span> <span className="text-indigo-400 font-bold">CON</span> Agent <span className="text-white">@{s.domain}</span> handshake from {s.agent_ip}
                  </div>
                ))}
                <div className="text-zinc-600 mt-2">_</div>
             </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderSessions = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold dark:text-white">{copy[lang].activeGlobalSessions}</h3>
          <p className="text-sm text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">{copy[lang].realtimeMonitoring}</p>
        </div>
        <Badge variant="success" className="animate-pulse">{sessions?.length || 0} {copy[lang].online}</Badge>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-500 text-[10px] uppercase font-bold">
                <th className="px-6 py-4 text-left">{copy[lang].tableOrigin}</th>
                <th className="px-6 py-4 text-left">{copy[lang].tableHardware}</th>
                <th className="px-6 py-4 text-left">{copy[lang].tableNetwork}</th>
                <th className="px-6 py-4 text-left">{copy[lang].tableUptime}</th>
                <th className="px-6 py-4 text-right">{copy[lang].tableThroughput}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sessions?.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-indigo-500">
                          {s.domain.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <p className="font-black dark:text-white text-xs tracking-tight">{s.domain}</p>
                          <p className="text-[10px] text-zinc-500">{s.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <div className={`p-1 rounded bg-zinc-100 dark:bg-zinc-800`}>
                         {s.os_info.toLowerCase().includes('windows') ? <Monitor className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                      </div>
                      <span className="font-bold text-[11px]">{s.hostname}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1 uppercase font-black opacity-60 tracking-tighter">
                      {s.os_info}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <img src={`https://flagcdn.com/w20/${s.agent_ip === '127.0.0.1' ? 'id' : 'us'}.png`} alt="Flag" className="w-4 h-3 rounded-sm object-cover" />
                       <p className="text-xs font-mono dark:text-zinc-300">{s.agent_ip}</p>
                    </div>
                    <Badge variant="default" className="text-[8px] mt-1.5 font-black uppercase tracking-widest py-0">Bizeto Tunnel™-v{s.agent_version}</Badge>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-mono text-zinc-500">
                    {s.connected_at.split('.')[0]}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[10px]">
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-emerald-500 font-black">↑ {(s.bytes_out / 1024).toFixed(1)} KB</span>
                       <span className="text-blue-500 font-black">↓ {(s.bytes_in / 1024).toFixed(1)} KB</span>
                    </div>
                  </td>
                </tr>
              ))}
              {(sessions?.length || 0) === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">{copy[lang].noSessions}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold dark:text-white">{copy[lang].tenantsAndUsers}</h3>
          <p className="text-sm text-zinc-500">{copy[lang].manageUsers}</p>
        </div>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-500 text-[10px] uppercase font-bold">
                <th className="px-6 py-4 text-left">{copy[lang].tableEmail}</th>
                <th className="px-6 py-4 text-left">{copy[lang].tableName}</th>
                <th className="px-6 py-4 text-left">Bandwidth Quota</th>
                <th className="px-6 py-4 text-left">{copy[lang].tableStatus}</th>
                <th className="px-6 py-4 text-right">{copy[lang].tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tenants?.map((t) => {
                const purchased = t.total_bytes_purchased || 0;
                const used = t.total_bytes_used || 0;
                const remaining = Math.max(purchased - used, 0);
                const isThrottled = t.is_throttled;
                return (
                  <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium dark:text-zinc-100">
                       {t.email}
                       <div className="text-[9px] text-zinc-500 mt-1 uppercase font-bold">Topup: Rp {t.total_topup_idr?.toLocaleString('id-ID') || 0}</div>
                    </td>
                    <td className="px-6 py-4 dark:text-zinc-300">
                       {t.full_name || '-'}
                       <div className="mt-1">
                          <Badge variant={t.role === 'OWNER' ? 'error' : 'default'} className="text-[8px] uppercase">{t.role}</Badge>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-xs font-black ${isThrottled ? 'text-red-500' : 'text-emerald-500'}`}>
                           {(remaining / (1024 * 1024)).toFixed(1)} MB Sisa
                        </span>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold">Used: {(used / (1024 * 1024)).toFixed(1)} MB</span>
                        {isThrottled && <Badge variant="error" className="text-[8px] px-1 py-0 h-4 mt-0.5">THROTTLED</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={t.is_active ? 'success' : 'error'}>{t.is_active ? copy[lang].statusActive : copy[lang].statusDisabled}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-row justify-end items-center gap-2 whitespace-nowrap">
                        <Button 
                          variant={t.is_active ? "destructive" : "primary"} 
                          className="!h-8 !py-0 text-[10px] uppercase font-black w-24"
                          onClick={() => toggleUser(t.id)}
                        >
                          {t.is_active ? copy[lang].actionDisable : copy[lang].actionEnable}
                        </Button>
                        <select 
                          className="h-8 py-0 text-[10px] uppercase font-black w-24 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 box-border"
                          value={t.role}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            if (newRole !== t.role) updateUserRole(t.id, newRole);
                          }}
                        >
                          <option value="USER">User</option>
                          <option value="OWNER">Owner</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(tenants?.length || 0) === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">No tenants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderPricing = () => {
    const formatPrice = (plan: any) => {
      if (currency === 'IDR') {
        const p = plan.promo_price_idr > 0 ? plan.promo_price_idr : plan.price_idr;
        if (p === 0) return lang === 'id' ? 'GRATIS' : 'FREE';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);
      }
      const p = plan.promo_price_usd > 0 ? plan.promo_price_usd : (plan.price_usd || plan.price_monthly);
      if (p === 0) return 'FREE';
      return `$${p}`;
    };

    const getTargetAudience = (planName: string) => {
      const lower = planName.toLowerCase();
      if (lower.includes('pay-as-you-go') || lower.includes('bayar')) return copy[lang].targetPAYG;
      return copy[lang].targetFree;
    };

    return (
      <div className="space-y-12 animate-in fade-in pb-20">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div className="max-w-xl">
            <h3 className="text-3xl font-black dark:text-white tracking-tight mb-2">{copy[lang].pricingTitle}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{copy[lang].marketingSub}</p>
          </div>
          <Button onClick={() => openPlanModal()} className="shrink-0 shadow-lg bg-indigo-600 hover:bg-indigo-700 border-none text-white">
            <Plus className="w-4 h-4 mr-2" /> {copy[lang].addPlan}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {(plans?.length || 0) > 0 ? plans?.map((plan, index) => {
            const isPremium = (plan.price_idr || 0) > 0 || (plan.price_usd || plan.price_monthly || 0) > 0;
            return (
              <Card key={plan.id || index} className={`p-8 relative overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 ${isPremium ? 'border-indigo-500/50 shadow-indigo-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
                {isPremium && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                )}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={isPremium ? 'success' : 'default'} className="text-[10px] font-black tracking-widest px-3 py-1">
                      {(plan.name || '').toUpperCase()}
                    </Badge>
                    <Badge variant={plan.is_active ? 'success' : 'error'} className="text-[8px] uppercase">
                      {plan.is_active ? copy[lang].planStatusActive : copy[lang].planStatusInactive}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <h4 className="text-4xl font-black dark:text-white tracking-tighter">{formatPrice(plan)}</h4>
                    <span className="text-sm font-bold text-zinc-400">{copy[lang].monthly}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-500 italic h-8">{getTargetAudience(plan.name || '')}</p>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{copy[lang].features}</p>
                  <ul className="space-y-3">
                    {plan.features_list ? (
                      plan.features_list.split(/\r?\n|\\n/).map((feat: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0"><Check className="w-3 h-3" /></div>
                          <span className="text-sm dark:text-zinc-300">{feat}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-3">
                          <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0"><Check className="w-3 h-3" /></div>
                          <span className="text-sm dark:text-zinc-300"><strong>{plan.max_tunnels}</strong> {copy[lang].tunnels}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className={`p-1 rounded shrink-0 ${plan.custom_domain ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                            {plan.custom_domain ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </div>
                          <span className={`text-sm ${plan.custom_domain ? 'dark:text-zinc-300 font-medium' : 'text-zinc-400 line-through'}`}>
                            {plan.custom_domain ? copy[lang].customDomains : copy[lang].subdomains}
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <Button 
                  variant={isPremium ? 'primary' : 'outline'} 
                  className={`w-full h-12 font-bold ${isPremium ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/20' : ''}`} 
                  onClick={() => openPlanModal(plan)}
                >
                  <Settings className="w-4 h-4 mr-2" /> {copy[lang].editPlan}
                </Button>
              </Card>
            );
          }) : (
            <div className="col-span-full py-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
               <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-zinc-400" />
               </div>
               <h5 className="font-bold dark:text-white">{copy[lang].noPlansFound}</h5>
               <p className="text-sm text-zinc-500 mt-1">{copy[lang].noPlansSub}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-2xl space-y-6 animate-in fade-in">
      <Card className="p-6">
        <h4 className="font-bold dark:text-white mb-6">{copy[lang].globalRelayConfig}</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500">{copy[lang].controlPort}</label>
              <input type="number" defaultValue={4321} className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500">{copy[lang].apiPort}</label>
              <input type="number" defaultValue={8080} className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500">{copy[lang].maintenanceMode}</label>
            <div className="flex items-center gap-3 p-3 border border-red-100 dark:border-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-600">{copy[lang].offlineMode}</p>
                <p className="text-[10px] text-zinc-500">{copy[lang].forceDisconnect}</p>
              </div>
              <Button variant="outline" className="h-8 text-xs border-red-200 text-red-600">{copy[lang].activate}</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
        <div className="p-2 mb-4 flex flex-col items-center justify-center overflow-hidden h-32">
          <img src="/brand/logo-horizontal.png" alt="Bizeto Tunnel™" className="h-32 w-auto object-contain dark:invert" />
          <p className="text-[8px] text-zinc-500 font-black tracking-[0.2em] uppercase -mt-2 z-10 relative">{copy[lang].centralRelayAdmin}</p>
        </div>
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <item.icon className="w-4 h-4" /> {item.label} {activeTab === item.id && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
            </button>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={logout} className="w-full flex items-center gap-3 p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium text-sm">
            <LogOut className="w-4 h-4" /> {copy[lang].logout}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <h2 className="font-black text-xs uppercase tracking-[0.3em] text-zinc-400">{sidebarItems.find(i => i.id === activeTab)?.label || activeTab}</h2>
          <div className="flex items-center gap-4">
             <button onClick={toggleLang} className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-black uppercase text-zinc-500">{lang}</button>
             <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800">{theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-400" /> : <Moon className="w-4 h-4 text-zinc-500" />}</button>
             <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
             <Button variant="outline" className="h-8 text-xs font-bold" onClick={fetchData}>{loading ? copy[lang].syncing : copy[lang].refresh}</Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'sessions' && renderSessions()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'pricing' && renderPricing()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>
      </main>

      {showPlanModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black dark:text-white tracking-tight">{editPlan.id ? copy[lang].editPlan : copy[lang].addPlan}</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-zinc-500 hover:text-zinc-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{copy[lang].planName}</label>
                  <input type="text" value={editPlan.name} onChange={e => setEditPlan({...editPlan, name: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. Free, PAYG" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{copy[lang].planStatus}</label>
                  <select 
                    value={editPlan.is_active ? 'true' : 'false'} 
                    onChange={e => setEditPlan({...editPlan, is_active: e.target.value === 'true'})}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="true">{copy[lang].planStatusActive}</option>
                    <option value="false">{copy[lang].planStatusInactive}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{copy[lang].basePriceIDR}</label>
                  <input type="number" value={editPlan.price_idr} onChange={e => setEditPlan({...editPlan, price_idr: parseFloat(e.target.value)})} className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{copy[lang].basePriceUSD}</label>
                  <input type="number" value={editPlan.price_usd} onChange={e => setEditPlan({...editPlan, price_usd: parseFloat(e.target.value)})} className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{copy[lang].promoPriceIDR}</label>
                  <input type="number" value={editPlan.promo_price_idr} onChange={e => setEditPlan({...editPlan, promo_price_idr: parseFloat(e.target.value)})} className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{copy[lang].promoPriceUSD}</label>
                  <input type="number" value={editPlan.promo_price_usd} onChange={e => setEditPlan({...editPlan, promo_price_usd: parseFloat(e.target.value)})} className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{copy[lang].featureList}</label>
                <textarea value={editPlan.features_list} onChange={e => setEditPlan({...editPlan, features_list: e.target.value})} className="w-full h-32 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm font-mono" placeholder={copy[lang].featureListPlaceholder} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{copy[lang].maxTunnelsLabel}</label>
                <input type="number" value={editPlan.max_tunnels} onChange={e => setEditPlan({...editPlan, max_tunnels: parseInt(e.target.value)})} className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white" />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={editPlan.custom_domain} onChange={e => setEditPlan({...editPlan, custom_domain: e.target.checked})} className="w-5 h-5 rounded-md" />
                  <span className="text-sm font-medium dark:text-zinc-300">{copy[lang].supportCustomDomain}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={editPlan.tcp_support} onChange={e => setEditPlan({...editPlan, tcp_support: e.target.checked})} className="w-5 h-5 rounded-md" />
                  <span className="text-sm font-medium dark:text-zinc-300">{copy[lang].supportTCP}</span>
                </label>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setShowPlanModal(false)}>{copy[lang].cancel}</Button>
              <Button className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold" onClick={savePlan}>{copy[lang].save}</Button>
            </div>
          </Card>
        </div>
      )}

      {modal.onConfirm ? (
        <ConfirmDialog isOpen={modal.show} title={modal.title} message={modal.msg} onConfirm={modal.onConfirm} onClose={() => setModal({ ...modal, show: false, onConfirm: undefined })} />
      ) : (
        <AlertDialog isOpen={modal.show} title={modal.title} message={modal.msg} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />
      )}
    </div>
  );
}
