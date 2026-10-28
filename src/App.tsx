import React, { useState, useEffect } from 'react';
import { MenuDigital } from './components/menu/MenuDigital';
import { CocinaKDS } from './components/kds/CocinaKDS';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { storage } from './services/storage';
import { ConfigRestaurante } from './types';

export type StationType = 'menu' | 'cocina' | 'admin';

const getInitialStation = (): StationType => {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view')?.toLowerCase();

  if (viewParam === 'cocina' || viewParam === 'kds' || path.includes('cocina')) {
    return 'cocina';
  }
  if (viewParam === 'admin' || path.includes('admin')) {
    return 'admin';
  }
  return 'menu';
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050d1a] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#09152b] border border-amber-500/40 rounded-2xl p-6 shadow-2xl">
            <span className="text-4xl mb-3 block">🍽️</span>
            <h1 className="text-xl font-black text-amber-400 mb-2">La Cusqueñita Restaurante</h1>
            <p className="text-xs text-slate-300 mb-4">
              Se detectó un problema al inicializar la vista. Puedes reiniciar los datos locales de prueba para continuar.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-red-300 bg-black/50 p-2 rounded mb-4 overflow-x-auto text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
              >
                Restablecer Datos
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs"
              >
                Recargar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [config, setConfig] = useState<ConfigRestaurante>(storage.getConfig());
  const [station, setStation] = useState<StationType>(getInitialStation);

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setConfig(storage.getConfig());
    });
    return unsub;
  }, []);

  // Sync state if user clicks back/forward or navigates
  useEffect(() => {
    const handlePopState = () => {
      setStation(getInitialStation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchStation = (target: StationType) => {
    setStation(target);
    const newUrl = target === 'menu' ? './index.html' : target === 'cocina' ? './cocina.html' : './admin.html';
    window.history.pushState({}, '', newUrl);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050d1a] text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans">
        {/* 1. ESTACIÓN INDEPENDIENTE: MENÚ DIGITAL PARA EL MOZO / COMENSAL (index.html) */}
        {station === 'menu' && (
          <div className="w-full flex flex-col min-h-screen">
            <MenuDigital config={config} />
          </div>
        )}

      {/* 2. ESTACIÓN INDEPENDIENTE: COCINA KDS PARA EL COCINERO (cocina.html) */}
      {station === 'cocina' && (
        <div className="w-full min-h-screen flex flex-col">
          {/* Cabecera exclusiva de Cocina KDS */}
          <div className="w-full px-4 py-2.5 bg-gradient-to-r from-[#071224] via-[#09152b] to-[#071224] border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <b className="text-sm tracking-wide uppercase text-amber-400 font-extrabold flex items-center gap-2">
                <i className="fa-solid fa-fire-burner"></i> COCINA KDS • PANTALLA EN VIVO DEL COCINERO
              </b>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-300 font-bold">
                Estación Chef Autorizada
              </span>
            </div>
          </div>

          <div className="flex-1 w-full">
            <CocinaKDS />
          </div>
        </div>
      )}

      {/* 3. ESTACIÓN INDEPENDIENTE: PANEL DE CONTROL TPV & ERP (admin.html) */}
      {station === 'admin' && (
        <div className="w-full min-h-screen">
          <AdminDashboard config={config} />
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
