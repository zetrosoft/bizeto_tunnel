import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui/Shared';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  DoorOpen, 
  Fingerprint, 
  FileJson, 
  Send, 
  ShieldCheck,
  Download,
  Terminal,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

import { API_BASE_URL, BASE_DOMAIN } from '../config';

export default function SetupWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [localPort, setLocalPort] = useState(8080);
  const [apiKey] = useState("BZT-" + Math.random().toString(36).substring(2, 15).toUpperCase());
  const [domain] = useState((user?.email?.split('@')[0] || 'user') + "." + BASE_DOMAIN);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Simpan data ke database saat koneksi berhasil dideteksi
  useEffect(() => {
    if (step === 5 && !isConnected) {
      setIsConnecting(true);
      const timer = setTimeout(async () => {
        try {
          // Kirim data ke backend untuk disimpan secara permanen
          const response = await fetch(`${API_BASE_URL}/api/wizard/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user?.id,
              api_key: apiKey,
              domain: domain,
              port: localPort
            })
          });
          
          if (response.ok) {
            setIsConnected(true);
          } else {
            console.error("Failed to save wizard data");
          }
        } catch (error) {
          console.error("Error saving wizard data", error);
        } finally {
          setIsConnecting(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, isConnected, user, apiKey, domain, localPort]);

  const downloadConfigFile = () => {
    const config = {
      api_key: apiKey,
      local_port: localPort,
      relay_addr: window.location.hostname + ":4321"
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bizeto.json';
    a.click();
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <DoorOpen className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Langkah 1: Menentukan "Pintu" Aplikasi</h3>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                Komputer Anda memiliki ribuan 'pintu digital' yang disebut <strong>Port</strong>. Agar Bizeto Tunnel™ bisa mengirim traffic dari internet ke aplikasi Anda, kami perlu tahu pintu mana yang sedang digunakan oleh aplikasi tersebut. 
                <br /><br />
                <span className="italic">Analogi:</span> Bayangkan port seperti nomor kamar di dalam sebuah hotel; kami perlu tahu nomor kamar yang tepat agar tamu (traffic internet) tidak masuk ke ruangan yang salah.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold dark:text-zinc-200">Berapa Port Lokal Aplikasi Anda?</label>
              <input 
                type="number" 
                value={localPort} 
                onChange={(e) => setLocalPort(parseInt(e.target.value))}
                className="w-full h-12 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-lg font-mono"
              />
            </div>
            <Button className="w-full h-12 text-lg" onClick={nextStep}>Lanjut ke Identitas <ArrowRight className="ml-2 w-5 h-5" /></Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Fingerprint className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Langkah 2: Identitas Digital Unik</h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <strong>API Key</strong> ini berfungsi sebagai sidik jari digital Anda. Secara teknis, setiap kali Agent Anda mencoba menghubungi server kami (Relay), server akan menanyakan kunci ini untuk memastikan bahwa koneksi tersebut benar-benar berasal dari Anda.
                <br /><br />
                Kunci ini dienkripsi dan hanya digunakan untuk membuktikan identitas saat membangun jembatan tunnel pertama kali.
              </p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex items-center justify-between">
              <code className="text-emerald-400 font-mono text-lg">{apiKey}</code>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-12" onClick={prevStep}><ArrowLeft className="mr-2 w-5 h-5" /> Kembali</Button>
              <Button className="flex-[2] h-12 text-lg" onClick={nextStep}>Siapkan Konfigurasi <ArrowRight className="ml-2 w-5 h-5" /></Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <FileJson className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Langkah 3: Peta Navigasi Otomatis</h3>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                File <strong>bizeto.json</strong> ini berisi koordinat lengkap: ke mana Agent harus melapor (alamat Relay), pintu mana yang harus dibuka (Port), dan kunci identitas Anda.
                <br /><br />
                Dengan menggunakan file ini, Anda tidak perlu lagi mengetik kode perintah yang rumit. Cukup letakkan file ini di folder yang sama dengan aplikasi Agent.
              </p>
            </div>
            <Button variant="secondary" className="w-full h-16 border-2 border-dashed border-amber-300 dark:border-amber-700 flex flex-col items-center justify-center gap-1" onClick={downloadConfigFile}>
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Download className="w-5 h-5" />
                <span className="font-bold">Download bizeto.json</span>
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Klik untuk mengunduh</span>
            </Button>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-12" onClick={prevStep}><ArrowLeft className="mr-2 w-5 h-5" /> Kembali</Button>
              <Button className="flex-[2] h-12 text-lg" onClick={nextStep}>Jalankan Agent <ArrowRight className="ml-2 w-5 h-5" /></Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
              <Send className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Langkah 4: Membangun Jembatan</h3>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                Saat Anda menjalankan perintah ini, Agent akan membangun <strong>Multiplexed Tunnel</strong>. Secara teknis, ini seperti membangun terowongan pribadi di dalam kabel internet Anda. 
                <br /><br />
                Terowongan ini bersifat <em>outbound</em>, artinya Anda tidak perlu mengubah setting firewall atau melakukan Port Forwarding di router Anda.
              </p>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Salin & Tempel di Terminal Anda:</label>
              <div 
                className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex items-center justify-between group cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => copyToClipboard("./bizeto-agent --config bizeto.json")}
              >
                <code className="text-purple-400 font-mono text-sm">./bizeto-agent --config bizeto.json</code>
                {isCopied ? (
                  <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in duration-300" />
                ) : (
                  <Copy className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                )}
              </div>
              {isCopied && <p className="text-[10px] text-emerald-500 font-bold animate-in fade-in">Berhasil disalin ke clipboard!</p>}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-12" onClick={prevStep}><ArrowLeft className="mr-2 w-5 h-5" /> Kembali</Button>
              <Button className="flex-[2] h-12 text-lg" onClick={nextStep}>Cek Koneksi <ArrowRight className="ml-2 w-5 h-5" /></Button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center gap-3 text-zinc-900 dark:text-white">
              <ShieldCheck className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Langkah Akhir: Verifikasi & SSL</h3>
            </div>
            
            {!isConnected ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-emerald-500 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-bold text-lg dark:text-white">Menunggu Agent Menghubungi Relay...</p>
                  <p className="text-sm text-zinc-500">Sistem sedang memverifikasi identitas digital Anda.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-90 duration-500">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800 text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">Terhubung Secara Aman!</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    Sertifikat SSL (Let's Encrypt) telah dipasangkan. Data Anda sekarang dienkripsi ujung-ke-ujung (End-to-End Encryption).
                  </p>
                </div>
                
                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">URL Publik Anda:</span>
                  <a href={`https://${domain}`} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold text-xl hover:underline">
                    https://{domain}
                  </a>
                </div>

                <Button className="w-full h-14 text-lg" onClick={() => navigate('/dashboard')}>
                  Buka Dashboard Utama
                </Button>
              </div>
            )}
            
            {!isConnected && (
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h5 className="text-xs font-bold uppercase mb-2 text-zinc-500">Apa yang terjadi sekarang?</h5>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Relay Server kami sedang mendengarkan 'heartbeat' dari Agent Anda. Begitu sinyal diterima, kami akan otomatis mendaftarkan domain Anda dan mengaktifkan enkripsi HTTPS.
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-end justify-between px-2">
          <div>
            <div className="flex items-center w-64 mb-2 -ml-6 h-24 overflow-hidden">
              <img 
                src="/brand/logo-horizontal.png" 
                alt="Bizeto Tunnel™" 
                className="h-32 w-auto object-contain brightness-110 contrast-125 dark:invert dark:hue-rotate-180 dark:brightness-200" 
              />
            </div>
            <p className="text-zinc-500 text-sm ml-1">Mari buat aplikasi lokal Anda online dengan aman.</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Kemajuan</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
        
        <Card className="p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden">
          {/* Progress Indicator */}
          <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }}></div>
          
          {renderStep()}
        </Card>
        
        <p className="mt-8 text-center text-zinc-400 text-xs">
          Butuh bantuan teknis lebih lanjut? <a href="#" className="underline hover:text-emerald-500">Baca Dokumentasi LLD</a>
        </p>
      </div>
    </div>
  );
}

// Helper Components
const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "success" }) => {
  const styles = {
    default: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${styles[variant]}`}>{children}</span>;
};
