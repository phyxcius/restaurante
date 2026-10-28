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

  return (
    <div className="min-h-screen bg-[#050d1a] text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* 1. ESTACIÓN INDEPENDIENTE: MENÚ DIGITAL PARA EL MOZO / COMENSAL (index.html) */}
      {station === 'menu' && (
        <div className="w-full flex flex-col min-h-screen">
          <MenuDigital config={config} />

          {/* Barra discreta inferior para el personal de servicio */}
          <footer className="w-full max-w-lg mx-auto py-3 px-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 bg-[#071224]/80">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Terminal Mozo & Comensal
            </span>
            <div className="flex items-center gap-3">
              <a
                href="/cocina.html"
                className="hover:text-amber-400 transition-colors flex items-center gap-1 font-semibold"
              >
                <i className="fa-solid fa-fire-burner text-orange-400"></i> Cocina KDS
              </a>
              <span className="text-slate-600">|</span>
              <a
                href="/admin.html"
                className="hover:text-sky-400 transition-colors flex items-center gap-1 font-semibold"
              >
                <i className="fa-solid fa-gauge-high text-blue-400"></i> Panel Admin
              </a>
            </div>
          </footer>
        </div>
      )}

      {/* 2. ESTACIÓN INDEPENDIENTE: COCINA KDS PARA EL COCINERO (cocina.html) */}
      {station === 'cocina' && (
        <div className="w-full min-h-screen flex flex-col">
          {/* Cabecera exclusiva de Cocina KDS */}
          <div className="w-full px-4 py-2 bg-gradient-to-r from-[#071224] via-[#09152b] to-[#071224] border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <b className="text-sm tracking-wide uppercase text-amber-400 font-extrabold flex items-center gap-2">
                <i className="fa-solid fa-fire-burner"></i> COCINA KDS • PANTALLA EN VIVO DEL COCINERO
              </b>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <a
                href="/index.html"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1 transition-all"
              >
                <i className="fa-solid fa-mobile-screen"></i> Menú Mozo
              </a>
              <a
                href="/admin.html"
                className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-sky-200 border border-sky-400/30 font-bold flex items-center gap-1 transition-all"
              >
                <i className="fa-solid fa-gauge-high"></i> Panel Admin
              </a>
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
  );
};

export default App;
