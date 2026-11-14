import React, { useState, useEffect, useRef } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Utensils,
  Volume2,
  VolumeX,
  RotateCw,
  LogOut,
  Users,
  Link2,
  Check,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import { Comanda, ConfigRestaurante, LlamadoMozo, MesaStatus } from '../../types';
import { storage } from '../../services/storage';
import { CHUSPA_TECH_LOGO } from '../../constants/chuspaLogo';

interface MozoPanelProps {
  config?: ConfigRestaurante;
  embedded?: boolean;
  onBackToAdmin?: () => void;
}

export const MozoPanel: React.FC<MozoPanelProps> = ({
  config: propConfig,
  embedded = false,
  onBackToAdmin,
}) => {
  const [config, setConfig] = useState<ConfigRestaurante>(propConfig || storage.getConfig());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (embedded) return true;
    return (
      sessionStorage.getItem('auth_mozo_active') === 'true' ||
      sessionStorage.getItem('auth_admin_active') === 'true'
    );
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const [llamados, setLlamados] = useState<LlamadoMozo[]>(() => storage.getLlamadosMozo());
  const [comandas, setComandas] = useState<Comanda[]>(() => storage.getComandas());
  const [mesas, setMesas] = useState<MesaStatus[]>(() => storage.getMesas());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [processingId, setProcessingId] = useState<string | null>(null);

  const prevPendingIdsRef = useRef<Set<string>>(
    new Set(storage.getLlamadosMozo().filter((l) => l.estado === 'pendiente').map((l) => l.id))
  );

  const playWaiterChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1174.66, now + 0.14);
      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.7);
    } catch {
      // Ignorar si navegador bloquea audio antes de interacción
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSync = () => {
      const nextLlamados = storage.getLlamadosMozo();
      const nextPendientes = nextLlamados.filter((l) => l.estado === 'pendiente');
      const hasNewCall = nextPendientes.some((l) => !prevPendingIdsRef.current.has(l.id));
      if (hasNewCall) {
        playWaiterChime();
      }
      prevPendingIdsRef.current = new Set(nextPendientes.map((l) => l.id));

      setLlamados(nextLlamados);
      setComandas(storage.getComandas());
      setMesas(storage.getMesas());
      setConfig(storage.getConfig());
    };

    const unsub = storage.subscribe(handleSync);
    return unsub;
  }, [soundEnabled]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (storage.validarClave('mozo', pinInput)) {
      sessionStorage.setItem('auth_mozo_active', 'true');
      setIsLoggedIn(true);
      setLoginError('');
      setPinInput('');
      playWaiterChime();
    } else {
      setLoginError('⛔ PIN incorrecto. Verifica la clave del rol Mozo en Gestión de Usuarios.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auth_mozo_active');
    setIsLoggedIn(false);
  };

  const handleAtender = async (id: string) => {
    setProcessingId(id);
    try {
      await storage.atenderLlamadoMozo(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyMozoUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=mozo`;
    try {
      navigator.clipboard?.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {}
  };

  const pendientes = llamados.filter((l) => l.estado === 'pendiente');
  const atendidos = llamados.filter((l) => l.estado === 'atendido').slice(0, 8);

  // Comandas listas para llevar a mesa (despachadas por cocina o activas)
  const listasCocina = comandas.filter(
    (c) =>
      c.estado !== 'finalizado' &&
      c.estado !== 'anulado' &&
      (c.despachadoCocina || c.estado === 'servido')
  );

  const activasSalon = comandas.filter(
    (c) => c.estado !== 'finalizado' && c.estado !== 'anulado'
  );

  const salonMesas = mesas.filter((m) => {
    const nom = m.nombre.toLowerCase();
    return (
      !nom.includes('delivery') &&
      !nom.includes('rappi') &&
      !nom.includes('pedidosya') &&
      !nom.includes('llevar') &&
      !nom.includes('takeaway')
    );
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050d1a] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#09152b] border-2 border-amber-400/50 rounded-3xl p-6 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-400 mx-auto mb-3 flex items-center justify-center overflow-hidden p-1">
            <img src={config.logo || CHUSPA_TECH_LOGO} alt={config.nombre} className="w-full h-full object-cover rounded-full" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full">
            Estación de Salón • {config.nombre}
          </span>
          <h1 className="text-xl font-black text-white mt-3">Panel de Control de Mozos</h1>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Recibe alertas en tiempo real cuando una mesa solicite atención o tenga platos listos en cocina.
          </p>

          <form onSubmit={handleLogin} className="space-y-3 text-left">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Clave / PIN de Mozo:
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setLoginError('');
                }}
                placeholder="Ingresa PIN (ej: mozo123)"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            {loginError && (
              <p className="text-xs font-bold text-red-400 bg-red-950/50 border border-red-500/40 rounded-xl px-3 py-2">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-sm shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              Ingresar al Panel de Mozos
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'w-full' : 'min-h-screen bg-[#050d1a]'} text-slate-100 flex flex-col`}>
      {/* Header */}
      <div className="w-full px-4 py-3 bg-gradient-to-r from-[#071224] via-[#0b1b36] to-[#071224] border-b border-amber-400/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center relative shrink-0">
            <BellRing className={`w-5 h-5 text-amber-300 ${pendientes.length > 0 ? 'animate-bounce' : ''}`} />
            {pendientes.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                {pendientes.length}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>PANEL DE CONTROL DE MOZOS</span>
              {pendientes.length > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                  {pendientes.length} LLAMADO(S) ACTIVO(S)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/30 border border-emerald-400/50 text-emerald-300 text-[10px] font-black">
                  EN LÍNEA
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400">
              {config.nombre} • Alertas en vivo de mesas, pedidos listos para servir y estado de salón
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMozoUrl}
            className="px-3 py-1.5 rounded-xl bg-sky-900/60 hover:bg-sky-800 border border-sky-400/50 text-sky-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Copiar enlace directo para el celular del mozo"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Enlace Copiado' : 'Enlace Celular Mozo'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playWaiterChime();
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Timbre Activo' : 'Silenciado'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLlamados(storage.getLlamadosMozo());
              setComandas(storage.getComandas());
              setMesas(storage.getMesas());
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>

          {embedded && onBackToAdmin ? (
            <button
              type="button"
              onClick={onBackToAdmin}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black cursor-pointer"
            >
              Volver a Salón
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-800 border border-red-500/50 text-red-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* 1. LLAMADOS PENDIENTES URGENTES */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <BellRing className="w-4 h-4 text-red-400" />
              Mesas Llamando al Mozo ({pendientes.length})
            </h2>
          </div>

          {pendientes.length === 0 ? (
            <div className="bg-[#09152b] border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
              No hay mesas llamando en este momento. Cuando un cliente presione el botón <b>Mozo</b> en su mesa, aparecerá aquí con alerta sonora.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendientes.map((llamado) => {
                const elapsedMin = Math.max(0, Math.floor((nowTick - llamado.timestamp) / 60000));
                return (
                  <div
                    key={llamado.id}
                    className="relative bg-gradient-to-br from-red-950/90 via-[#1b102c] to-[#09152b] border-2 border-amber-400 rounded-2xl p-4 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase animate-pulse mb-1.5">
                          🔔 Llamando ahora
                        </span>
                        <h3 className="text-xl font-black text-white">{llamado.mesa}</h3>
                        {llamado.cliente && (
                          <p className="text-xs text-sky-300 font-bold">👤 {llamado.cliente}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-300 block">{llamado.hora}</span>
                        <span className="text-[11px] text-red-300 font-bold flex items-center justify-end gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> hace {elapsedMin} min
                        </span>
                      </div>
                    </div>

                    <div className="bg-black/35 border border-amber-400/30 rounded-xl px-3 py-2 text-xs text-slate-200">
                      <b>Solicitud:</b> {llamado.motivo || 'Atención en mesa'}
                    </div>

                    <button
                      type="button"
                      disabled={processingId === llamado.id}
                      onClick={() => handleAtender(llamado.id)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {processingId === llamado.id ? 'Marcando...' : '✔ Atender / En Camino'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. PEDIDOS LISTOS EN COCINA PARA SERVIR */}
        <section>
          <h2 className="text-sm sm:text-base font-black text-sky-300 uppercase tracking-wider flex items-center gap-2 mb-3">
            <ChefHat className="w-4 h-4 text-emerald-400" />
            Pedidos Listos en Cocina para Llevar a Mesa ({listasCocina.length})
          </h2>

          {listasCocina.length === 0 ? (
            <div className="bg-[#09152b] border border-slate-800 rounded-2xl p-4 text-xs text-slate-400">
              No hay platos pendientes de entrega desde cocina en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {listasCocina.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#09152b] border border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between gap-2 shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white">{c.mesa}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black">
                      🍽️ Listo {c.horaDespachoCocina || c.hora}
                    </span>
                  </div>
                  <p className="text-xs text-sky-300 font-bold">👤 {c.cliente || 'Comensal'}</p>
                  <div className="bg-slate-950/80 rounded-xl p-2.5 text-xs text-slate-200 space-y-1">
                    {Array.isArray(c.items) && c.items.length > 0 ? (
                      c.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {it.cantidad}x {it.nombre}</span>
                        </div>
                      ))
                    ) : (
                      <span>{c.productos}</span>
                    )}
                  </div>
                  {c.notas && (
                    <p className="text-[11px] text-amber-300">📝 {c.notas}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. MAPA RÁPIDO DE MESAS DEL SALÓN */}
        <section>
          <h2 className="text-sm sm:text-base font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-amber-400" />
            Estado en Vivo del Salón ({salonMesas.length} mesas)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {salonMesas.map((m) => {
              const comandaMesa = activasSalon.find(
                (c) => c.mesa.toLowerCase() === m.nombre.toLowerCase()
              );
              const tieneLlamado = pendientes.some(
                (l) => l.mesa.toLowerCase() === m.nombre.toLowerCase()
              );
              const ocupada = m.estado === 'ocupada' || !!comandaMesa;

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl p-3 border transition-all ${
                    tieneLlamado
                      ? 'bg-red-950/80 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                      : ocupada
                      ? 'bg-blue-950/50 border-sky-500/40'
                      : 'bg-[#09152b] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-white">{m.nombre}</span>
                    <Utensils className={`w-3.5 h-3.5 ${tieneLlamado ? 'text-amber-300 animate-bounce' : ocupada ? 'text-sky-400' : 'text-emerald-400'}`} />
                  </div>
                  <div className="text-[11px] font-bold">
                    {tieneLlamado ? (
                      <span className="text-amber-300">🔔 Llamando al Mozo</span>
                    ) : ocupada ? (
                      <span className="text-sky-300">
                        Ocupada • S/ {(comandaMesa?.totalPEN || 0).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-emerald-400">✔ Disponible</span>
                    )}
                  </div>
                  {comandaMesa?.pideCuenta && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-purple-600 text-white text-[9px] font-black">
                      💳 Pide Cuenta
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. HISTORIAL RECIENTE ATENDIDO */}
        {atendidos.length > 0 && (
          <section className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              Últimos Llamados Atendidos
            </h3>
            <div className="flex flex-wrap gap-2">
              {atendidos.map((a) => (
                <span
                  key={a.id}
                  className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                >
                  ✔ <b>{a.mesa}</b> ({a.hora})
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
