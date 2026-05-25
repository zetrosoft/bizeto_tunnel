import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, Skeleton, AlertDialog, ConfirmDialog } from '../components/ui/Shared';
import AddTunnelWizard from '../components/AddTunnelWizard';
import Onboarding from '../components/Onboarding';
import BandwidthChart from '../components/BandwidthChart';
import Cropper from 'react-easy-crop';
import { 
  Activity, 
  Key, 
  Globe, 
  Settings, 
  Server, 
  ShieldCheck, 
  Terminal, 
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  CheckCircle2,
  LogOut,
  CreditCard,
  User as UserIcon,
  Lock,
  Sun,
  Moon,
  Zap,
  X,
  CreditCard as CardIcon,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info,
  Calendar,
  Mail,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowRightCircle,
  Camera,
  Monitor,
  Cpu,
  Loader2
} from 'lucide-react';

import { API_BASE_URL } from '../config';

// Helper for cropping
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return canvas.toDataURL('image/jpeg')
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const copy: Record<string, any> = {
  en: {
    navOverview: "Overview",
    navTunnels: "Tunnels",
    navCustomDomain: "Custom Domain",
    navKeys: "API Keys",
    navBilling: "Billing & Plan",
    navDownload: "Download Agent",
    navProfile: "My Profile",
    navSettings: "Settings",
    activeConnections: "Active Connections",
    totalBandwidth: "Total Bandwidth",
    dataIn: "Data In",
    dataOut: "Data Out",
    quickStart: "System Quick-Start",
    edgeSecurity: "Edge Security",
    operational: "OPERATIONAL",
    activeTunnels: "Active Tunnels",
    addTunnel: "Add Tunnel",
    limitReached: "Plan Limit Reached!",
    upgradeNow: "Upgrade Now",
    noTunnels: "No tunnels created yet. Click \"Add Tunnel\" to get started.",
    customDomainManager: "Custom Domain Manager",
    connectDomain: "Connect Your Own Domain",
    dnsSetup: "DNS Setup",
    registeredDomains: "Registered Custom Domains",
    noCustomDomains: "No custom domains added yet.",
    authKeys: "Authentication Keys",
    generateKey: "Generate Key",
    noKeys: "No active keys. Keys are required for Agent authentication.",
    quotaRemaining: "Remaining Quota",
    usage: "Usage",
    topupTitle: "Topup Bandwidth Quota",
    recommended: "Recommended",
    buy: "Buy",
    securePayment: "Supports payments via DANA, OVO, QRIS, Credit Card, and Virtual Account.",
    throttledMsg: "Your quota has expired or reached its limit. Current tunnel speed is limited (Throttled). Please top up to restore full speed.",
    permanentQuota: "Permanent Quota",
    account: "ACCOUNT",
    plan: "PLAN",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    fullName: "Full Name",
    avatarUrl: "Avatar URL",
    generateKeyTitle: "Generate API Key",
    keyLabel: "Key Label",
    generatedKey: "Generated Key",
    important: "IMPORTANT",
    keyNote: "This API Key is a unique identity for your device. Use different keys for each computer to simplify security audits.",
    confirmSave: "Confirm & Save",
    appearance: "Appearance & UI",
    themePref: "Theme Preference",
    themeSub: "Switch between light and dark mode manually.",
    light: "Light",
    dark: "Dark",
    security: "Security Settings",
    apiAccess: "API Access Control",
    apiAccessSub: "Manage keys used by your remote agents.",
    manageKeys: "Manage Keys",
    sessionTimeout: "Session Timeout",
    sessionSub: "Auto logout after inactivity (Security standard).",
    dangerZone: "Danger Zone",
    deactivateAccount: "Deactivate Account",
    deactivateSub: "Once you delete your account, there is no going back. Please be certain.",
    deleteAccount: "Delete Account",
    deleteConfirmTitle: "Delete Account",
    deleteConfirmMsg: "Are you sure? This will remove all your tunnels and API keys permanently.",
    downloadTitle: "Download BIZETO Agent",
    downloadSub: "Choose the platform that matches your server or local machine.",
    latestVersion: "Latest stable version",
    windowsDesc: "Windows 10/11, Windows Server 2019+ (64-bit)",
    linuxDesc: "Ubuntu, Debian, CentOS, RHEL (64-bit)",
    macosDesc: "Apple Silicon (M1/M2/M3)",
    macosIntelDesc: "Intel-based Macs (64-bit)",
    downloadNow: "Download Now",
    quickStartDesc: "Place the agent binary and bizeto.json in the same folder, then run the command above.",
  },
  id: {
    navOverview: "Overview",
    navTunnels: "Tunnel",
    navCustomDomain: "Domain Kustom",
    navKeys: "Kunci API",
    navBilling: "Tagihan & Paket",
    navDownload: "Unduh Agen",
    navProfile: "Profil Saya",
    navSettings: "Pengaturan",
    activeConnections: "Koneksi Aktif",
    totalBandwidth: "Total Bandwidth",
    dataIn: "Data Masuk",
    dataOut: "Data Keluar",
    quickStart: "Mulai Cepat Sistem",
    edgeSecurity: "Keamanan Edge",
    operational: "OPERASIONAL",
    activeTunnels: "Tunnel Aktif",
    addTunnel: "Tambah Tunnel",
    limitReached: "Batas Paket Tercapai!",
    upgradeNow: "Tingkatkan Sekarang",
    noTunnels: "Belum ada tunnel yang dibuat. Klik \"Tambah Tunnel\" untuk mulai.",
    customDomainManager: "Manajer Domain Kustom",
    connectDomain: "Hubungkan Domain Anda",
    dnsSetup: "Pengaturan DNS",
    registeredDomains: "Domain Kustom Terdaftar",
    noCustomDomains: "Belum ada domain kustom.",
    authKeys: "Kunci Autentikasi",
    generateKey: "Buat Kunci",
    noKeys: "Belum ada kunci aktif. Kunci diperlukan untuk autentikasi Agen.",
    quotaRemaining: "Sisa Kuota",
    usage: "Pemakaian",
    topupTitle: "Topup Kuota Bandwidth",
    recommended: "Direkomendasikan",
    buy: "Beli",
    securePayment: "Mendukung pembayaran via DANA, OVO, QRIS, Kartu Kredit, dan Virtual Account.",
    throttledMsg: "Kuota Anda telah habis atau masa trial berakhir. Kecepatan tunnel saat ini dibatasi (Throttled). Silakan top up untuk memulihkan kecepatan penuh.",
    permanentQuota: "Kuota Permanen",
    account: "AKUN",
    plan: "PAKET",
    editProfile: "Edit Profil",
    saveChanges: "Simpan Perubahan",
    cancel: "Batal",
    fullName: "Nama Lengkap",
    avatarUrl: "URL Avatar",
    generateKeyTitle: "Buat Kunci API",
    keyLabel: "Label Kunci",
    generatedKey: "Kunci yang Dihasilkan",
    important: "PENTING",
    keyNote: "Kunci API ini adalah identitas unik perangkat Anda. Gunakan kunci berbeda untuk setiap komputer guna mempermudah audit keamanan.",
    confirmSave: "Konfirmasi & Simpan",
    appearance: "Tampilan & UI",
    themePref: "Preferensi Tema",
    themeSub: "Ganti antara mode terang dan gelap secara manual.",
    light: "Terang",
    dark: "Gelap",
    security: "Pengaturan Keamanan",
    apiAccess: "Kontrol Akses API",
    apiAccessSub: "Kelola kunci yang digunakan oleh agen remote Anda.",
    manageKeys: "Kelola Kunci",
    sessionTimeout: "Waktu Habis Sesi",
    sessionSub: "Keluar otomatis setelah tidak ada aktivitas (Standar keamanan).",
    dangerZone: "Zona Bahaya",
    deactivateAccount: "Nonaktifkan Akun",
    deactivateSub: "Setelah Anda menghapus akun, tidak ada jalan kembali. Mohon pastikan kembali.",
    deleteAccount: "Hapus Akun",
    deleteConfirmTitle: "Hapus Akun",
    deleteConfirmMsg: "Apakah Anda yakin? Ini akan menghapus semua tunnel dan kunci API Anda secara permanen.",
    downloadTitle: "Unduh Agen BIZETO",
    downloadSub: "Pilih platform yang sesuai dengan server atau mesin lokal Anda.",
    latestVersion: "Versi stabil terbaru",
    windowsDesc: "Windows 10/11, Windows Server 2019+ (64-bit)",
    linuxDesc: "Ubuntu, Debian, CentOS, RHEL (64-bit)",
    macosDesc: "Apple Silicon (M1/M2/M3)",
    macosIntelDesc: "Mac berbasis Intel (64-bit)",
    downloadNow: "Unduh Sekarang",
    quickStartDesc: "Letakkan binari agen dan file bizeto.json di folder yang sama, lalu jalankan perintah di atas.",
  }
};

export default function UserDashboard() {
  const { user, token, logout, theme, setTheme, hasAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [historyIn, setHistoryIn] = useState<number[]>(new Array(15).fill(0));
  const [historyOut, setHistoryOut] = useState<number[]>(new Array(15).fill(0));
  const [tunnels, setTunnels] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [bandwidth, setBandwidth] = useState<any>(null);
  const [trafficLogs, setTrafficLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  
  const [modal, setModal] = useState<{show: boolean, title: string, msg: string, type: 'info' | 'error' | 'success', onConfirm?: () => void}>({
    show: false, title: '', msg: '', type: 'info'
  });

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Avatar Crop State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFinalCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedImage) {
        setEditAvatar(croppedImage);
        setImageToCrop(null);
        
        // Auto-save avatar after crop
        setIsUpdatingProfile(true);
        const res = await fetchWithAuth(`${API_BASE}/user/profile/update`, {
          method: 'POST',
          body: JSON.stringify({ full_name: editName || profile?.full_name || user?.full_name, avatar_url: croppedImage })
        });
        if (res.ok) { 
          showInfo("Success", "Avatar updated successfully."); 
          fetchData(); 
        } else {
          showError("Failed to update avatar.");
        }
      }
    } catch (e) {
      showError("Failed to process image.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const [lang, setLang] = useState<'en' | 'id'>((localStorage.getItem('lang') as 'id' | 'en') || 'en');
  const t = copy[lang];
  const [currency, setCurrency] = useState<'IDR' | 'USD'>(lang === 'id' ? 'IDR' : 'USD');
  const [exchangeRate, setExchangeRate] = useState<number>(16500);

  const getBasePrice = (plan: any, isPAYG = false) => {
    if (currency === 'IDR') {
      if (isPAYG || plan.name.toLowerCase().includes('pay')) return 5000;
      if (plan.name.toLowerCase().includes('pro')) return 49000;
      if (plan.name.toLowerCase().includes('enterprise')) return 990000;
      return plan.price_monthly * exchangeRate;
    }
    return plan.price_monthly;
  };

  const formatPrice = (val: number) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    return `$${val}`;
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/exchange-rate`)
      .then(res => res.json())
      .then(data => {
        if (data && data.USD_TO_IDR) setExchangeRate(data.USD_TO_IDR);
      })
      .catch(err => console.error("Failed to fetch exchange rate:", err));

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
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz && (tz.includes('Jakarta') || tz.includes('Makassar') || tz.includes('Jayapura'))) {
            setCurrency('IDR');
            setLang('id');
            localStorage.setItem('lang', 'id');
          }
        });
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      showInfo("Payment Successful", "Pembayaran Anda sedang diproses. Mohon tunggu beberapa saat untuk sinkronisasi webhook, lalu refresh halaman ini.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('payment') === 'failed') {
      showError("Pembayaran Gagal atau Dibatalkan.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const showInfo = (title: string, msg: string) => setModal({ show: true, title, msg, type: 'info' });
  const showError = (msg: string) => setModal({ show: true, title: 'Error', msg, type: 'error' });
  const askConfirm = (title: string, msg: string, onConfirm: () => void) => setModal({ show: true, title, msg, type: 'info', onConfirm });
  
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);

  const API_BASE = `${API_BASE_URL}/api`;

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

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const fetchData = async (showSkeleton = false) => {
    if (!user || !token) return;
    if (showSkeleton) setLoading(true);
    try {
      console.log("[DASHBOARD] Fetching data for user:", user.id);
      const [statsRes, tunnelsRes, keysRes, profileRes, bwRes, logsRes, plansRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/stats`),
        fetchWithAuth(`${API_BASE}/tunnels?user_id=${user.id}`),
        fetchWithAuth(`${API_BASE}/keys?user_id=${user.id}`),
        fetchWithAuth(`${API_BASE}/user/profile`),
        fetchWithAuth(`${API_BASE}/bandwidth/status`),
        fetchWithAuth(`${API_BASE}/tunnels/traffic`),
        fetch(`${API_BASE_URL}/api/pricing-plans`)
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (profileRes.ok) {
        const pData = await profileRes.json();
        setProfile(pData);
        setEditName(pData.full_name);
        setEditAvatar(pData.avatar_url);
      }
      
      if (tunnelsRes.ok) {
        const tunnelData = await tunnelsRes.json();
        setTunnels(tunnelData);
        if ((tunnelData?.length || 0) === 0 && !localStorage.getItem('onboarding_seen')) {
          setShowOnboarding(true);
        }
      }

      if (keysRes.ok) {
        const keys = await keysRes.json();
        console.log("[DASHBOARD] Loaded API Keys:", keys?.length);
        setApiKeys(keys || []);
      } else {
        console.error("[DASHBOARD] Failed to load API Keys:", keysRes.status);
      }

      if (bwRes.ok) setBandwidth(await bwRes.json());
      if (logsRes.ok) setTrafficLogs(await logsRes.json() || []);
      if (plansRes.ok) setPlans(await plansRes.json() || []);
    } catch (error) {
      console.error("[DASHBOARD] Data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [user, token]);

  useEffect(() => {
    if (stats) {
      setHistoryIn(prev => [...prev.slice(1), stats.bytes_in || 0]);
      setHistoryOut(prev => [...prev.slice(1), stats.bytes_out || 0]);
    }
  }, [stats]);

  const updateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/user/profile/update`, {
        method: 'POST',
        body: JSON.stringify({ full_name: editName, avatar_url: editAvatar })
      });
      if (res.ok) {
        showInfo("Success", "Profile updated successfully.");
        setShowEditProfile(false);
        fetchData();
      } else {
        showError("Failed to update profile.");
      }
    } catch (e) {
      showError("Connection error.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleTopup = async (amount: number, curr: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/billing/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount: amount, currency: curr })
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.invoice_url;
      } else {
        showError(`Topup failed: ${await res.text()}`);
      }
    } catch (e) {
      showError("Connection error during topup.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteTunnel = async (id: string) => {
    askConfirm("Delete Tunnel", "Are you sure you want to delete this tunnel? This action cannot be undone.", async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/tunnels/delete?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
        else showError("Failed to delete tunnel.");
      } catch (e) {
        showError("Connection lost.");
      }
    });
  };

  const addCustomDomain = async () => {
    if (!newCustomDomain) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/tunnels/custom/add`, {
        method: 'POST',
        body: JSON.stringify({ user_id: user?.id, domain: newCustomDomain })
      });
      if (res.ok) {
        setNewCustomDomain('');
        fetchData();
        showInfo("Success", "Custom domain added successfully.");
      } else {
        showError("Failed to add custom domain.");
      }
    } catch (e) {
      showError("Connection lost.");
    }
  };

  const verifyDNS = async (domain: string) => {
    setVerifyingDomain(domain);
    try {
      const res = await fetchWithAuth(`${API_BASE}/tunnels/custom/verify?domain=${domain}`);
      const data = await res.json();
      if (data.valid) showInfo("DNS Verified", `Success! ${domain} is now verified and active.`);
      else showError(`Verification failed. Please ensure A Record for ${domain} points to ${stats?.relay_info?.node_id === 'DEV-NODE' ? '127.0.0.1' : 'your server IP'}`);
      fetchData();
    } catch (e) {
      showError("Verification request failed.");
    } finally {
      setVerifyingDomain(null);
    }
  };

  const deleteKey = async (id: string) => {
    askConfirm("Delete API Key", "Deleting this key will immediately disconnect any agent using it. Continue?", async () => {
      const res = await fetchWithAuth(`${API_BASE}/keys/delete?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else showError("Failed to delete key.");
    });
  };

  const downloadConfig = async (keyID: string, label: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/keys/download-config?key_id=${keyID}`);
      if (!res.ok) throw new Error("Failed to download config");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizeto-${label.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError("Gagal mengunduh konfigurasi.");
    }
  };

  const createKey = async () => {
    if (!newKeyLabel) return;
    try {
      await fetchWithAuth(`${API_BASE}/keys/create`, {
        method: 'POST',
        body: JSON.stringify({ user_id: user?.id, label: newKeyLabel, key: generatedKey })
      });
      setShowKeyModal(false);
      setNewKeyLabel('');
      fetchData();
    } catch (e) {
      showError("Failed to create key.");
    }
  };

  const openKeyModal = () => {
    setGeneratedKey("BZT-" + Math.random().toString(36).substring(2, 15).toUpperCase());
    setShowKeyModal(true);
  };

  const sidebarItems = [
    { id: 'overview', label: t.navOverview, icon: Activity, feature: 'stats' },
    { id: 'tunnels', label: t.navTunnels, icon: Globe, feature: 'tunnels' },
    { id: 'custom_domain', label: t.navCustomDomain, icon: ShieldCheck, feature: 'custom_domain' },
    { id: 'keys', label: t.navKeys, icon: Key, feature: 'stats' },
    { id: 'billing', label: t.navBilling, icon: CreditCard, feature: 'stats' },
    { id: 'download', label: t.navDownload, icon: Download, feature: 'stats' },
    { id: 'profile', label: t.navProfile, icon: UserIcon, feature: 'stats' },
    { id: 'settings', label: t.navSettings, icon: Settings, feature: 'stats' },
  ];

  const renderSkeletons = (count = 4) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array(count).fill(0).map((_, i) => (
        <Card key={i} className="p-5 space-y-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </Card>
      ))}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {loading && !stats ? renderSkeletons() : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: t.activeConnections, value: stats?.active_connections || "0", sub: "Connected agents", icon: Server, history: [0, 2, 5, 3, 4, 2, stats?.active_connections || 0], color: 'blue' as const },
            { label: t.totalBandwidth, value: formatBytes((stats?.bytes_in || 0) + (stats?.bytes_out || 0)), sub: "Live data transfer", icon: Activity, history: historyIn.map((v, i) => v + historyOut[i]), color: 'emerald' as const },
            { label: t.dataIn, value: formatBytes(stats?.bytes_in || 0), sub: "Received from agents", icon: ShieldCheck, history: historyIn, color: 'blue' as const },
            { label: t.dataOut, value: formatBytes(stats?.bytes_out || 0), sub: "Sent to agents", icon: Globe, history: historyOut, color: 'emerald' as const },
          ].map((s, i) => (
            <Card key={i} className="p-5 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <s.icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="w-20 h-10 opacity-50">
                  <BandwidthChart dataPoints={s.history} color={s.color} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold tracking-tight dark:text-white">{s.value}</p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-l-4 border-l-zinc-900 dark:border-l-zinc-100">
           <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2"><Terminal className="w-4 h-4" /> {t.quickStart}</h4>
           <div className="bg-zinc-950 p-4 rounded-lg font-mono text-xs text-emerald-400 mb-4">
             ./bizeto-agent
           </div>
           <p className="text-xs text-zinc-500">{t.quickStartDesc}</p>
        </Card>
        <Card className="p-6 bg-zinc-900 text-white border-none shadow-xl relative overflow-hidden">
           <Zap className="absolute -right-4 -top-4 w-32 h-32 opacity-5 rotate-12" />
           <h4 className="font-bold mb-2 flex items-center gap-2 relative z-10">
             <ShieldCheck className="w-4 h-4 text-emerald-400" /> {t.edgeSecurity} {stats?.relay_info?.secure ? 'Active' : 'Standby'}
           </h4>
           <p className="text-xs opacity-70 relative z-10 leading-relaxed mb-6">
             All traffic is proxied through our {stats?.relay_info?.region || 'Global'} Relay with full {stats?.relay_info?.tls_ver || 'TLS'} termination 
             {stats?.relay_info?.ddos_pro ? ' and automatic DDoS protection.' : '.'}
           </p>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
             <div className={`w-2 h-2 rounded-full bg-emerald-400 ${stats?.relay_info?.secure ? 'animate-pulse' : ''}`}></div>
             {stats?.relay_info?.node_id || 'UNKNOWN-NODE'}: {t.operational}
           </div>
        </Card>
      </div>

      <Card className="p-0 border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
         <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               Live Traffic Logs
            </h4>
            <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
               <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
               <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
            </div>
         </div>
         <div className="h-64 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800">
            {(trafficLogs?.length || 0) === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 opacity-50">
                  <Terminal className="w-8 h-8" />
                  <p>Waiting for incoming requests...</p>
               </div>
            ) : (
               <div className="space-y-1">
                  {trafficLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 group hover:bg-zinc-900/50 rounded px-2 -mx-2 transition-colors py-0.5 border-b border-zinc-900/30 last:border-none">
                       <span className="text-zinc-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                       <span className={`font-black shrink-0 w-8 ${log.status >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>{log.status}</span>
                       <span className="text-indigo-400 font-bold shrink-0 w-12">{log.method}</span>
                       <span className="text-zinc-300 truncate flex-1">{log.path}</span>
                       <div className="flex gap-3 text-zinc-500 shrink-0">
                          <span className="group-hover:text-zinc-300 transition-colors flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> {log.remote_ip}</span>
                          {log.agent_hostname && <span className="group-hover:text-zinc-300 transition-colors flex items-center gap-1"><Server className="w-2.5 h-2.5" /> {log.agent_hostname}</span>}
                          {log.latency_ms > 0 && <span className="text-amber-500/80 font-bold">{log.latency_ms}ms</span>}
                          <span className="text-zinc-600 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100">{log.domain}</span>
                       </div>
                    </div>
                  ))}
               </div>
            )}
         </div>
         <div className="px-6 py-2 bg-zinc-900 border-t border-zinc-800 text-[9px] font-bold text-zinc-500 flex justify-between">
            <span>READY_FOR_TRAFFIC</span>
            <span className="animate-pulse">_</span>
         </div>
      </Card>
    </div>
  );

  const renderTunnels = () => {
    const isLimitReached = (tunnels?.length || 0) >= (profile?.max_tunnels || 1);
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t.activeTunnels}</h2>
          <Button onClick={() => setActiveTab('add-tunnel')} disabled={isLimitReached} className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4 mr-2" /> {t.addTunnel}
          </Button>
        </div>

        {isLimitReached && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-500">{t.limitReached}</p>
                <p className="text-xs text-zinc-500">Your current plan allows only {profile?.max_tunnels} active tunnel.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setActiveTab('billing')} className="bg-amber-500 text-amber-950 font-black text-[10px] uppercase tracking-widest">{t.upgradeNow}</Button>
          </div>
        )}

        <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">Tunnel & Agent</th>
                <th className="px-6 py-4">Data In/Out</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(tunnels?.length || 0) === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic">{t.noTunnels}</td></tr>
              ) : tunnels?.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold dark:text-white">{t.domain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">{t.hostname ? `${t.hostname} (${t.ip})` : `ID: ${t.id.substring(0, 8)}`}</span>
                      {t.agent_version && <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-700">v{t.agent_version}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px]">
                    <span className="text-emerald-500">↑{formatBytes(t.bytes_out, 1)}</span> / <span className="text-blue-500">↓{formatBytes(t.bytes_in, 1)}</span>
                  </td>
                  <td className="px-6 py-4"><Badge variant={t.status === 'online' ? 'success' : 'default'}>{t.status}</Badge></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-indigo-500 transition-all"><Settings className="w-4 h-4" /></button>
                       <button onClick={() => deleteTunnel(t.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  const renderCustomDomains = () => (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t.customDomainManager}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-6 md:col-span-1 space-y-4 h-fit">
            <h4 className="font-bold dark:text-white flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> {t.connectDomain}</h4>
            <div className="space-y-3">
               <input placeholder="e.g. api.mydomain.com" value={newCustomDomain} onChange={(e) => setNewCustomDomain(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" />
               <Button onClick={addCustomDomain} className="w-full bg-zinc-900 text-white dark:bg-white dark:text-black font-bold border-none shadow-lg">Register Domain</Button>
            </div>
         </Card>
         <Card className="md:col-span-2 overflow-hidden border-zinc-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.registeredDomains}</h4>
            </div>
            <table className="w-full text-left text-sm">
               <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(tunnels?.filter(t => t.is_custom)?.length || 0) === 0 ? (
                    <tr><td className="px-6 py-12 text-center text-zinc-400 italic">{t.noCustomDomains}</td></tr>
                  ) : tunnels?.filter(t => t.is_custom).map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/20 transition-colors">
                       <td className="px-6 py-4"><p className="font-bold dark:text-white">{d.domain}</p><p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Status: {d.status}</p></td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             {d.status !== 'ISSUED' && <Button size="sm" onClick={() => verifyDNS(d.domain)} disabled={verifyingDomain === d.domain} className="h-8 text-[10px] bg-emerald-600 hover:bg-emerald-500 border-none shadow-sm">{verifyingDomain === d.domain ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <ShieldCheck className="w-3 h-3 mr-1" />} Verify DNS</Button>}
                             <button onClick={() => deleteTunnel(d.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </Card>
      </div>
    </div>
  );

  const renderKeys = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t.authKeys}</h2>
          <p className="text-xs text-zinc-500 font-medium">Manage your agent authentication keys and configurations.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openKeyModal} className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4 mr-2" /> {t.generateKey}
          </Button>
        </div>
      </div>

      {(apiKeys?.length || 0) > 0 && (
        <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                 <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                 <p className="font-bold dark:text-white">Quick Configuration</p>
                 <p className="text-xs text-zinc-500">Download your secured <b>bizeto.json</b> to start your agent immediately.</p>
              </div>
           </div>
           <div className="flex gap-2">
              {apiKeys?.slice(0, 2).map(k => (
                <Button key={k.id} variant="outline" size="sm" onClick={() => downloadConfig(k.id, k.label)} className="text-[10px] font-black uppercase border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500">
                  <Download className="w-3 h-3 mr-2" /> {k.label} .JSON
                </Button>
              ))}
           </div>
        </Card>
      )}

      <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-bold uppercase text-[10px] tracking-widest border-b border-zinc-200 dark:border-zinc-800">
            <tr><th className="px-6 py-4">Key Identity</th><th className="px-6 py-4">Token Preview</th><th className="px-6 py-4">Last Used</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {(apiKeys?.length || 0) === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic">{t.noKeys}</td></tr>
            ) : apiKeys?.map((k) => (
              <tr key={k.id}>
                <td className="px-6 py-4"><p className="font-bold dark:text-white text-sm">{k.label}</p><div className="flex flex-col gap-0.5 mt-1"><p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Created: {k.created_at?.split(' ')[0]}</p><p className="text-[9px] text-indigo-500 font-bold flex items-center gap-1"><Server className="w-2.5 h-2.5" /> {k.last_hostname ? `Last Device: ${k.last_hostname}` : 'Never Used'}</p></div></td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-500"><div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-100 dark:border-zinc-800 w-fit"><span>{k.key_value.substring(0, 10)}••••••••</span><button onClick={() => copyToClipboard(k.key_value, k.id)} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{copied === k.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}</button></div></td>
                <td className="px-6 py-4"><span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">{k.last_used_at?.split(' ')[0]}</span></td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => downloadConfig(k.id, k.label)} className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-zinc-400 hover:text-emerald-500 transition-all flex items-center gap-1" title="Download bizeto.json">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteKey(k.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const renderBilling = () => {
    const purchased = bandwidth?.total_bytes_purchased || 0;
    const used = bandwidth?.total_bytes_used || 0;
    const isThrottled = bandwidth?.is_throttled || false;
    const expiresAt = bandwidth?.expires_at;
    const currentPlan = profile?.plan_name || 'Free';
    const isFree = currentPlan.toLowerCase() === 'free';
    
    const percentage = purchased > 0 ? Math.min((used / purchased) * 100, 100) : 0;
    const remaining = Math.max(purchased - used, 0);
    const topupTiers = [{ idr: 20000, usd: 4.99, gb: 1, tag: "Starter" }, { idr: 30000, usd: 6.99, gb: 1.5, tag: "Popular" }, { idr: 40000, usd: 8.99, gb: 3, tag: "Value" }, { idr: 50000, usd: 9.99, gb: 5, tag: "Best Deal" }];
    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={`p-8 border-2 transition-all ${isThrottled ? 'border-red-500/50 bg-red-500/5' : 'border-indigo-500/20 bg-indigo-500/5'} h-fit relative overflow-hidden`}>
            {isThrottled && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full"></div>}
            <div className="flex items-center gap-2 mb-4"><Badge variant={isThrottled ? "error" : "default"} className={`${!isThrottled && 'bg-indigo-500 text-white'} uppercase tracking-widest`}>{currentPlan} PLAN</Badge>{isThrottled && <Badge variant="error" className="animate-pulse">THROTTLED</Badge>}</div>
            <h3 className="text-3xl font-black dark:text-white mb-1">{formatBytes(remaining)} <span className="text-sm text-zinc-500 uppercase">{t.quotaRemaining}</span></h3>
            {isFree && expiresAt && <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-1 uppercase tracking-tighter"><Clock className="w-3 h-3" /> Trial Expires: {new Date(expiresAt).toLocaleDateString()}</p>}
            <div className="space-y-3 mt-8 mb-6 relative z-10"><div className="flex justify-between text-xs font-bold"><span className="text-zinc-500 dark:text-zinc-400">{t.usage}: {formatBytes(used)}</span><span className="dark:text-white">{percentage.toFixed(1)}% / {formatBytes(purchased)}</span></div><div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${isThrottled ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${percentage}%` }}></div></div></div>
            {isFree ? <Button onClick={() => handleTopup(currency === 'IDR' ? 20000 : 4.99, currency)} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg animate-bounce mt-4 group">UPGRADE TO PAY-AS-YOU-GO <ArrowRightCircle className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></Button> : <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg"><Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div><div><p className="text-xs font-bold dark:text-white">Pro Features Unlocked</p><p className="text-[10px] text-zinc-500">Custom Domain & TCP Proxy Active</p></div></div></div>}
          </Card>
          <Card className="p-8"><div className="flex justify-between items-center mb-6"><h4 className="font-black dark:text-white uppercase tracking-widest text-xs">{t.topupTitle}</h4><div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg scale-90 origin-right"><button onClick={() => {setCurrency('IDR'); localStorage.setItem('currency', 'IDR');}} className={`px-3 py-1 rounded text-[10px] font-black transition-all ${currency === 'IDR' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-500'}`}>IDR</button><button onClick={() => {setCurrency('USD'); localStorage.setItem('currency', 'USD');}} className={`px-3 py-1 rounded text-[10px] font-black transition-all ${currency === 'USD' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-500'}`}>USD</button></div></div><div className="space-y-4">{topupTiers.map((tier, i) => (<div key={i} className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 ${i === 3 ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5' : 'border-zinc-100 dark:border-zinc-800'}`} onClick={() => handleTopup(currency === 'IDR' ? tier.idr : tier.usd, currency)}><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center shrink-0 shadow-sm"><span className="text-[10px] font-bold text-zinc-400">ADD</span><span className="text-sm font-black text-indigo-600 dark:text-indigo-400 leading-none">{tier.gb}G</span></div><div><p className="font-bold dark:text-white">{formatPrice(currency === 'IDR' ? tier.idr : tier.usd)}</p><p className="text-[10px] text-zinc-500 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> {t.permanentQuota}</p></div></div><div className="text-right flex flex-col items-end">{i === 3 && <Badge variant="success" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none uppercase tracking-widest text-[8px] px-2 mb-1 animate-pulse">{t.recommended}</Badge>}<div className="flex items-center gap-2 text-xs font-black text-zinc-900 dark:text-zinc-100">{t.buy} <ChevronRight className="w-4 h-4" /></div></div></div>))}</div><p className="mt-6 text-[10px] text-center text-zinc-400 dark:text-zinc-500 font-medium flex items-center justify-center gap-2"><Lock className="w-3 h-3" /> {t.securePayment}</p></Card>
        </div>
      </div>
    );
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const renderDownload = () => (
    <div className="space-y-8 animate-in fade-in">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t.downloadTitle}</h2>
        <p className="text-zinc-500 mt-2">{t.downloadSub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {[
          { name: "Windows", desc: t.windowsDesc, icon: Monitor, file: "bizeto-agent-windows-amd64.exe", color: "blue" },
          { name: "Linux", desc: t.linuxDesc, icon: Server, file: "bizeto-agent-linux-amd64", color: "orange" },
          { name: "macOS (Apple Silicon)", desc: t.macosDesc, icon: Cpu, file: "bizeto-agent-darwin-arm64", color: "emerald" },
          { name: "macOS (Intel)", desc: t.macosIntelDesc, icon: Monitor, file: "bizeto-agent-darwin-amd64", color: "zinc" },
        ].map((p, i) => (
          <Card key={i} className="p-6 flex flex-col justify-between group hover:border-indigo-500 transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <p.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold dark:text-white">{p.name}</h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            </div>
            <div className="mt-8">
              <a 
                href={`/bin/${p.file}`} 
                download 
                className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4 mr-2" /> {t.downloadNow}
              </a>
            </div>
          </Card>
        ))}
      </div>

      <div className="max-w-4xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">2</div>
          <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Download Configuration (bizeto.json)</h3>
        </div>
        <Card className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="font-bold dark:text-white">Secure Configuration File</p>
              <p className="text-xs text-zinc-500">Select an API key below to generate your secured bizeto.json file.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {(apiKeys?.length || 0) === 0 ? (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('keys')} className="text-[10px] font-black uppercase">Create API Key First</Button>
              ) : apiKeys?.slice(0, 3).map(k => (
                <Button key={k.id} variant="outline" size="sm" onClick={() => downloadConfig(k.id, k.label)} className="text-[10px] font-black uppercase border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500">
                  <Download className="w-3 h-3 mr-1" /> {k.label}
                </Button>
              ))}
              {(apiKeys?.length || 0) > 3 && <Button variant="outline" size="sm" onClick={() => setActiveTab('keys')} className="text-[10px] font-black uppercase">View All Keys</Button>}
            </div>
          </div>
        </Card>
      </div>

      <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl max-w-4xl flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{t.latestVersion}: v1.1.0-stable (Secured)</p>
          <p className="text-xs text-zinc-500 mt-0.5">SHA-256 checksums are available in the documentation page.</p>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => {
    const avatarPlaceholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || user?.full_name || 'User')}&background=6366f1&color=fff&bold=true`;
    const avatarUrl = profile?.avatar_url || user?.avatar_url || avatarPlaceholder;
    return (
      <div className="space-y-6 animate-in fade-in max-w-4xl">
        <Card className="p-8 flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl">
           <div className="relative group cursor-pointer">
              <img src={avatarUrl} onError={(e) => { (e.target as HTMLImageElement).src = avatarPlaceholder; }} className="w-28 h-24 rounded-2xl shadow-xl ring-4 ring-zinc-50 dark:ring-zinc-800 object-cover" alt="Avatar" />
              <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="w-6 h-6 text-white" /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} /></label>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900"><ShieldCheck className="w-4 h-4 text-white" /></div>
           </div>
           <div className="flex-1 text-center md:text-left space-y-1">
              <h3 className="text-2xl font-black tracking-tight dark:text-white text-zinc-900">{profile?.full_name || user?.full_name || 'Unnamed User'}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 flex items-center justify-center md:justify-start gap-2 text-sm font-medium"><Mail className="w-3 h-3" /> {profile?.email || user?.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4"><Badge variant="success" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-widest text-[9px]">{profile?.plan_name || 'FREE'} {t.plan}</Badge><span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {profile?.joined_at?.split('T')[0] || 'Recently'}</span></div>
           </div>
           <Button variant="outline" className="border-zinc-200 dark:border-zinc-700 dark:text-white text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold" onClick={() => setShowEditProfile(true)}>{t.editProfile}</Button>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="p-6 space-y-4"><h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Clock className="w-3 h-3" /> Usage Statistics</h4><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800"><p className="text-[10px] font-bold text-zinc-400 uppercase">Total Tunnels</p><p className="text-xl font-black dark:text-white mt-1">{profile?.total_tunnels || 0}</p></div><div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800"><p className="text-[10px] font-bold text-zinc-400 uppercase">Data Transferred</p><p className="text-xl font-black dark:text-white mt-1">{formatBytes((profile?.total_bytes_in || 0) + (profile?.total_bytes_out || 0))}</p></div></div></Card>
           <Card className="p-6 space-y-4"><h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Shield className="w-3 h-3" /> Security Health</h4><div className="space-y-3"><div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-xs font-bold dark:text-white">Active API Keys</span></div><span className="text-xs font-black dark:text-white">{apiKeys?.length || 0}</span></div><div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-xs font-bold dark:text-white">Active Sesi</span></div><span className="text-xs font-black dark:text-white">{stats?.active_connections || 0}</span></div></div></Card>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-8 animate-in fade-in max-w-2xl">
       <section className="space-y-4">
          <h3 className="text-lg font-black dark:text-white tracking-tight flex items-center gap-2"><Sun className="w-5 h-5 text-amber-500" /> {t.appearance}</h3>
          <Card className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold dark:text-white">{t.themePref}</p><p className="text-xs text-zinc-500">{t.themeSub}</p></div>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                   <button onClick={() => setTheme('light')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-zinc-500'}`}>{t.light}</button>
                   <button onClick={() => setTheme('dark')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${theme === 'dark' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-500'}`}>{t.dark}</button>
                </div>
             </div>
          </Card>
       </section>
       <section className="space-y-4">
          <h3 className="text-lg font-black dark:text-white tracking-tight flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500" /> {t.security}</h3>
          <Card className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold dark:text-white">{t.apiAccess}</p><p className="text-xs text-zinc-500">{t.apiAccessSub}</p></div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('keys')}>{t.manageKeys} <ArrowUpRight className="w-3 h-3 ml-2" /></Button>
             </div>
             <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div><p className="text-sm font-bold dark:text-white">{t.sessionTimeout}</p><p className="text-xs text-zinc-500">{t.sessionSub}</p></div>
                <Badge variant="default">24 Hours</Badge>
             </div>
          </Card>
       </section>
       <section className="space-y-4 pt-4">
          <h3 className="text-lg font-black text-red-500 tracking-tight flex items-center gap-2"><Trash2 className="w-5 h-5" /> {t.dangerZone}</h3>
          <Card className="p-6 border-red-500/20 bg-red-500/5">
             <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold text-red-600 dark:text-red-400">{t.deactivateAccount}</p><p className="text-xs text-red-500/70">{t.deactivateSub}</p></div>
                <Button variant="destructive" onClick={() => askConfirm(t.deleteConfirmTitle, t.deleteConfirmMsg, () => showInfo("Success", "Account deletion requested."))}>{t.deleteAccount}</Button>
             </div>
          </Card>
       </section>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      {showOnboarding ? (
        <main className="flex-1 overflow-y-auto"><Onboarding onComplete={() => { setShowOnboarding(false); localStorage.setItem('onboarding_seen', 'true'); }} /></main>
      ) : (
        <>
          <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
            <div className="p-2 mb-4 flex items-center justify-center overflow-hidden h-28"><img src="/brand/logo-horizontal.png" alt="Bizeto Tunnel™" className="h-32 w-auto object-contain brightness-110 contrast-125 dark:invert dark:hue-rotate-180 dark:brightness-200" /></div>
            <nav className="flex-1 px-3 space-y-1">
              {sidebarItems.map((item) => {
                const locked = !hasAccess(item.feature);
                return (
                  <button key={item.id} onClick={() => !locked && setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${locked ? 'opacity-30 cursor-not-allowed' : activeTab === item.id ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 shadow-lg' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                    <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? '' : 'group-hover:text-zinc-900 dark:group-hover:text-zinc-50'}`} />
                    {item.label}{locked && <Lock className="w-3 h-3 ml-auto opacity-50" />}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50"><img src={profile?.avatar_url || user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=bizeto'} className="w-8 h-8 rounded-full shadow-inner ring-2 ring-white dark:ring-zinc-700 object-cover" alt="" /><div className="overflow-hidden"><p className="text-[10px] font-black truncate dark:text-white uppercase tracking-tighter">{profile?.full_name || user?.full_name}</p><p className="text-[9px] text-zinc-500 truncate">{profile?.plan_name || 'FREE'} {t.account}</p></div><button onClick={logout} className="ml-auto text-zinc-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button></div>
            </div>
          </aside>
          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-8 z-30">
              <div className="flex items-center gap-3"><h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">{activeTab.replace('-', ' ')}</h3></div>
              <div className="flex items-center gap-4">
                <button onClick={() => { const nextLang = lang === 'en' ? 'id' : 'en'; setLang(nextLang); setCurrency(nextLang === 'id' ? 'IDR' : 'USD'); localStorage.setItem('lang', nextLang); }} className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-xs font-black uppercase text-zinc-500">{lang}</button>
                <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">{theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-400" /> : <Moon className="w-4 h-4 text-zinc-500" />}</button>
                <button onClick={() => setActiveTab('settings')} className={`w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${activeTab === 'settings' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'text-zinc-500'}`} title="Settings">
                  <Settings className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                <Badge variant="success" className="text-[9px] tracking-widest">{profile?.plan_name || 'FREE'} {t.plan}</Badge>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50 dark:bg-zinc-950/50"><div className="max-w-6xl mx-auto">{activeTab === 'overview' && renderOverview()}{activeTab === 'tunnels' && renderTunnels()}{activeTab === 'custom_domain' && renderCustomDomains()}{activeTab === 'keys' && renderKeys()}{activeTab === 'billing' && renderBilling()}{activeTab === 'download' && renderDownload()}{activeTab === 'profile' && renderProfile()}{activeTab === 'settings' && renderSettings()}{activeTab === 'add-tunnel' && <AddTunnelWizard onComplete={() => { setActiveTab('tunnels'); fetchData(true); }} onCancel={() => setActiveTab('tunnels')} />}</div></div>
          </main>
        </>
      )}
      {showEditProfile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-8 shadow-2xl border-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">{t.editProfile}</h3>
              <button onClick={() => setShowEditProfile(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.fullName}</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.avatarUrl}</label>
                <input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://image.url/photo.jpg" className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setShowEditProfile(false)}>{t.cancel}</Button>
                <Button className="flex-[2] h-12 bg-indigo-600 text-white hover:bg-indigo-500 border-none shadow-lg shadow-indigo-500/20 font-black" onClick={updateProfile} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {t.saveChanges}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-8 shadow-2xl scale-in-center border-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">{t.generateKeyTitle}</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.keyLabel}</label>
                <input autoFocus placeholder="e.g. My Home Server" value={newKeyLabel} onChange={(e) => setNewKeyLabel(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.generatedKey}</label>
                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <code className="text-emerald-400 font-mono font-bold text-sm">{generatedKey}</code>
                  <button onClick={() => copyToClipboard(generatedKey, 'modal')} className="text-zinc-500 hover:text-emerald-400 transition-colors">{copied === 'modal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                <p className="text-[10px] leading-relaxed text-amber-600 dark:text-amber-400"><strong>{t.important}:</strong> {t.keyNote}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setShowKeyModal(false)}>{t.cancel}</Button>
                <Button className="flex-[2] h-12 bg-zinc-900 text-white dark:bg-white dark:text-black border-none shadow-lg font-black" onClick={createKey} disabled={!newKeyLabel}>{t.confirmSave}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {imageToCrop && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl border-none">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Adjust Your Avatar</h3>
              <button onClick={() => setImageToCrop(null)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="relative h-96 w-full bg-zinc-950">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-6 space-y-6 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setImageToCrop(null)}>{t.cancel}</Button>
                <Button 
                  className="flex-[2] h-12 bg-indigo-600 text-white hover:bg-indigo-500 border-none shadow-lg shadow-indigo-500/20 font-black" 
                  onClick={handleFinalCrop}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Save Avatar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {modal.onConfirm ? (<ConfirmDialog isOpen={modal.show} title={modal.title} message={modal.msg} onConfirm={modal.onConfirm} onClose={() => setModal({ ...modal, show: false, onConfirm: undefined })} />) : (<AlertDialog isOpen={modal.show} title={modal.title} message={modal.msg} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />)}
    </div>
  );
}
