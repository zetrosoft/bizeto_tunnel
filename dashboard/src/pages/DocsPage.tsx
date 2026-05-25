import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, ArrowLeft, Terminal, Globe, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '../components/ui/Shared';

export default function DocsPage() {
  const [activeTopic, setActiveTopic] = useState('install');

  const content = {
    install: {
      title: "Installation & Setup",
      body: (
        <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
          <p>Get started with Bizeto Tunnel™ Agent in seconds. Our agent is a single, lightweight binary with no dependencies.</p>
          <h4 className="font-bold text-zinc-900 dark:text-white mt-6">macOS / Linux</h4>
          <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm text-zinc-300">
            curl -sL https://get.bizeto.io | bash
          </div>
          <h4 className="font-bold text-zinc-900 dark:text-white mt-6">Windows</h4>
          <p>Download the latest `.exe` from your User Dashboard or our GitHub Releases page and place it in your PATH.</p>
        </div>
      )
    },
    http: {
      title: "Exposing Web Apps (HTTP)",
      body: (
        <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
          <p>The most common use case for Bizeto Tunnel™ is exposing a local web server (like Node.js, Python, or React) to the public internet.</p>
          <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm text-zinc-300 mt-4">
            bizeto-agent start --port 3000
          </div>
          <p className="mt-4">This will generate a random subdomain like <code>https://random-123.bizeto.io</code> that forwards all traffic securely to <code>localhost:3000</code>.</p>
          <h4 className="font-bold text-zinc-900 dark:text-white mt-6">Custom Domains</h4>
          <p>If you are on the Pro plan, you can specify your own domain:</p>
          <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm text-zinc-300 mt-4">
            bizeto-agent start --port 3000 --domain api.mycompany.com
          </div>
        </div>
      )
    },
    tcp: {
      title: "Raw TCP & Printers",
      body: (
        <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
          <p>Unlike standard reverse proxies, Bizeto Tunnel™ supports raw TCP tunneling. This is perfect for databases, SSH, or local IoT devices like Thermal Printers.</p>
          <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm text-zinc-300 mt-4">
            bizeto-agent start --port 9100 --type tcp
          </div>
          <p className="mt-4">The edge will assign a public TCP port, for example <code>tcp.bizeto.io:24510</code>. Any traffic sent to that port will be streamed directly to your local port 9100.</p>
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center px-8 sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="font-bold text-lg dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5" /> Bizeto Tunnel™ Documentation
          </div>
        </div>
        <Link to="/setup">
          <Button variant="outline" className="h-8 text-xs">Go to Dashboard</Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 p-8">
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Getting Started</div>
          <button onClick={() => setActiveTopic('install')} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTopic === 'install' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Terminal className="w-4 h-4 inline-block mr-2" /> Installation
          </button>
          
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-8 mb-4">Tunnel Types</div>
          <button onClick={() => setActiveTopic('http')} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTopic === 'http' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Globe className="w-4 h-4 inline-block mr-2" /> HTTP/Web Tunnels
          </button>
          <button onClick={() => setActiveTopic('tcp')} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTopic === 'tcp' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Printer className="w-4 h-4 inline-block mr-2" /> TCP & Printers
          </button>
        </aside>

        <section className="flex-1">
          <Card className="p-8">
            <h1 className="text-3xl font-extrabold dark:text-white mb-6">{content[activeTopic as keyof typeof content].title}</h1>
            {content[activeTopic as keyof typeof content].body}
          </Card>
        </section>
      </main>
    </div>
  );
}
