import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge, AlertDialog } from '../components/ui/Shared';
import { 
  CheckCircle2, 
  ArrowRight, 
  DoorOpen, 
  Fingerprint, 
  FileJson, 
  Download,
  Terminal,
  Loader2,
  Copy,
  Check,
  WifiOff,
  Wifi
} from 'lucide-react';

import { API_BASE_URL, BASE_DOMAIN } from '../config';

interface AddTunnelWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

const copy: Record<string, any> = {
  en: {
    title: "Add New Tunnel",
    subtitle: "Complete configuration to reserve your public address.",
    step1Title: "Step 1: Local Port",
    step1Sub: "Your local application port (e.g., 80, 8080, 3000).",
    registering: "Registering...",
    registerBtn: "Register Tunnel",
    step2Title: "Step 2: API Key Created",
    step2Sub: "Your address has been reserved:",
    step3Title: "Step 3: Download Config",
    step3Sub: "Download bizeto.json and place it in the same folder as the Agent.",
    downloadBtn: "Download bizeto.json",
    step4Title: "Step 4: Run Agent",
    step4Sub: "Run this command in your terminal to start the tunnel.",
    checkConn: "Check Connection Status",
    step5Title: "Step 5: Done!",
    waiting: "Waiting for Connection...",
    waitingSub: "Please run the Agent in your terminal. This tunnel is registered and ready to receive data.",
    connected: "Agent Online!",
    connectedSub: "Secure tunnel successfully established.",
    dashboardBtn: "Done & Open Dashboard",
    cancel: "Cancel",
    next: "Next",
    prev: "Back",
    copyCommand: "Copy Command Again",
    finishLater: "Finish Later",
    publicAddress: "Public Address",
  },
  id: {
    title: "Tambah Tunnel Baru",
    subtitle: "Lengkapi konfigurasi untuk reservasi alamat publik Anda.",
    step1Title: "Langkah 1: Port Lokal",
    step1Sub: "Port aplikasi lokal Anda (misal: 80, 8080, 3000).",
    registering: "Mendaftarkan...",
    registerBtn: "Daftarkan Tunnel",
    step2Title: "Langkah 2: API Key Berhasil Dibuat",
    step2Sub: "Alamat Anda telah direservasi:",
    step3Title: "Langkah 3: Unduh Konfigurasi",
    step3Sub: "Unduh file bizeto.json dan letakkan di folder yang sama dengan Agent.",
    downloadBtn: "Unduh bizeto.json",
    step4Title: "Langkah 4: Jalankan Agent",
    step4Sub: "Jalankan perintah ini di terminal untuk memulai tunnel.",
    checkConn: "Cek Status Koneksi",
    step5Title: "Langkah 5: Selesai!",
    waiting: "Menunggu Koneksi...",
    waitingSub: "Silakan jalankan Agent di terminal Anda. Tunnel ini sudah terdaftar dan siap menerima data.",
    connected: "Agen Online!",
    connectedSub: "Terowongan aman berhasil dibangun.",
    dashboardBtn: "Selesai & Buka Dashboard",
    cancel: "Batal",
    next: "Lanjut",
    prev: "Kembali",
    copyCommand: "Salin Perintah Lagi",
    finishLater: "Selesaikan Nanti",
    publicAddress: "Alamat Publik",
  }
};

export default function AddTunnelWizard({ onComplete, onCancel }: AddTunnelWizardProps) {
  const { user, token } = useAuth();
  const [lang] = useState<'id' | 'en'>((localStorage.getItem('lang') as 'id' | 'en') || 'en');
  const t = copy[lang];
  const [step, setStep] = useState(1);
  const [localPort, setLocalPort] = useState(8080);
  const [apiKey] = useState("BZT-" + Math.random().toString(36).substring(2, 15).toUpperCase());
  const [domain] = useState((user?.email?.split('@')[0] || 'user') + "-" + Math.random().toString(36).substring(2, 5) + "." + BASE_DOMAIN);
  const [isConnected, setIsConnected] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedInDB, setIsSavedInDB] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorModal, setErrorModal] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

  const fetchWithAuth = (url: string, options: any = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  // 1. Fungsi Simpan ke DB (Dipanggil sebelum masuk step instruksi)
  const saveToDB = async () => {
    if (isSavedInDB) return true;
    if (!user || !token) {
      setErrorModal({ show: true, msg: "Sesi tidak valid. Silakan login ulang." });
      return false;
    }

    setIsSaving(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/wizard/save`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          api_key: apiKey,
          domain: domain,
          port: localPort
        })
      });

      if (res.ok) {
        setIsSavedInDB(true);
        setIsSaving(false);
        return true;
      } else {
        const errText = await res.text();
        console.error("Save error response:", errText);
        setErrorModal({ show: true, msg: `Gagal mendaftarkan tunnel: ${errText}` });
      }
    } catch (e) {
      console.error("Network error during save:", e);
      setErrorModal({ show: true, msg: "Gagal menghubungi server. Pastikan Relay aktif dan CORS diizinkan." });
    } finally {
      setIsSaving(false);
    }
    return false;
  };

  // 2. Polling Status Agent (Hanya di Step 5)
  useEffect(() => {
    let pollInterval: any;
    if (step === 5 && !isConnected && token) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/tunnels/check-status?domain=${domain}`);
          if (res.ok) {
            const data = await res.json();
            if (data.online) {
              setIsConnected(true);
              clearInterval(pollInterval);
            }
          }
        } catch (e) {}
      }, 2000);
    }
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [step, isConnected, domain, token]);

  const downloadConfigFile = () => {
    const config = { api_key: apiKey, local_port: localPort, relay_addr: window.location.hostname + ":4321" };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bizeto.json';
    a.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <DoorOpen className="w-8 h-8" />
              <h3 className="text-xl font-bold">{t.step1Title}</h3>
            </div>
            <p className="text-sm text-zinc-500">{t.step1Sub}</p>
            <input 
              type="number" 
              value={localPort} 
              onChange={(e) => setLocalPort(parseInt(e.target.value))}
              className="w-full h-12 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xl"
            />
            <Button 
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-none" 
              onClick={async () => { 
                const success = await saveToDB();
                if(success) setStep(2); 
              }}
              disabled={isSaving || !user}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isSaving ? t.registering : t.registerBtn} 
              {!isSaving && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Fingerprint className="w-8 h-8" />
              <h3 className="text-xl font-bold">{t.step2Title}</h3>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <code className="text-emerald-400 font-mono">{apiKey}</code>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-xs text-zinc-500 italic">{t.step2Sub} <strong>{domain}</strong></p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>{t.prev}</Button>
              <Button className="flex-[2]" onClick={() => setStep(3)}>{t.next}</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center">
            <FileJson className="w-12 h-12 mx-auto text-amber-500" />
            <h3 className="text-xl font-bold">{t.step3Title}</h3>
            <p className="text-sm text-zinc-500 px-4">{t.step3Sub}</p>
            <Button variant="secondary" className="w-full h-16 border-2 border-dashed border-amber-300 dark:border-zinc-700 bg-amber-50 dark:bg-amber-950/20" onClick={downloadConfigFile}>
               <Download className="w-5 h-5 mr-2" /> {t.downloadBtn}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>{t.prev}</Button>
              <Button className="flex-[2]" onClick={() => setStep(4)}>{t.next}</Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white"><Terminal className="w-5 h-5 text-purple-500" /> {t.step4Title}</h3>
            <p className="text-sm text-zinc-500">{t.step4Sub}</p>
            <div 
              className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex items-center justify-between group cursor-pointer hover:border-purple-500/50 transition-all"
              onClick={() => copyToClipboard("./bizeto-agent --config bizeto.json")}
            >
              <code className="text-purple-400 font-mono text-xs">./bizeto-agent --config bizeto.json</code>
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-600" />}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>{t.prev}</Button>
              <Button className="flex-[2] bg-indigo-600 text-white hover:bg-indigo-700 border-none" onClick={() => setStep(5)}>{t.checkConn}</Button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 text-center py-6 animate-in zoom-in-95">
            {!isConnected ? (
              <div className="space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                   <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-ping opacity-20"></div>
                   <div className="relative w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                      <WifiOff className="w-10 h-10 text-zinc-400" />
                   </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold dark:text-white">{t.waiting}</h3>
                  <p className="text-sm text-zinc-500 max-w-xs mx-auto">{t.waitingSub}</p>
                </div>
                <div className="flex gap-3">
                   <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>{t.copyCommand}</Button>
                   <Button className="flex-1" onClick={onComplete}>{t.finishLater}</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-lg shadow-emerald-500/10">
                   <Wifi className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <h3 className="text-2xl font-black dark:text-white tracking-tight">{t.connected}</h3>
                  <p className="text-sm text-zinc-500">{t.connectedSub}</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900 flex flex-col items-center gap-1">
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t.publicAddress}</span>
                   <a href={`https://${domain}`} target="_blank" rel="noreferrer" className="font-bold text-emerald-700 dark:text-emerald-300 underline underline-offset-4">
                    https://{domain}
                   </a>
                </div>
                <Button className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/20" onClick={onComplete}>{t.dashboardBtn}</Button>
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-xs text-zinc-500 font-medium">{t.subtitle}</p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">{t.cancel}</Button>
      </div>
      <Card className="p-8 shadow-2xl relative overflow-hidden border-none bg-white dark:bg-zinc-900">
        <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(step / 5) * 100}%` }}></div>
        {renderStep()}
      </Card>
      
      <p className="mt-8 text-center text-zinc-400 text-[10px] uppercase font-bold tracking-widest opacity-50">
        Secure Yamux Multiplexing &bull; TLS 1.3 Encryption &bull; Singapore Relay
      </p>

      <AlertDialog 
        isOpen={errorModal.show} 
        title="Connection Error" 
        message={errorModal.msg} 
        onClose={() => setErrorModal({ show: false, msg: '' })} 
      />
    </div>
  );
}
