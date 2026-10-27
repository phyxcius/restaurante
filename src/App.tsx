import React, { useState, useEffect } from 'react';
import { Navigation, AppView } from './components/Navigation';
import { MenuDigital } from './components/menu/MenuDigital';
import { CocinaKDS } from './components/kds/CocinaKDS';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ClubSocios } from './components/club/ClubSocios';
import { ReservasPublica } from './components/reservas/ReservasPublica';
import { FacturaTicket } from './components/factura/FacturaTicket';
import { storage } from './services/storage';
import { ConfigRestaurante } from './types';

export const App: React.FC = () => {
  const [config, setConfig] = useState<ConfigRestaurante>(storage.getConfig());
  const [isLightTheme, setIsLightTheme] = useState<boolean>(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(() => {
    return storage.getComandas().filter((c) => c.estado !== 'finalizado' && c.estado !== 'anulado').length;
  });

  // Determine initial view from URL params if present
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'kds' || viewParam === 'cocina') return 'kds';
    if (viewParam === 'admin') return 'admin';
    if (viewParam === 'club') return 'club';
    if (viewParam === 'reservas') return 'reservas';
    if (viewParam === 'factura') return 'factura';
    return 'menu';
  });

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setConfig(storage.getConfig());
      const count = storage
        .getComandas()
        .filter((c) => c.estado !== 'finalizado' && c.estado !== 'anulado').length;
      setActiveOrdersCount(count);
    });
    return unsub;
  }, []);

  const handleToggleTheme = () => {
    setIsLightTheme((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      return next;
    });
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050d1a] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Top Main Navigation */}
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
        config={config}
        isLightTheme={isLightTheme}
        onToggleTheme={handleToggleTheme}
        activeOrdersCount={activeOrdersCount}
      />

      {/* Main Dynamic View */}
      <main className="flex-1 w-full">
        {currentView === 'menu' && (
          <MenuDigital
            config={config}
            onNavigateToFactura={() => handleNavigate('factura')}
          />
        )}

        {currentView === 'kds' && <CocinaKDS />}

        {currentView === 'admin' && (
          <AdminDashboard
            config={config}
            onNavigateToFactura={() => handleNavigate('factura')}
          />
        )}

        {currentView === 'club' && <ClubSocios config={config} />}

        {currentView === 'reservas' && (
          <ReservasPublica
            config={config}
            onBackToMenu={() => handleNavigate('menu')}
          />
        )}

        {currentView === 'factura' && (
          <FacturaTicket
            config={config}
            onBack={() => handleNavigate('admin')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
