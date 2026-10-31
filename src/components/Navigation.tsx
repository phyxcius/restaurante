import React from 'react';
import { Utensils, ChefHat, LayoutDashboard, Star, CalendarCheck, Receipt, Sun, Moon, Bell } from 'lucide-react';
import { ConfigRestaurante } from '../types';

export type AppView = 'menu' | 'kds' | 'admin' | 'club' | 'reservas' | 'factura';

interface NavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  config: ConfigRestaurante;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  activeOrdersCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  config,
  isLightTheme,
  onToggleTheme,
  activeOrdersCount,
}) => {
  const playBellSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Audio not permitted yet
    }
  };

  const navItems = [
    { id: 'menu' as AppView, label: 'Menú Digital', icon: Utensils, badge: null },
    { id: 'kds' as AppView, label: 'Cocina KDS', icon: ChefHat, badge: activeOrdersCount > 0 ? activeOrdersCount : null },
    { id: 'admin' as AppView, label: 'TPV & ERP', icon: LayoutDashboard, badge: null },
    { id: 'club' as AppView, label: 'Club Socios', icon: Star, badge: null },
    { id: 'reservas' as AppView, label: 'Reservas', icon: CalendarCheck, badge: null },
    { id: 'factura' as AppView, label: 'Ticket / Boleta', icon: Receipt, badge: null },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#071224]/95 backdrop-blur-md border-b border-amber-500/30 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('menu')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 border border-amber-400 overflow-hidden flex items-center justify-center text-lg shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0">
            {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
              <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{config.logo || '🍽️'}</span>
            )}
          </div>
          <div className="hidden xs:block sm:block">
            <h1 className="font-extrabold text-sm sm:text-base tracking-wide text-slate-100 uppercase leading-none font-latina-luxury">
              {config.nombre}
            </h1>
            <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase">
              {config.eslogan || 'Cusco • Gourmet'}
            </span>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                    : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-sky-400'}`} />
                <span className="hidden md:inline">{item.label}</span>
                {item.badge !== null && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-black animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={playBellSound}
            title="Probar Campana de Cocina"
            className="w-8 h-8 rounded-full bg-slate-900/80 border border-amber-400/50 text-amber-400 hover:text-amber-300 hover:border-amber-400 flex items-center justify-center transition-transform active:scale-90"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTheme}
            title={isLightTheme ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            className="w-8 h-8 rounded-full bg-slate-900/80 border border-sky-400/50 text-sky-400 hover:text-sky-300 flex items-center justify-center transition-transform active:scale-90"
          >
            {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
