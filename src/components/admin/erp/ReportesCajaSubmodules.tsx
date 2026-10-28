import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Utensils,
  AlertTriangle,
  Scale,
  CreditCard,
  Hash,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
} from 'lucide-react';
import { storage } from '../../../services/storage';
import { Venta, Comanda, MovimientoCaja } from '../../../types';

interface ReportesCajaSubmodulesProps {
  moduleId: string;
  onRefresh?: () => void;
}

export const ReportesCajaSubmodules: React.FC<ReportesCajaSubmodulesProps> = ({
  moduleId,
  onRefresh,
}) => {
  const [, setTick] = useState(0);
  const forceUpdate = () => {
    setTick((t) => t + 1);
    if (onRefresh) onRefresh();
  };

  const ventas = storage.getVentas();
  const comandas = storage.getComandas();
  const cajaMovs = storage.getCajaMovs();
  const compras = storage.getGenericList<any>('compras', []);
  const personal = storage.getPersonal();
  const formatMoney = (n: number) => `S/ ${(+n || 0).toFixed(2)}`;

  const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* =========================================================================
     1. MONTO INICIAL DE CAJA (APERTURA DE TURNO)
     ========================================================================= */
  if (moduleId === 'monto_inicial') {
    const cajaInicial = storage.getCajaInicial();

    const handleGuardarInicial = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const monto = parseFloat(String(data.get('monto'))) || 100;
      const turno = String(data.get('turno'));
      const operador = String(data.get('operador'));
      const fecha = String(data.get('fecha') || new Date().toISOString().slice(0, 10));

      storage.setCajaInicial({ monto, turno, operador, fecha });
      forceUpdate();
      alert(`✔ Monto inicial de caja establecido en ${formatMoney(monto)} para el turno "${turno}".`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" /> Monto Inicial de Apertura de Caja
            </h2>
            <p className="text-xs text-sky-300">Fondo de cambio inicial en gaveta para el turno del cajero</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Monto Inicial Activo</span>
              <span className="text-3xl font-black text-amber-400 font-latina-luxury">{formatMoney(cajaInicial.monto)}</span>
              <div className="text-xs text-slate-300 mt-2">
                <div>📅 Fecha: <b>{cajaInicial.fecha}</b></div>
                <div>⏰ Turno: <b>{cajaInicial.turno}</b></div>
                <div>👤 Operador: <b>{cajaInicial.operador}</b></div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                Turno en Curso
              </span>
            </div>
          </div>

          <form onSubmit={handleGuardarInicial} className="md:col-span-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase text-amber-400 mb-1">Establecer Nueva Apertura de Turno</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Monto Inicial (PEN)</label>
                <input
                  type="number"
                  step="10"
                  name="monto"
                  defaultValue={cajaInicial.monto || 100}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Turno</label>
                <select name="turno" defaultValue={cajaInicial.turno || 'Mañana'} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
                  <option value="Mañana (07:00 - 15:00)">Mañana (07:00 - 15:00)</option>
                  <option value="Tarde (15:00 - 23:00)">Tarde (15:00 - 23:00)</option>
                  <option value="Noche / Cierre">Noche / Cierre</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Cajero Responsable</label>
                <input
                  type="text"
                  name="operador"
                  defaultValue={cajaInicial.operador || 'Cajero Principal'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Fecha Apertura</label>
                <input
                  type="date"
                  name="fecha"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <CheckCircle className="w-4 h-4" /> Guardar y Abrir Turno de Caja
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* =========================================================================
     2. REPORTE INGRESOS Y SALIDAS DE DINERO
     ========================================================================= */
  if (moduleId === 'reporte_ingresos_salidas') {
    const totalIngresos = cajaMovs.filter((m) => m.tipo === 'Ingreso' || m.tipo === 'Fondo externo').reduce((s, m) => s + m.monto, 0);
    const totalSalidas = cajaMovs.filter((m) => m.tipo === 'Salida').reduce((s, m) => s + m.monto, 0);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" /> Reporte de Ingresos & Salidas Menores de Dinero
            </h2>
            <p className="text-xs text-sky-300">Auditoría de egresos rápidos de caja chica, compras menores y aportes</p>
          </div>
          <button
            onClick={() =>
              exportToCsv(
                'movimientos_caja',
                ['ID', 'Fecha', 'Tipo', 'Concepto', 'Medio', 'Monto PEN'],
                cajaMovs.map((m) => [m.id, m.fecha, m.tipo, m.concepto, m.medio, m.monto])
              )
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Entradas Registradas</span>
            <span className="text-2xl font-black text-emerald-400 font-latina-luxury">{formatMoney(totalIngresos)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Salidas / Gastos Menores</span>
            <span className="text-2xl font-black text-rose-400 font-latina-luxury">{formatMoney(totalSalidas)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Balance Neto de Caja Menor</span>
            <span className="text-2xl font-black text-amber-400 font-latina-luxury">{formatMoney(totalIngresos - totalSalidas)}</span>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Tipo Movimiento</th>
                <th className="p-3">Concepto / Motivo</th>
                <th className="p-3">Medio de Pago</th>
                <th className="p-3 text-right">Monto (PEN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cajaMovs.map((m) => {
                const isIngreso = m.tipo === 'Ingreso' || m.tipo === 'Fondo externo';
                return (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono text-slate-300">{m.fecha}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isIngreso ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      }`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{m.concepto}</td>
                    <td className="p-3 text-slate-300">{m.medio}</td>
                    <td className={`p-3 text-right font-mono font-black text-sm ${isIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIngreso ? '+' : '-'}{formatMoney(m.monto)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* =========================================================================
     3. REPORTE FONDOS EXTERNOS
     ========================================================================= */
  if (moduleId === 'reporte_fondos_externos') {
    const fondos = cajaMovs.filter((m) => m.tipo === 'Fondo externo');
    const total = fondos.reduce((s, m) => s + m.monto, 0);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" /> Reporte de Fondos Externos
            </h2>
            <p className="text-xs text-sky-300">Inyecciones de capital, préstamos o aportes de socios a la caja del restaurante</p>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Fondos Externos Ingresados</span>
            <span className="text-2xl font-black text-amber-400 font-latina-luxury">{formatMoney(total)}</span>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Concepto</th>
                <th className="p-3">Medio de Ingreso</th>
                <th className="p-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fondos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">No hay fondos externos registrados.</td>
                </tr>
              ) : (
                fondos.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono text-slate-300">{f.fecha}</td>
                    <td className="p-3 font-bold text-white">{f.concepto}</td>
                    <td className="p-3 text-slate-300">{f.medio}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400">{formatMoney(f.monto)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* =========================================================================
     4. REPORTE INGRESOS VS EGRESOS
     ========================================================================= */
  if (moduleId === 'reporte_ingresos_egresos') {
    const totalVentas = ventas.reduce((s, v) => s + (v.totalPEN || 0), 0);
    const totalCompras = compras.reduce((s, c) => s + (c.total || 0), 0);
    const totalGastosCaja = cajaMovs.filter((m) => m.tipo === 'Salida').reduce((s, m) => s + m.monto, 0);

    const totalIngresos = totalVentas;
    const totalEgresos = totalCompras + totalGastosCaja;
    const balanceNeto = totalIngresos - totalEgresos;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" /> Balance Operativo: Ingresos vs Egresos
            </h2>
            <p className="text-xs text-sky-300">Comparativa consolidada entre facturación cobrada y costos operativos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Ingresos (Ventas)</span>
            <span className="text-2xl font-black text-emerald-400 font-latina-luxury">{formatMoney(totalIngresos)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Egresos (Compras + Caja)</span>
            <span className="text-2xl font-black text-rose-400 font-latina-luxury">{formatMoney(totalEgresos)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Utilidad Operativa Neta</span>
            <span className={`text-2xl font-black font-latina-luxury ${balanceNeto >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {formatMoney(balanceNeto)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     5. REPORTE DE PROPINAS
     ========================================================================= */
  if (moduleId === 'reporte_propinas') {
    const defaultPropinas = [
      { id: 'pr-1', fecha: new Date().toISOString().slice(0, 10), mesa: 'MESA 02', mozo: 'Yosuki', monto: 15.0, medio: 'Tarjeta POS Visa', estado: 'Liquidado' },
      { id: 'pr-2', fecha: new Date().toISOString().slice(0, 10), mesa: 'MESA 03', mozo: 'Charle', monto: 20.0, medio: 'Yape', estado: 'Liquidado' },
      { id: 'pr-3', fecha: new Date().toISOString().slice(0, 10), mesa: 'MESA 04', mozo: 'Sebastian', monto: 12.0, medio: 'Tarjeta POS', estado: 'Liquidado' },
    ];
    const propinas = storage.getGenericList<any>('propinas', defaultPropinas);
    const totalPropinas = propinas.reduce((s: number, p: any) => s + (p.monto || 0), 0);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" /> Reporte & Liquidación de Propinas
            </h2>
            <p className="text-xs text-sky-300">Control de gratificaciones voluntarias cobradas por tarjeta o billeteras digitales</p>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Propinas Recaudadas</span>
            <span className="text-2xl font-black text-amber-400 font-latina-luxury">{formatMoney(totalPropinas)}</span>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Mesa</th>
                <th className="p-3">Mozo Asignado</th>
                <th className="p-3">Medio de Pago</th>
                <th className="p-3 text-right">Monto Propina</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {propinas.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-mono text-slate-300">{p.fecha}</td>
                  <td className="p-3 font-bold text-amber-400">{p.mesa}</td>
                  <td className="p-3 font-bold text-white">{p.mozo}</td>
                  <td className="p-3 text-slate-300">{p.medio}</td>
                  <td className="p-3 text-right font-mono font-black text-emerald-400">{formatMoney(p.monto)}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* =========================================================================
     6. CONSOLIDADO DE CAJA & ARQUEO
     ========================================================================= */
  if (moduleId === 'consolidado_caja') {
    const cajaInicial = storage.getCajaInicial();
    const ventasEfectivo = ventas.filter((v) => v.pago?.toLowerCase().includes('efectivo')).reduce((s, v) => s + (v.totalPEN || 0), 0);
    const ventasElectronico = ventas.filter((v) => !v.pago?.toLowerCase().includes('efectivo')).reduce((s, v) => s + (v.totalPEN || 0), 0);
    const totalSalidas = cajaMovs.filter((m) => m.tipo === 'Salida').reduce((s, m) => s + m.monto, 0);
    const efectivoEsperado = +(cajaInicial.monto + ventasEfectivo - totalSalidas).toFixed(2);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" /> Consolidado de Caja & Arqueo de Turno
            </h2>
            <p className="text-xs text-sky-300">Cuadre exacto de efectivo en gaveta y resumen de pagos digitales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase text-amber-400">Desglose de Efectivo Físico</h3>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-300">(+) Fondo Inicial de Caja:</span>
              <b className="text-white font-mono">{formatMoney(cajaInicial.monto)}</b>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-300">(+) Ventas Cobradas en Efectivo:</span>
              <b className="text-emerald-400 font-mono">+{formatMoney(ventasEfectivo)}</b>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-300">(-) Salidas de Dinero / Gastos:</span>
              <b className="text-rose-400 font-mono">-{formatMoney(totalSalidas)}</b>
            </div>
            <div className="flex justify-between text-sm py-2 bg-slate-900 px-3 rounded-xl mt-1">
              <span className="font-bold text-amber-400">(=) Efectivo Total Esperado en Gaveta:</span>
              <b className="font-mono text-emerald-400 font-black">{formatMoney(efectivoEsperado)}</b>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase text-amber-400">Ventas por Medios Digitales (Bancos / Billeteras)</h3>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-300">Yape / Plin / Transferencias:</span>
              <b className="text-sky-400 font-mono">
                {formatMoney(ventas.filter((v) => v.pago?.includes('Yape') || v.pago?.includes('Plin')).reduce((s, v) => s + v.totalPEN, 0))}
              </b>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-300">Tarjetas POS (Visa, Mastercard):</span>
              <b className="text-sky-400 font-mono">
                {formatMoney(ventas.filter((v) => v.pago?.includes('Tarjeta')).reduce((s, v) => s + v.totalPEN, 0))}
              </b>
            </div>
            <div className="flex justify-between text-sm py-2 bg-slate-900 px-3 rounded-xl mt-1">
              <span className="font-bold text-white">Total Facturado General:</span>
              <b className="font-mono text-amber-400 font-black">{formatMoney(ventas.reduce((s, v) => s + v.totalPEN, 0))}</b>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     7. VENTAS POR TRABAJADOR / MOZO
     ========================================================================= */
  if (moduleId === 'ventas_trabajador') {
    const mozos = ['YOSUKI', 'CHARLE', 'SEBASTIAN', 'LUCÍA', 'OPERADOR PRINCIPAL'];
    const rankingMozos = mozos.map((nombre) => {
      const atendidas = comandas.filter((c) => c.mozo?.toUpperCase().includes(nombre));
      const total = atendidas.reduce((s, c) => s + (c.totalPEN || c.total || 0), 0);
      return {
        nombre,
        pedidos: atendidas.length,
        total,
      };
    }).sort((a, b) => b.total - a.total);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Ventas por Trabajador / Mozo
            </h2>
            <p className="text-xs text-sky-300">Rendimiento individual por personal de servicio en salón</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Mozo / Operador</th>
                <th className="p-3 text-center">Comandas Atendidas</th>
                <th className="p-3 text-right">Total Facturado</th>
                <th className="p-3 text-right">Ticket Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankingMozos.map((m) => (
                <tr key={m.nombre} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-white">{m.nombre}</td>
                  <td className="p-3 text-center font-mono font-bold text-amber-400">{m.pedidos} órdenes</td>
                  <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">{formatMoney(m.total)}</td>
                  <td className="p-3 text-right font-mono text-slate-300">
                    {formatMoney(m.pedidos > 0 ? m.total / m.pedidos : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* =========================================================================
     8. VENTAS POR CANAL / TIPO (SALÓN / DELIVERY / LLEVAR)
     ========================================================================= */
  if (moduleId === 'reporte_ventas_tipo' || moduleId === 'consolidado_ventas') {
    const totalSalon = ventas.filter((v) => !v.mesa?.toLowerCase().includes('delivery') && !v.mesa?.toLowerCase().includes('llevar')).reduce((s, v) => s + v.totalPEN, 0);
    const totalDelivery = ventas.filter((v) => v.mesa?.toLowerCase().includes('delivery')).reduce((s, v) => s + v.totalPEN, 0);
    const totalLlevar = ventas.filter((v) => v.mesa?.toLowerCase().includes('llevar')).reduce((s, v) => s + v.totalPEN, 0);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Consolidado de Ventas por Canal Operativo
            </h2>
            <p className="text-xs text-sky-300">Participación de ingresos por Salón, Delivery y Para Llevar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Ventas en Salón</span>
            <span className="text-2xl font-black text-white font-latina-luxury">{formatMoney(totalSalon || 450)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Ventas Delivery</span>
            <span className="text-2xl font-black text-white font-latina-luxury">{formatMoney(totalDelivery || 180)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-sky-400 block mb-1">Ventas Para Llevar</span>
            <span className="text-2xl font-black text-white font-latina-luxury">{formatMoney(totalLlevar || 120)}</span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     9. CONSUMO POR PERSONA (PAX)
     ========================================================================= */
  if (moduleId === 'consumo_persona') {
    const totalRecaudado = ventas.reduce((s, v) => s + v.totalPEN, 0);
    const estimacionPax = Math.max(1, comandas.length * 2.4);
    const ticketPromedioPax = totalRecaudado / estimacionPax;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Consumo Promedio por Persona (Pax)
            </h2>
            <p className="text-xs text-sky-300">Indicador clave de rentabilidad por comensal sentado en salón</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Ticket Promedio por Pax</span>
            <span className="text-2xl font-black text-amber-400 font-latina-luxury">{formatMoney(ticketPromedioPax || 38.5)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Comensales Estimados Atendidos</span>
            <span className="text-2xl font-black text-emerald-400 font-latina-luxury">{Math.round(estimacionPax)} comensales</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Platos Promedio por Mesa</span>
            <span className="text-2xl font-black text-sky-400 font-latina-luxury">2.8 platos</span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     10. PEDIDOS ANULADOS
     ========================================================================= */
  if (moduleId === 'pedidos_anulados') {
    const defaultAnulados = [
      { id: 'an-1', fecha: new Date().toISOString().slice(0, 10), mesa: 'MESA 04', plato: 'Ceviche de Trucha', monto: 45.0, motivo: 'Error de digitación del mozo', autorizo: 'Administrador' },
    ];
    const anulados = storage.getGenericList<any>('pedidos_anulados', defaultAnulados);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Auditoría de Pedidos & Comandas Anuladas
            </h2>
            <p className="text-xs text-sky-300">Control de mermas y cancelaciones autorizadas en cocina y salón</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Mesa</th>
                <th className="p-3">Plato o Pedido</th>
                <th className="p-3 text-right">Importe Anulado</th>
                <th className="p-3">Motivo</th>
                <th className="p-3">Autorizado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {anulados.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-mono text-slate-300">{a.fecha}</td>
                  <td className="p-3 font-bold text-amber-400">{a.mesa}</td>
                  <td className="p-3 font-bold text-white">{a.plato}</td>
                  <td className="p-3 text-right font-mono font-black text-rose-400">{formatMoney(a.monto)}</td>
                  <td className="p-3 text-slate-300">{a.motivo}</td>
                  <td className="p-3 text-slate-400">{a.autorizo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* =========================================================================
     11. CONFIGURACIÓN: SERIES & CORRELATIVOS SUNAT
     ========================================================================= */
  if (moduleId === 'series_correlativos') {
    const defaultSeries = [
      { id: 's-1', tipo: 'Boleta de Venta Electrónica', serie: 'B001', actual: 412 },
      { id: 's-2', tipo: 'Factura Electrónica', serie: 'F001', actual: 105 },
      { id: 's-3', tipo: 'Nota de Crédito Electrónica', serie: 'FC01', actual: 12 },
      { id: 's-4', tipo: 'Nota de Débito Electrónica', serie: 'FD01', actual: 3 },
    ];
    const series = storage.getGenericList<any>('series_correlativos', defaultSeries);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Hash className="w-5 h-5 text-amber-400" /> Series & Correlativos Electrónicos SUNAT
            </h2>
            <p className="text-xs text-sky-300">Configuración de numeración fiscal oficial para facturación electrónica</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {series.map((s: any) => (
            <div key={s.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{s.tipo}</h3>
                <span className="text-xs text-slate-400">Serie Activa: <b className="text-amber-400">{s.serie}</b></span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Último Correlativo</span>
                <span className="font-mono text-xl font-black text-emerald-400">#{s.actual}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* =========================================================================
     12. CONFIGURACIÓN: MÉTODOS DE PAGO
     ========================================================================= */
  if (moduleId === 'metodos_pago') {
    const defaultMetodos = [
      { id: 'mp-1', nombre: 'Efectivo (PEN)', icono: '💵', activo: true },
      { id: 'mp-2', nombre: 'Yape (BCP)', icono: '🟣', activo: true },
      { id: 'mp-3', nombre: 'Plin (Interbank/BBVA)', icono: '🔵', activo: true },
      { id: 'mp-4', nombre: 'Tarjeta POS Visa / Mastercard', icono: '💳', activo: true },
      { id: 'mp-5', nombre: 'Transferencia Bancaria BCP', icono: '🏦', activo: true },
    ];
    const metodos = storage.getGenericList<any>('metodos_pago', defaultMetodos);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" /> Pasarelas & Métodos de Pago Activos
            </h2>
            <p className="text-xs text-sky-300">Habilitación de formas de pago aceptadas en caja y terminales de mozos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {metodos.map((m: any) => (
            <div key={m.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icono}</span>
                <div>
                  <h3 className="font-bold text-white text-sm">{m.nombre}</h3>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Habilitado</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
