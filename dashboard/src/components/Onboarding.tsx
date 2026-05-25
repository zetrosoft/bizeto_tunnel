import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge } from './ui/Shared';
import { 
  Download, 
  Key, 
  Globe, 
  Terminal, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Play
} from 'lucide-react';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [activeStep, setActiveTab] = useState(1);

  const steps = [
    {
      id: 1,
      title: "1. Download Bizeto Tunnel™ Agent",
      desc: "Unduh biner agent yang sesuai dengan sistem operasi Anda (Linux/Windows/Mac). Agent ini bertugas membangun jembatan aman dari lokal ke Relay kami.",
      icon: Download,
      action: (
        <div className="flex gap-2 mt-4">
           <Button variant="outline" className="text-[10px] h-8" onClick={() => window.open('http://localhost:6500/downloads/bizeto-agent-linux-amd64')}>Linux</Button>
           <Button variant="outline" className="text-[10px] h-8" onClick={() => window.open('http://localhost:6500/downloads/bizeto-agent-darwin-arm64')}>MacOS (M1/M2)</Button>
           <Button variant="outline" className="text-[10px] h-8" onClick={() => window.open('http://localhost:6500/downloads/bizeto-agent-windows-amd64.exe')}>Windows</Button>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Buat API Key (Identitas)",
      desc: "Setiap Agent membutuhkan identitas unik. API Key berfungsi sebagai sertifikat keamanan agar server kami mengenali perangkat Anda.",
      icon: Key,
      action: <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest">Akses menu 'API Keys' setelah onboarding.</p>
    },
    {
      id: 3,
      title: "3. Daftarkan Public Tunnel",
      desc: "Tentukan port lokal mana yang ingin Anda ekspos (misal: 8080). Kami akan memberikan domain aman 'https' secara otomatis.",
      icon: Globe,
      action: <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest">Gunakan tombol '+ Add Tunnel' di menu Tunnels.</p>
    },
    {
      id: 4,
      title: "4. Jalankan & Online!",
      desc: "Salin file konfigurasi 'bizeto.json' ke folder agent Anda, lalu jalankan perintah terminal. Aplikasi Anda langsung online!",
      icon: Zap,
      action: <div className="bg-zinc-950 p-3 rounded-lg mt-4 font-mono text-[10px] text-emerald-400">./bizeto-agent --config bizeto.json</div>
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12 flex flex-col items-center">
        <Badge variant="success" className="mb-8 tracking-widest px-4 py-1">ONBOARDING GUIDE</Badge>
        <img src="/brand/logo-stacked.png" alt="Bizeto Tunnel™" className="h-48 w-auto mb-6 shadow-2xl rounded-3xl" />
        <h1 className="text-2xl font-black dark:text-white tracking-tighter mb-2">Selamat Datang, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="text-zinc-500 max-w-xl mx-auto leading-relaxed">Ikuti 4 langkah sederhana ini untuk menghubungkan aplikasi lokal Anda ke seluruh dunia dengan enkripsi tingkat perusahaan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {steps.map((s) => (
          <button 
            key={s.id} 
            onClick={() => setActiveTab(s.id)}
            className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeStep === s.id 
                ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xl scale-105 z-10' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-colors ${
              activeStep === s.id ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
            }`}>
              <s.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm leading-tight mb-2">{s.title}</h3>
            {activeStep === s.id && <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full animate-in slide-in-from-left duration-500"></div>}
          </button>
        ))}
      </div>

      <Card className="p-10 mb-12 border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden relative">
         <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1 space-y-6">
               <h2 className="text-3xl font-black dark:text-white leading-none">{steps[activeStep-1].title}</h2>
               <p className="text-zinc-500 leading-relaxed text-lg">{steps[activeStep-1].desc}</p>
               {steps[activeStep-1].action}
               <div className="pt-6 flex items-center gap-4">
                  {activeStep < 4 ? (
                    <Button onClick={() => setActiveTab(activeStep + 1)} className="h-12 px-8">Langkah Selanjutnya <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  ) : (
                    <Button onClick={onComplete} className="h-12 px-8 bg-emerald-600 text-white hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/20">Mulai Gunakan Bizeto Tunnel™ <Play className="ml-2 w-4 h-4" /></Button>
                  )}
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Step {activeStep} of 4</span>
               </div>
            </div>
            <div className="hidden md:block w-64 h-64 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center relative">
               <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full"></div>
               {activeStep === 1 && <Download className="w-20 h-20 text-emerald-500 relative z-10" />}
               {activeStep === 2 && <Key className="w-20 h-20 text-blue-500 relative z-10" />}
               {activeStep === 3 && <Globe className="w-20 h-20 text-amber-500 relative z-10" />}
               {activeStep === 4 && <Zap className="w-20 h-20 text-purple-500 relative z-10" />}
            </div>
         </div>
      </Card>

      <div className="flex items-center justify-center gap-10 opacity-40 grayscale group-hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-2 font-bold text-xs"><ShieldCheck className="w-4 h-4" /> End-to-End Encrypted</div>
         <div className="flex items-center gap-2 font-bold text-xs"><Terminal className="w-4 h-4" /> Zero-Trust Network</div>
         <div className="flex items-center gap-2 font-bold text-xs"><Zap className="w-4 h-4" /> Real-time Yamux Multi-plexing</div>
      </div>
    </div>
  );
}
