import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CalendarCheck, Clock, Users, Utensils, MessageSquare, CheckCircle, ArrowLeft, Share2, DollarSign } from 'lucide-react';
import { Reserva, ConfigRestaurante, Producto } from '../../types';
import { storage } from '../../services/storage';
import { CHUSPA_TECH_LOGO } from '../../constants/chuspaLogo';

interface ReservasPublicaProps {
  config: ConfigRestaurante;
  onBackToMenu: () => void;
}

export const ReservasPublica: React.FC<ReservasPublicaProps> = ({ config, onBackToMenu }) => {
  const mesas = storage.getMesas();
  const productos = storage.getProductos();

  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState<string>('19:30');
  const [personas, setPersonas] = useState<number>(4);
  const [mesaPreferida, setMesaPreferida] = useState<string>(() => mesas[0]?.nombre || 'Mesa 01');
  const [notas, setNotas] = useState<string>('');
  const [estadoReserva, setEstadoReserva] = useState<'Confirmada' | 'Por confirmar' | 'Cancelada'>('Por confirmar');
  const [platosSeleccionados, setPlatosSeleccionados] = useState<string[]>([]);
  const [pagoConfirmado, setPagoConfirmado] = useState<boolean>(false);
  const [montoAdelanto, setMontoAdelanto] = useState<number>(50);
  const [metodoPagoAdelanto, setMetodoPagoAdelanto] = useState<string>('Yape');

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [lastReservaId, setLastReservaId] = useState<string>('');

  const getPublicShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}?view=reservas`;
  };

  const handleTogglePlato = (platoNombre: string) => {
    if (platosSeleccionados.includes(platoNombre)) {
      setPlatosSeleccionados(platosSeleccionados.filter((p) => p !== platoNombre));
    } else {
      setPlatosSeleccionados([...platosSeleccionados, platoNombre]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `RES-${Date.now().toString().slice(-6)}`;
    const nuevaReserva: Reserva = {
      id,
      cliente: nombre.trim(),
      telefono: telefono.trim(),
      fechaReserva: fecha,
      horaReserva: hora,
      personas,
      mesaAsignada: mesaPreferida,
      notas: notas.trim() || 'Sin notas especiales',
      fechaCreacion: new Date().toLocaleDateString('es-PE'),
      estado: pagoConfirmado ? 'Confirmada' : estadoReserva,
      platosPreseleccionados: platosSeleccionados,
      pagoConfirmado,
      montoAdelanto: pagoConfirmado ? montoAdelanto : 0,
      metodoPagoAdelanto: pagoConfirmado ? metodoPagoAdelanto : undefined,
    };

    storage.saveReserva(nuevaReserva);
    setLastReservaId(id);
    setIsSuccess(true);

    try {
      confetti({ particleCount: 80, spread: 70 });
    } catch {
      // Ignored
    }
  };

  const sharePortalViaWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Te invito a hacer una reserva en *${config.nombre}* 🍽️✨.\n` +
      `Puedes elegir tu mesa, la fecha, y escoger los platos típicos que deseas pedir aquí:\n` +
      `${getPublicShareUrl()}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const openWhatsAppConfirmation = () => {
    const platosTexto = platosSeleccionados.length > 0 ? platosSeleccionados.join(', ') : 'A elegir en mesa';
    const text = encodeURIComponent(
      `¡Hola *${config.nombre}*! Acabo de registrar una reserva online:\n` +
        `• Código: ${lastReservaId}\n` +
        `• Titular: ${nombre}\n` +
        `• Fecha y Hora: ${fecha} a las ${hora}\n` +
        `• Personas: ${personas}\n` +
        `• Mesa asignada: ${mesaPreferida}\n` +
        `• Estado: ${pagoConfirmado ? 'Confirmada' : estadoReserva}\n` +
        `• Platos preseleccionados: ${platosTexto}\n` +
        `• Pago previo adelantado: ${pagoConfirmado ? `S/ ${montoAdelanto.toFixed(2)} (${metodoPagoAdelanto})` : 'Pendiente'}\n` +
        `• Notas: ${notas || 'Ninguna'}\n\n` +
        `Enlace directo de reservas: ${getPublicShareUrl()}`
    );
    window.open(`https://wa.me/${config.whatsapp || ''}?text=${text}`, '_blank');
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col items-center justify-center text-slate-100 min-h-screen">
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/95 border-2 border-amber-400 shadow-[0_10px_45px_rgba(0,0,0,0.85)] flex flex-col gap-4">
        {/* Header con Branding La Chuspa Tech y Restaurante */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white p-0.5 overflow-hidden border border-amber-400 flex items-center justify-center shrink-0">
              <img src={CHUSPA_TECH_LOGO} alt="La Chuspa Tech" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block leading-tight">
                La Chuspa Tech
              </span>
              <span className="text-xs font-bold text-white block leading-none">
                {config.nombre}
              </span>
            </div>
          </div>

          {/* Botón de Compartir Portal por WhatsApp */}
          <button
            type="button"
            onClick={sharePortalViaWhatsApp}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition-all"
            title="Compartir link de reservas por WhatsApp"
          >
            <i className="fa-brands fa-whatsapp text-sm"></i>
            <span>Compartir Link</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-4 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black uppercase text-amber-400 font-latina-luxury">
              ¡Reserva Registrada y Sincronizada!
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Tu reserva <b className="text-white">#{lastReservaId}</b> para{' '}
              <b className="text-amber-300">{personas} personas</b> el día{' '}
              <b className="text-sky-300">{fecha} a las {hora}</b> en{' '}
              <b className="text-emerald-300">{mesaPreferida}</b> ha sido registrada en el Panel de Control.
            </p>

            {pagoConfirmado && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                🔒 Mesa bloqueada automáticamente por Pago Previo Confirmado (S/ {montoAdelanto.toFixed(2)} vía {metodoPagoAdelanto}).
              </div>
            )}

            {platosSeleccionados.length > 0 && (
              <div className="w-full bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-left text-xs">
                <span className="text-slate-400 font-bold block mb-1">Platos preseleccionados:</span>
                <span className="text-amber-300 font-bold">{platosSeleccionados.join(' • ')}</span>
              </div>
            )}

            <button
              onClick={openWhatsAppConfirmation}
              className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              <i className="fa-brands fa-whatsapp text-lg"></i>
              <span>Enviar Confirmación a Restaurante por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={sharePortalViaWhatsApp}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-black text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir este Enlace con Amigos por WhatsApp</span>
            </button>

            <button
              onClick={onBackToMenu}
              className="mt-1 text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Menú Digital
            </button>
          </div>
        ) : (
          <>
            <div className="text-center pb-2">
              <h2 className="text-xl font-black uppercase text-amber-400 font-latina-luxury flex items-center justify-center gap-2">
                <CalendarCheck className="w-6 h-6 text-amber-400" /> Agendar Reserva de Mesa
              </h2>
              <p className="text-xs text-sky-300 font-bold mt-1">
                Garantiza tu lugar en el salón • Sincronizado en Tiempo Real
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                  Nombre Completo del Titular
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+51 984 000 000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                    Fecha de la Reserva
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                    N° Personas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={personas}
                    onChange={(e) => setPersonas(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-black outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                    Acomodar Mesa en Salón
                  </label>
                  <select
                    value={mesaPreferida}
                    onChange={(e) => setMesaPreferida(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
                  >
                    {mesas.map((m) => (
                      <option key={m.id} value={m.nombre}>
                        {m.nombre} {m.estado === 'ocupada' ? '(Ocupada)' : '(Disponible)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estado de la Reserva */}
              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                  Estado de la Reserva
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Confirmada', 'Por confirmar', 'Cancelada'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEstadoReserva(st)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                        estadoReserva === st
                          ? st === 'Confirmada'
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : st === 'Por confirmar'
                            ? 'bg-amber-600 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-red-600 text-white border-red-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {st === 'Confirmada' ? '✔ Confirmada' : st === 'Por confirmar' ? '⏳ Por Confirmar' : '✕ Cancelada'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escoger qué tipos de platos van a pedir */}
              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                  🍽️ ¿Qué platos desean pedir con anticipación? (Opcional):
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/80 border border-slate-800 rounded-xl">
                  {productos.map((prod) => {
                    const pName = prod.i18n?.es?.name || (prod as any).nombre || 'Plato';
                    const isSelected = platosSeleccionados.includes(pName);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleTogglePlato(pName)}
                        className={`text-left p-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/60 border-amber-400 text-white shadow'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{pName}</span>
                        <span className="text-[9px] text-amber-300 ml-1">S/ {prod.precioPEN}</span>
                      </button>
                    );
                  })}
                </div>
                {platosSeleccionados.length > 0 && (
                  <p className="text-[10px] text-emerald-400 mt-1 font-bold">
                    Seleccionados: {platosSeleccionados.length} plato(s)
                  </p>
                )}
              </div>

              {/* Confirmación de Pago Previo (Bloqueo Automático de Mesa) */}
              <div className="p-3 bg-gradient-to-r from-slate-950 to-[#0b1b36] border border-amber-500/40 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pagoConfirmado}
                    onChange={(e) => {
                      setPagoConfirmado(e.target.checked);
                      if (e.target.checked) setEstadoReserva('Confirmada');
                    }}
                    className="w-4 h-4 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xs font-black text-amber-300">
                    🔒 Confirmar Pago Previo / Adelanto (Bloquea Mesa para el Día)
                  </span>
                </label>

                {pagoConfirmado && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">Monto Adelantado (S/):</span>
                      <input
                        type="number"
                        min="10"
                        value={montoAdelanto}
                        onChange={(e) => setMontoAdelanto(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-black"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">Medio de Pago:</span>
                      <select
                        value={metodoPagoAdelanto}
                        onChange={(e) => setMetodoPagoAdelanto(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
                      >
                        <option value="Yape">Yape</option>
                        <option value="Plin">Plin</option>
                        <option value="Transferencia BCP">Transferencia BCP</option>
                        <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                        <option value="Efectivo en Local">Efectivo en Local</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                  Notas o Requerimientos Especiales
                </label>
                <textarea
                  rows={2}
                  placeholder="Cumpleaños, aniversario, silla para bebé, alergias..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="mt-1 w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,86,210,0.5)] border border-sky-300 cursor-pointer active:scale-95 transition-all"
              >
                <CalendarCheck className="w-4 h-4 text-amber-300" />
                <span>Confirmar y Guardar Reserva</span>
              </button>
            </form>

            <button
              type="button"
              onClick={onBackToMenu}
              className="text-center text-xs text-slate-400 hover:text-white mt-1 cursor-pointer"
            >
              ← Volver al Menú Digital
            </button>
          </>
        )}
      </div>
    </div>
  );
};
