import React, { useState } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Star, Gift, Check, Search, UserPlus, QrCode, Sparkles } from 'lucide-react';
import { Socio, ConfigRestaurante } from '../../types';
import { storage } from '../../services/storage';

interface ClubSociosProps {
  config: ConfigRestaurante;
}

export const ClubSocios: React.FC<ClubSociosProps> = ({ config }) => {
  const [dniSearch, setDniSearch] = useState<string>('');
  const [currentSocio, setCurrentSocio] = useState<Socio | null>(() => {
    return storage.getSocios()[0] || null;
  });
  const [searchError, setSearchError] = useState<string | null>(null);

  // New registration modal
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [regDni, setRegDni] = useState<string>('');
  const [regNombre, setRegNombre] = useState<string>('');
  const [regTelefono, setRegTelefono] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');

  // QR Modal
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const clean = dniSearch.trim();
    if (clean.length !== 8) {
      setSearchError('Ingresa un DNI de 8 dígitos para consultar.');
      return;
    }
    const found = storage.getSocioByDni(clean);
    if (found) {
      setCurrentSocio(found);
      setSearchError(null);
    } else {
      setSearchError('No se encontró socio registrado con este DNI. Puedes registrarte gratis a continuación.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regDni.trim().length !== 8) {
      alert('El DNI debe tener 8 dígitos.');
      return;
    }
    const nuevo: Socio = {
      dni: regDni.trim(),
      nombre: regNombre.trim(),
      telefono: regTelefono.trim(),
      email: regEmail.trim(),
      sellos: 1, // Welcome stamp!
      totalVisitas: 1,
      fechaRegistro: new Date().toISOString().slice(0, 10),
    };
    storage.saveSocio(nuevo);
    setCurrentSocio(nuevo);
    setIsRegisterOpen(false);

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch {
      // Ignored
    }
    alert(`¡Bienvenido al Club ${config.nombre}! Te hemos regalado tu primer sello.`);
  };

  const handleOpenQr = async () => {
    if (!currentSocio) return;
    try {
      const url = `${window.location.origin}/club?socio=${currentSocio.dni}`;
      const code = await QRCode.toDataURL(url, { width: 250, margin: 2 });
      setQrDataUrl(code);
      setIsQrOpen(true);
    } catch {
      // Ignored
    }
  };

  const stampCount = currentSocio ? currentSocio.sellos % 10 : 0;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-6 text-slate-100">
      {/* Header Banner */}
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 text-2xl shadow-[0_0_20px_rgba(245,158,11,0.5)] border-2 border-white mb-2">
          ⭐
        </div>
        <h1 className="text-2xl font-black uppercase text-amber-400 font-latina-luxury">
          Club de Recompensas
        </h1>
        <p className="text-xs text-sky-300 font-bold">
          Acumula sellos en cada visita y canjea platos y cócteles exclusivos
        </p>
      </div>

      {/* DNI Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2 p-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-lg">
        <input
          type="text"
          maxLength={8}
          placeholder="Ingresa tu DNI para ver tus sellos..."
          value={dniSearch}
          onChange={(e) => setDniSearch(e.target.value)}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white outline-none font-bold placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1 shadow shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Consultar</span>
        </button>
      </form>

      {searchError && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
          <span>{searchError}</span>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-black text-[11px] shrink-0 ml-2"
          >
            Registrarme
          </button>
        </div>
      )}

      {/* Loyalty Card Visual */}
      {currentSocio && (
        <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0c2042] via-[#091730] to-[#050d1a] border-2 border-amber-400 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.15)] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-400/30">
            <div>
              <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">
                Tarjeta de Fidelidad
              </span>
              <h2 className="text-lg font-black text-white font-latina-luxury">
                {currentSocio.nombre}
              </h2>
              <span className="text-[11px] font-mono text-amber-300">DNI: {currentSocio.dni}</span>
            </div>

            <button
              onClick={handleOpenQr}
              className="p-2.5 rounded-2xl bg-slate-900/90 border border-amber-400/50 text-amber-300 hover:text-white flex items-center gap-1.5 text-xs font-bold shadow"
            >
              <QrCode className="w-4 h-4" /> QR Socio
            </button>
          </div>

          {/* Stamps 10-Grid */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-amber-400">
                Progreso de Recompensas ({stampCount} / 10 Sellos)
              </span>
              <span className="text-[11px] text-sky-300 font-bold">
                {currentSocio.totalVisitas} visitas acumuladas
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
                const isStamped = slot <= stampCount;
                const isHalfPrize = slot === 5;
                const isFinalPrize = slot === 10;

                return (
                  <div
                    key={slot}
                    className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-1 transition-all ${
                      isStamped
                        ? isFinalPrize
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-500 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-gradient-to-br from-blue-600 to-sky-500 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : isFinalPrize
                        ? 'bg-amber-950/40 border-dashed border-amber-400/80 text-amber-300'
                        : isHalfPrize
                        ? 'bg-purple-950/40 border-dashed border-purple-400 text-purple-300'
                        : 'bg-slate-900/80 border-slate-700 text-slate-500'
                    }`}
                  >
                    {isStamped ? (
                      <Check className="w-5 h-5 text-amber-300 stroke-[3]" />
                    ) : isFinalPrize ? (
                      <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
                    ) : isHalfPrize ? (
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    ) : (
                      <span className="text-xs font-black">{slot}</span>
                    )}

                    <span className="text-[9px] font-black uppercase mt-0.5 leading-none">
                      {isFinalPrize ? 'Plato Free' : isHalfPrize ? 'Trago Free' : `Sello ${slot}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Benefits summary */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col gap-1.5">
            <p className="flex items-center gap-2 text-slate-200">
              <span className="text-amber-400 font-black">🎁 Sello 5:</span> Postre o Pisco Sour gratis en tu mesa.
            </p>
            <p className="flex items-center gap-2 text-slate-200">
              <span className="text-emerald-400 font-black">🏆 Sello 10:</span> Lomo Saltado o Plato de Fondo a elección 100% cortesía de la casa.
            </p>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl flex flex-col gap-3 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h3 className="text-base font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Registro Club de Socios
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">DNI (8 dígitos)</label>
                <input
                  type="text"
                  maxLength={8}
                  required
                  placeholder="45892147"
                  value={regDni}
                  onChange={(e) => setRegDni(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">Nombres y Apellidos</label>
                <input
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">WhatsApp de Contacto</label>
                <input
                  type="tel"
                  placeholder="+51 984..."
                  value={regTelefono}
                  onChange={(e) => setRegTelefono(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="cliente@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-black text-xs shadow"
              >
                Confirmar Registro & Recibir Primer Sello
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Socio Modal */}
      {isQrOpen && currentSocio && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center text-slate-100">
            <h3 className="text-base font-black uppercase text-amber-400 font-latina-luxury">
              Código QR de Socio
            </h3>
            <p className="text-xs text-white font-bold mt-1">{currentSocio.nombre}</p>
            <p className="text-[11px] font-mono text-sky-300">DNI: {currentSocio.dni}</p>

            <div className="p-3 bg-white rounded-2xl my-4 shadow-lg">
              {qrDataUrl && <img src={qrDataUrl} alt="QR Socio" className="w-44 h-44" />}
            </div>

            <p className="text-[10px] text-slate-400">
              Muestra este código al mozo o cajero al pagar para acumular tus sellos.
            </p>

            <button
              onClick={() => setIsQrOpen(false)}
              className="mt-4 w-full py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
