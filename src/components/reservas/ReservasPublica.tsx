import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CalendarCheck, Clock, Users, Utensils, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import { Reserva, ConfigRestaurante } from '../../types';
import { storage } from '../../services/storage';

interface ReservasPublicaProps {
  config: ConfigRestaurante;
  onBackToMenu: () => void;
}

export const ReservasPublica: React.FC<ReservasPublicaProps> = ({ config, onBackToMenu }) => {
  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState<string>('19:30');
  const [personas, setPersonas] = useState<number>(4);
  const [mesaPreferida, setMesaPreferida] = useState<string>('Mesa 01');
  const [notas, setNotas] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [lastReservaId, setLastReservaId] = useState<string>('');

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
      estado: 'Pendiente',
    };

    storage.saveReserva(nuevaReserva);
    setLastReservaId(id);
    setIsSuccess(true);

    try {
      confetti({ particleCount: 75, spread: 60 });
    } catch {
      // Ignored
    }
  };

  const openWhatsAppConfirmation = () => {
    const text = encodeURIComponent(
      `¡Hola ${config.nombre}! Acabo de solicitar una reserva online:\n` +
        `• Código: ${lastReservaId}\n` +
        `• Titular: ${nombre}\n` +
        `• Fecha y Hora: ${fecha} a las ${hora}\n` +
        `• Personas: ${personas}\n` +
        `• Mesa preferida: ${mesaPreferida}\n` +
        `• Notas: ${notas || 'Ninguna'}`
    );
    window.open(`https://wa.me/${config.whatsapp}?text=${text}`, '_blank');
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 flex flex-col items-center justify-center text-slate-100 min-h-[calc(100vh-80px)]">
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-400 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex flex-col gap-4">
        {isSuccess ? (
          <div className="text-center py-4 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black uppercase text-amber-400 font-latina-luxury">
              ¡Solicitud de Reserva Registrada!
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Tu reserva <b className="text-white">#{lastReservaId}</b> para{' '}
              <b className="text-amber-300">{personas} comensales</b> el día{' '}
              <b className="text-sky-300">{fecha} a las {hora}</b> ha sido guardada en nuestro sistema.
            </p>

            <button
              onClick={openWhatsAppConfirmation}
              className="mt-2 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Confirmar por WhatsApp con el Restaurante</span>
            </button>

            <button
              onClick={onBackToMenu}
              className="mt-1 text-xs text-sky-400 hover:underline flex items-center gap-1 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Menú Digital
            </button>
          </div>
        ) : (
          <>
            <div className="text-center pb-2 border-b border-slate-800">
              <h2 className="text-xl font-black uppercase text-amber-400 font-latina-luxury flex items-center justify-center gap-2">
                <CalendarCheck className="w-6 h-6 text-amber-400" /> Agendar Reserva de Mesa
              </h2>
              <p className="text-xs text-sky-300 font-bold mt-1">
                {config.nombre} • Garantiza tu lugar en el salón
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                  Nombre Completo del Titular
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gonzalo Fernández"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                  WhatsApp de Contacto
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+51 984 000 000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none"
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
                    max="30"
                    required
                    value={personas}
                    onChange={(e) => setPersonas(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-black outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-sky-400 block mb-1">
                    Mesa Preferida
                  </label>
                  <select
                    value={mesaPreferida}
                    onChange={(e) => setMesaPreferida(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Mesa 01">Mesa 01 (Salón Principal)</option>
                    <option value="Mesa 02">Mesa 02 (Salón Principal)</option>
                    <option value="Mesa 05">Mesa 05 (Ventana)</option>
                    <option value="Terraza 1">Terraza Panorámica 1</option>
                    <option value="VIP Salón">VIP Salón Privado</option>
                  </select>
                </div>
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,86,210,0.4)] border border-sky-300 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-amber-300" />
                <span>Enviar Solicitud de Reserva</span>
              </button>
            </form>

            <button
              onClick={onBackToMenu}
              className="text-center text-xs text-slate-400 hover:text-white mt-1"
            >
              ← Volver al Menú Digital
            </button>
          </>
        )}
      </div>
    </div>
  );
};
