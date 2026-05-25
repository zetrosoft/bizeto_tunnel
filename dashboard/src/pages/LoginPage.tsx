import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui/Shared';
import { Server, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const copy: Record<string, any> = {
  en: {
    securing: "Securing session...",
    title: "Secure Access",
    subtitle: "Use your Google account to access your tunnel dashboard.",
    googleBtn: "Continue with Google",
    terms: "By signing in, you agree to our Terms of Service and Privacy Policy.",
    mockTitle: "Developer Sandbox",
    mockSub: "Bypass Google Auth for testing purposes.",
  },
  id: {
    securing: "Mengamankan sesi...",
    title: "Akses Aman",
    subtitle: "Gunakan akun Google untuk mengakses dashboard tunnel Anda.",
    googleBtn: "Lanjutkan dengan Google",
    terms: "Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.",
    mockTitle: "Sandbox Developer",
    mockSub: "Lewati Autentikasi Google untuk keperluan pengujian.",
  }
};

export default function LoginPage() {
  const { login, user } = useAuth();
  const [lang] = React.useState<'id' | 'en'>((localStorage.getItem('lang') as 'id' | 'en') || 'en');
  const t = copy[lang];
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authDataRaw = params.get('auth_data');
    const error = params.get('error');

    if (error) {
      setErrorMsg(`Authentication failed: ${error.replace(/_/g, ' ')}`);
    }

    if (authDataRaw && !isProcessing) {
      setIsProcessing(true);
      try {
        const authData = JSON.parse(decodeURIComponent(authDataRaw));
        // Proses login asinkron
        login(authData.user, authData.token).then(() => {
           // Gunakan hard redirect untuk memastikan state sinkron sempurna
           window.location.href = '/dashboard';
        });
      } catch (e) {
        console.error("Failed to parse auth data", e);
        setErrorMsg("Failed to process login data.");
        setIsProcessing(false);
      }
    }
  }, [location, login, isProcessing]);

  useEffect(() => {
    if (user && !location.search.includes('auth_data')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  };

  const handleMockLogin = async (role: 'USER' | 'OWNER') => {
    setIsProcessing(true);
    const mockUser = {
      id: role === 'OWNER' ? '00000000-0000-0000-0000-000000000000' : '7b3e6462-8e1e-451e-9d33-4050d2766324',
      email: role === 'OWNER' ? 'admin@bizeto.io' : 'dev@bizeto.io',
      full_name: role === 'OWNER' ? 'System Administrator' : 'Developer Bizeto Tunnel™',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bizeto',
      role: role,
      plan_name: role === 'OWNER' ? 'ENTERPRISE' : 'PRO'
    };
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy";
    await login(mockUser, mockToken);
    navigate('/dashboard');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-zinc-500 font-medium">Securing session...</p>
      </div>
    );
  }

  const isMockMode = new URLSearchParams(location.search).get('mock') === 'true';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[180px] mb-8">
        <img 
          src="/brand/logo-only.png" 
          alt="Bizeto Tunnel™" 
          className="w-full h-auto drop-shadow-[0_0_30px_rgba(16,185,129,0.4)] brightness-110 contrast-125 dark:invert dark:hue-rotate-180 dark:brightness-200" 
        />
      </div>

      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold dark:text-white">Secure Access</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Use your Google account to access your tunnel dashboard.
          </p>
        </div>

        <Button 
          className="w-full h-12 flex items-center justify-center gap-3" 
          variant="outline"
          onClick={handleGoogleLogin}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          <span className="font-medium">Sign in with Google</span>
        </Button>

        {isMockMode && (
          <div className="pt-4 space-y-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-4">
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Documentation Mock Access</p>
             <div className="flex gap-2">
                <Button className="flex-1 h-9 text-xs" variant="secondary" onClick={() => handleMockLogin('USER')}>Login as User</Button>
                <Button className="flex-1 h-9 text-xs" variant="secondary" onClick={() => handleMockLogin('OWNER')}>Login as Owner</Button>
             </div>
          </div>
        )}

        <div className="pt-4 text-xs text-zinc-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </div>
      </Card>
    </div>
  );
}
