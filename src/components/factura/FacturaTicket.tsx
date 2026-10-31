import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, CheckCircle } from 'lucide-react';
import { Venta, ConfigRestaurante } from '../../types';
import { storage } from '../../services/storage';

interface FacturaTicketProps {
  config: ConfigRestaurante;
  onBack: () => void;
}

export const FacturaTicket: React.FC<FacturaTicketProps> = ({ config, onBack }) => {
  const [venta, setVenta] = useState<Venta | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Load last factura from storage, or the most recent sale
    let v = storage.getUltimaFactura();
    if (!v) {
      const all = storage.getVentas();
      if (all.length > 0) v = all[0];
    }

    if (!v) {
      // Demo fallback sale if empty
      v = {
        id: 'DEMO-001',
        numero: 'B001-000042',
        serie: 'B001',
        fecha: `${new Date().toLocaleDateString('es-PE')} 14:30`,
        mesa: 'Mesa 01',
        cliente: 'Carlos Mendoza Flores',
        productos: '1x Lomo Saltado Criollo, 1x Pisco Sour Cusqueño Clásico',
        items: [
          { nombre: 'Lomo Saltado Criollo', cantidad: 1, precio: 38 },
          { nombre: 'Pisco Sour Cusqueño Clásico', cantidad: 1, precio: 25 },
        ],
        baseImponible: 53.39,
        igv: 9.61,
        totalPEN: 63.0,
        pago: 'Tarjeta POS',
        tipoComprobante: 'Boleta',
        rucCliente: '45892147',
        cajero: 'Administrador (Turno Mañana)',
        enlacePdf: 'https://facturacion.apisperu.com/ver/ticket/B001-000042.pdf',
      };
    }

    setVenta(v);

    // Generate SUNAT QR string
    const sunatQrString = `${config.ruc}|${v.tipoComprobante === 'Factura' ? '01' : '03'}|${v.serie}|${v.numero.split('-')[1] || '00000001'}|${v.igv}|${v.totalPEN}|${v.fecha.slice(0, 10)}|${v.rucCliente ? (v.rucCliente.length === 11 ? '6' : '1') : '-'}|${v.rucCliente || '00000000'}|`;

    QRCode.toDataURL(sunatQrString, { width: 140, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [config]);

  if (!venta) return null;

  const isFactura = venta.tipoComprobante === 'Factura';

  return (
    <div className="w-full min-h-[calc(100vh-60px)] flex flex-col items-center justify-center p-4 bg-slate-950">
      {/* Printable Receipt Container (Thermal 80mm format) */}
      <div className="w-full max-w-[340px] bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border-t-8 border-amber-500 font-mono text-xs flex flex-col items-center print:shadow-none print:border-none print:max-w-none print:p-0">
        {/* Logo and business name */}
        <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-amber-500 overflow-hidden flex items-center justify-center text-2xl mb-1 shadow">
          {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
            <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span>{config.logo || '🍽️'}</span>
          )}
        </div>

        <h2 className="text-base font-black tracking-wider uppercase text-center font-sans">
          {config.nombre}
        </h2>
        <p className="text-[10px] text-slate-500 italic text-center leading-tight">
          {config.eslogan || 'Cusco • Gourmet'}
        </p>
        <p className="text-[11px] font-bold mt-1 text-center">RUC: {config.ruc}</p>
        <p className="text-[10px] text-slate-600 text-center">{config.direccion}</p>
        <p className="text-[10px] text-slate-600 text-center">Tel: +{config.whatsapp}</p>

        {/* Voucher type banner */}
        <div className="my-2.5 w-full py-1.5 px-2 bg-slate-100 border border-slate-300 rounded text-center">
          <span className="block font-black text-[11px] tracking-wide text-blue-900 uppercase">
            *** {isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'} ***
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-700">
            {venta.numero}
          </span>
        </div>

        {/* Date and Table */}
        <div className="w-full flex justify-between text-[11px] pb-1 border-b border-dashed border-slate-300 mb-2">
          <span>{venta.mesa}</span>
          <span>{venta.fecha}</span>
        </div>

        {/* Customer Information */}
        <div className="w-full bg-slate-50 p-2 rounded border border-slate-200 text-[10px] mb-2 leading-relaxed">
          <p>
            <b>Cliente:</b> {venta.razonSocialCliente || venta.cliente || 'CLIENTE GENERAL'}
          </p>
          <p>
            <b>{isFactura ? 'RUC' : 'DNI'}:</b> {venta.rucCliente || '00000000'}
          </p>
          <p>
            <b>Medio de Pago:</b> {venta.pago}
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full text-[10px] border-collapse mb-2">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="pb-1">Cant. / Plato</th>
              <th className="pb-1 text-right">P.U</th>
              <th className="pb-1 text-right">Subt.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-slate-200">
            {venta.items && venta.items.length > 0 ? (
              venta.items.map((item, idx) => (
                <tr key={idx} className="py-1">
                  <td className="py-1">
                    <b>{item.cantidad}x</b> {item.nombre}
                  </td>
                  <td className="py-1 text-right font-mono">
                    S/ {item.precio.toFixed(2)}
                  </td>
                  <td className="py-1 text-right font-mono font-bold">
                    S/ {(item.cantidad * item.precio).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-2">
                  Consumo General en Restaurante
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="w-full border-t-2 border-dashed border-slate-400 pt-2 flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between text-slate-600">
            <span>Op. Gravadas:</span>
            <span className="font-mono">S/ {venta.baseImponible.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>IGV (18%):</span>
            <span className="font-mono">S/ {venta.igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-900">
            <span>TOTAL:</span>
            <span className="font-mono">S/ {venta.totalPEN.toFixed(2)}</span>
          </div>
        </div>

        {/* SUNAT QR and Legal Footer */}
        <div className="my-3 flex flex-col items-center text-center">
          {qrDataUrl && <img src={qrDataUrl} alt="SUNAT QR" className="w-24 h-24 mb-1" />}
          <span className="text-[9px] text-slate-500 max-w-[240px] leading-tight">
            Representación impresa de la Boleta/Factura Electrónica autorizada por SUNAT.
          </span>
          <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-1 mt-1">
            <CheckCircle className="w-3 h-3" /> Estado: Comprobante Aceptado
          </span>
        </div>

        <p className="text-[10px] text-slate-500 italic mt-1">
          ¡Gracias por su preferencia!
        </p>
      </div>

      {/* Control Buttons (no print) */}
      <div className="mt-4 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Ticket (80mm)</span>
        </button>

        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      </div>
    </div>
  );
};
