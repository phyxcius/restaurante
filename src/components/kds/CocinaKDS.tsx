import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Bell,
  Utensils,
  Receipt,
  Search,
  Filter,
} from 'lucide-react';
import { Comanda } from '../../types';
import { storage } from '../../services/storage';

export const CocinaKDS: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('auth_cocina') === 'true' || sessionStorage.getItem('auth_rest') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const [comandas, setComandas] = useState<Comanda[]>(storage.getComandas());
  const [statusFilter, setStatusFilter] = useState<'todas' | 'iniciado' | 'cocina' | 'servido'>('todas');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storage.validarClave('cocina', pinInput)) {
      sessionStorage.setItem('auth_cocina', 'true');
      setIsLoggedIn(true);
      setLoginError('');
      setPinInput('');
    } else {
      setLoginError('⛔ Clave de cocina incorrecta. Revisa con el Administrador.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auth_cocina');
    setIsLoggedIn(false);
  };

  // Clock tick every 10 seconds for real-time timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setComandas(storage.getComandas());
    });
    return unsub;
  }, []);

  const refreshOrders = () => {
    setComandas(storage.getComandas());
  };

  const playBellChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(784, audioCtx.currentTime); // G5
      osc.frequency.exponentialRampToValueAtTime(523.25, audioCtx.currentTime + 0.5); // C5
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Ignored
    }
  };

  // Status transitions
  const handleAvanzarEstado = (comandaId: string, siguienteEstado: Comanda['estado']) => {
    storage.updateComandaEstado(comandaId, siguienteEstado);
    playBellChime();
  };

  const handleAnular = (comandaId: string) => {
    if (confirm('¿Estás seguro de anular esta comanda de cocina?')) {
      storage.updateComandaEstado(comandaId, 'anulado');
    }
  };

  // Filter logic
  const filteredComandas = comandas.filter((c) => {
    if (c.estado === 'finalizado' || c.estado === 'anulado') return false;
    if (statusFilter !== 'todas' && c.estado !== statusFilter) return false;
    if (tableFilter !== 'all' && c.mesa.toLowerCase() !== tableFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMesa = c.mesa.toLowerCase().includes(q);
      const matchId = (c.numero || c.id).toLowerCase().includes(q);
      const matchPlatos = c.productos.toLowerCase().includes(q);
      const matchCliente = c.cliente.toLowerCase().includes(q);
      if (!matchMesa && !matchId && !matchPlatos && !matchCliente) return false;
    }
    return true;
  });

  const iniciadasCount = comandas.filter((c) => c.estado === 'iniciado').length;
  const cocinaCount = comandas.filter((c) => c.estado === 'cocina').length;
  const servidasCount = comandas.filter((c) => c.estado === 'servido').length;

  // Calculate elapsed minutes
  const getElapsedMinutes = (c: Comanda): number => {
    if (c.timestamp) {
      return Math.floor((currentTime.getTime() - c.timestamp) / (1000 * 60));
    }
    return 5;
  };

  const getTimerBadge = (minutes: number) => {
    if (minutes < 10) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 text-xs font-black flex items-center gap-1">
          <Clock className="w-3 h-3" /> {minutes} min (A tiempo)
        </span>
      );
    }
    if (minutes < 20) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 text-xs font-black flex items-center gap-1">
          <Clock className="w-3 h-3" /> {minutes} min (Atención)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500 text-xs font-black flex items-center gap-1 animate-pulse">
        <AlertTriangle className="w-3 h-3 text-red-400" /> {minutes} min (Demora urgente)
      </span>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#09152b] border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center text-3xl mb-4 shadow-lg">
            👨‍🍳
          </div>
          <h2 className="text-xl font-black text-amber-400 font-latina-luxury mb-1">
            Estación Cocina KDS
          </h2>
          <p className="text-xs text-slate-300 mb-5">
            Acceso restringido para el Jefe de Cocina y personal de despacho.
          </p>

          <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-3">
            <div className="text-left">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide block mb-1">
                Clave de Cocina:
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresa clave (ej. cocina123)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 text-sm font-black text-center tracking-widest outline-none focus:border-amber-400 transition-colors"
                autoFocus
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 bg-red-950/50 p-2 rounded-lg border border-red-500/40 font-semibold">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg active:scale-98 transition-all cursor-pointer mt-1"
            >
              <i className="fa-solid fa-unlock-keyhole mr-1.5"></i>
              Ingresar a Cocina
            </button>
          </form>

          <div className="mt-5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            <span className="text-amber-400 font-bold">Clave por defecto:</span> <code className="text-white">cocina123</code> (editable en Panel Admin).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4 text-slate-100">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border border-amber-400/40 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-600 border-2 border-amber-400 flex items-center justify-center text-white shadow-lg">
            <ChefHat className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black uppercase text-white tracking-wide font-latina-luxury flex items-center gap-2">
              Pantalla KDS Cocina en Vivo
            </h1>
            <p className="text-xs text-sky-300">
              Control de despachos, tiempos de cocción y comandas activas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Clock */}
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase leading-none">Hora Local</span>
            <span className="text-sm font-black text-amber-400">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            onClick={refreshOrders}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition-transform cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-950/80 hover:text-red-300 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bloquear pantalla de cocina"
          >
            <i className="fa-solid fa-lock text-xs"></i>
            <span>Bloquear</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => setStatusFilter('todas')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'todas'
              ? 'bg-blue-900/60 border-amber-400 shadow-md'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-slate-400">Total en Proceso</span>
          <p className="text-xl font-black text-white">{filteredComandas.length}</p>
        </div>

        <div
          onClick={() => setStatusFilter('iniciado')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'iniciado'
              ? 'bg-amber-900/40 border-amber-400 shadow-md'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-amber-300">🛎️ Recién Ingresadas</span>
          <p className="text-xl font-black text-amber-400">{iniciadasCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('cocina')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'cocina'
              ? 'bg-sky-900/40 border-sky-400 shadow-md'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-sky-300">🍳 En Preparación</span>
          <p className="text-xl font-black text-sky-400">{cocinaCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('servido')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'servido'
              ? 'bg-emerald-900/40 border-emerald-400 shadow-md'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-emerald-300">🍽️ Listas / Servidas</span>
          <p className="text-xl font-black text-emerald-400">{servidasCount}</p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por mesa, plato o comanda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Filtrar Mesa:</span>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-extrabold outline-none"
          >
            <option value="all">Todas las Mesas</option>
            {storage.getMesas().map((m) => (
              <option key={m.id} value={m.nombre}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders KDS Grid */}
      {filteredComandas.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-base font-black text-slate-200">Cocina al Día</h3>
          <p className="text-xs text-slate-400 mt-1">No hay comandas pendientes bajo los filtros actuales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComandas.map((cmd) => {
            const minutes = getElapsedMinutes(cmd);
            const isNuevo = cmd.estado === 'iniciado';
            const isCocina = cmd.estado === 'cocina';
            const isServido = cmd.estado === 'servido';

            return (
              <div
                key={cmd.id}
                className={`flex flex-col justify-between rounded-2xl border-2 overflow-hidden shadow-xl transition-all ${
                  isNuevo
                    ? 'bg-slate-900/95 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : isCocina
                    ? 'bg-slate-900/95 border-sky-500'
                    : 'bg-slate-900/95 border-emerald-500'
                }`}
              >
                {/* Card Header */}
                <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-amber-400 font-latina-luxury">
                        {cmd.mesa}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        #{cmd.numero || cmd.id}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-300 font-semibold block">
                      Cliente: {cmd.cliente} {cmd.mozo ? `• Mozo: ${cmd.mozo}` : ''}
                    </span>
                  </div>

                  <div>{getTimerBadge(minutes)}</div>
                </div>

                {/* Notifications badge if customer called waiter or asked bill */}
                {(cmd.pideCuenta || cmd.llamaMozo) && (
                  <div className="px-3 py-1.5 bg-purple-950/80 border-b border-purple-500/50 flex items-center justify-between text-xs font-black text-purple-200">
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-amber-300" />
                      {cmd.pideCuenta ? '¡Cliente Pidiendo Cuenta!' : '¡Cliente Llamó al Mozo!'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-600 text-[10px] font-black text-white">
                      SALÓN
                    </span>
                  </div>
                )}

                {/* Items List */}
                <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto max-h-56">
                  {cmd.items && cmd.items.length > 0 ? (
                    cmd.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col pb-2 border-b border-slate-800/80 last:border-none last:pb-0"
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-black text-white font-latina-luxury flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-blue-600/80 border border-sky-400 text-sky-200 text-xs flex items-center justify-center font-black">
                              {it.cantidad}
                            </span>
                            {it.nombre}
                          </span>
                        </div>
                        {it.notas && (
                          <span className="text-[11px] text-amber-300 font-bold italic ml-8 mt-0.5 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                            ⚠️ {it.notas}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-200 font-medium">{cmd.productos}</p>
                  )}

                  {cmd.notas && (
                    <div className="mt-2 p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] font-bold">
                      📌 Nota general: {cmd.notas}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleAnular(cmd.id)}
                    className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 font-bold text-xs"
                    title="Anular comanda"
                  >
                    ✕
                  </button>

                  {isNuevo && (
                    <button
                      onClick={() => handleAvanzarEstado(cmd.id, 'cocina')}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-transform cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Aceptar Pedido (En Preparación)</span>
                    </button>
                  )}

                  {isCocina && (
                    <button
                      onClick={() => handleAvanzarEstado(cmd.id, 'servido')}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-transform cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>¡Listo para Servir!</span>
                    </button>
                  )}

                  {isServido && (
                    <span className="flex-1 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Servido en Mesa
                    </span>
                  )}

                  {isServido && (
                    <button
                      onClick={() => handleAvanzarEstado(cmd.id, 'finalizado')}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-transform"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Despachado / Archivar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
