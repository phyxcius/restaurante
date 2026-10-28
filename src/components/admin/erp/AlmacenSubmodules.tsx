import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ShoppingCart,
  Scale,
  Tags,
  Warehouse,
  Calendar,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { storage } from '../../../services/storage';
import { Insumo, MovimientoAlmacen } from '../../../types';

interface AlmacenSubmodulesProps {
  moduleId: string;
  onRefresh?: () => void;
}

export const AlmacenSubmodules: React.FC<AlmacenSubmodulesProps> = ({ moduleId, onRefresh }) => {
  const [, setTick] = useState(0);
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().slice(0, 10));
  const [insumoFiltro, setInsumoFiltro] = useState<string>('');
  const forceUpdate = () => {
    setTick((t) => t + 1);
    if (onRefresh) onRefresh();
  };

  const insumos = storage.getInsumos();
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
     1. TRANSFERENCIAS ENTRE ALMACENES
     ========================================================================= */
  if (['transferencias', 'transferencia', 'transferencia_almacen', 'transferencia_de_almacen'].includes(moduleId)) {
    const defaultAlmacenes = [
      { id: 'alm-1', nombre: 'Almacén Central (Bodega)' },
      { id: 'alm-2', nombre: 'Cocina Principal' },
      { id: 'alm-3', nombre: 'Barra & Licores' },
    ];
    const almacenes = storage.getGenericList('almacenes', defaultAlmacenes);
    const transferencias = storage.getGenericList<any>('transferencias', [
      {
        id: 'tr-1',
        fecha: new Date().toISOString().slice(0, 10),
        origen: 'Almacén Central (Bodega)',
        destino: 'Cocina Principal',
        insumo: 'Lomo Fino de Res',
        cantidad: 15,
        unidad: 'kg',
        operador: 'Carlos Almacenero',
        motivo: 'Abastecimiento turno tarde',
      },
      {
        id: 'tr-2',
        fecha: new Date().toISOString().slice(0, 10),
        origen: 'Almacén Central (Bodega)',
        destino: 'Barra & Licores',
        insumo: 'Pisco Quebranta 4 OLLAS',
        cantidad: 6,
        unidad: 'botella 750ml',
        operador: 'Carlos Almacenero',
        motivo: 'Reposición cócteles',
      },
    ]);

    const handleCrearTransferencia = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const origen = String(data.get('origen'));
      const destino = String(data.get('destino'));
      const insumoNombre = String(data.get('insumo'));
      const cantidad = parseFloat(String(data.get('cantidad'))) || 0;
      const motivo = String(data.get('motivo') || 'Transferencia regular');
      const operador = String(data.get('operador') || 'Administrador');

      if (origen === destino) {
        alert('El almacén de origen y destino no pueden ser el mismo.');
        return;
      }
      if (cantidad <= 0) {
        alert('Ingresa una cantidad mayor a 0.');
        return;
      }

      const insumoObj = insumos.find((i) => i.nombre === insumoNombre);
      const nueva = {
        id: `tr-${Date.now()}`,
        fecha: new Date().toISOString().slice(0, 10),
        origen,
        destino,
        insumo: insumoNombre,
        cantidad,
        unidad: insumoObj?.unidad || 'und',
        operador,
        motivo,
      };

      storage.saveGenericItem('transferencias', nueva);

      // Registrar movimiento de salida en origen y de entrada en destino
      storage.addMovimientoAlmacen({
        id: `mov-tr-out-${Date.now()}`,
        fecha: new Date().toISOString().slice(0, 10),
        tipo: 'salida',
        almacen: origen,
        insumo: insumoNombre,
        cant: cantidad,
        costo: insumoObj?.costo || 0,
        doc: `TR-${nueva.id.slice(-4)}`,
        motivo: `Transferencia hacia ${destino}: ${motivo}`,
      });

      storage.addMovimientoAlmacen({
        id: `mov-tr-in-${Date.now()}`,
        fecha: new Date().toISOString().slice(0, 10),
        tipo: 'ingreso',
        almacen: destino,
        insumo: insumoNombre,
        cant: cantidad,
        costo: insumoObj?.costo || 0,
        doc: `TR-${nueva.id.slice(-4)}`,
        motivo: `Transferencia desde ${origen}: ${motivo}`,
      });

      form.reset();
      forceUpdate();
      alert(`✔ Transferencia de ${cantidad} ${insumoObj?.unidad || 'und'} de "${insumoNombre}" registrada con éxito.`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-amber-400" /> Transferencia entre Almacenes
            </h2>
            <p className="text-xs text-sky-300">
              Traspaso de insumos entre Bodega Central, Cocina y Barra con ajuste automático de stocks
            </p>
          </div>
          <button
            onClick={() =>
              exportToCsv(
                'transferencias_almacen',
                ['ID', 'Fecha', 'Origen', 'Destino', 'Insumo', 'Cantidad', 'Unidad', 'Operador', 'Motivo'],
                transferencias.map((t: any) => [t.id, t.fecha, t.origen, t.destino, t.insumo, t.cantidad, t.unidad, t.operador, t.motivo])
              )
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleCrearTransferencia} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Almacén Origen</label>
            <select name="origen" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {almacenes.map((a: any) => (
                <option key={a.id} value={a.nombre}>{a.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Almacén Destino</label>
            <select name="destino" defaultValue={almacenes[1]?.nombre || ''} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {almacenes.map((a: any) => (
                <option key={a.id} value={a.nombre}>{a.nombre}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Insumo a Transferir</label>
            <select name="insumo" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {insumos.map((i) => (
                <option key={i.id} value={i.nombre}>
                  {i.nombre} (Stock actual: {i.stockActual || 0} {i.unidad})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Cantidad</label>
            <input
              type="number"
              name="cantidad"
              step="0.1"
              required
              min="0.1"
              placeholder="Ej. 5"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Operador / Responsable</label>
            <input
              type="text"
              name="operador"
              defaultValue="Admin Almacén"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-2 md:col-span-5">
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Motivo o Justificación</label>
            <input
              type="text"
              name="motivo"
              placeholder="Ej. Requerimiento por alta rotación de Lomo Saltado en salón"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Transferir
            </button>
          </div>
        </form>

        {/* Tabla de transferencias */}
        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Destino</th>
                <th className="p-3">Insumo</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3">Operador</th>
                <th className="p-3">Motivo</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transferencias.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No se han registrado transferencias de almacén aún.
                  </td>
                </tr>
              ) : (
                transferencias.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono text-slate-300">{t.fecha}</td>
                    <td className="p-3 text-amber-300 font-semibold">{t.origen}</td>
                    <td className="p-3 text-emerald-300 font-semibold">{t.destino}</td>
                    <td className="p-3 font-bold text-white">{t.insumo}</td>
                    <td className="p-3 text-right font-black font-mono text-white">
                      {t.cantidad} <span className="text-[10px] text-slate-400">{t.unidad}</span>
                    </td>
                    <td className="p-3 text-slate-300">{t.operador}</td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{t.motivo}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar registro de transferencia de ${t.insumo}?`)) {
                            storage.deleteGenericItem('transferencias', t.id);
                            forceUpdate();
                          }
                        }}
                        className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
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
     2. COMPRAS DE INSUMOS A PROVEEDORES
     ========================================================================= */
  if (moduleId === 'compras') {
    const proveedores = storage.getGenericList('proveedores', [
      { id: 'pr-1', ruc: '20501234561', nombre: 'Distribuidora Carnes del Sur S.A.C.', telefono: '984112233' },
      { id: 'pr-2', ruc: '20609876543', nombre: 'Verdulería & Hortalizas Cusco E.I.R.L.', telefono: '984334455' },
      { id: 'pr-3', ruc: '20405566778', nombre: 'Bodegas & Licores Andinos S.A.', telefono: '984556677' },
    ]);

    const compras = storage.getGenericList<any>('compras', [
      {
        id: 'comp-101',
        fecha: new Date().toISOString().slice(0, 10),
        proveedor: 'Distribuidora Carnes del Sur S.A.C.',
        ruc: '20501234561',
        comprobante: 'F001-000452',
        almacen: 'Almacén Central (Bodega)',
        insumo: 'Lomo Fino de Res',
        cantidad: 30,
        costoUnit: 34.0,
        total: 1020.0,
        estado: 'Pagado',
      },
      {
        id: 'comp-102',
        fecha: new Date().toISOString().slice(0, 10),
        proveedor: 'Verdulería & Hortalizas Cusco E.I.R.L.',
        ruc: '20609876543',
        comprobante: 'B002-001290',
        almacen: 'Almacén Central (Bodega)',
        insumo: 'Cebolla Roja Cusqueña',
        cantidad: 50,
        costoUnit: 2.8,
        total: 140.0,
        estado: 'Pagado',
      },
    ]);

    const totalCompras = compras.reduce((acc: number, c: any) => acc + (c.total || 0), 0);

    const handleGuardarCompra = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const provNombre = String(data.get('proveedor'));
      const comprobante = String(data.get('comprobante'));
      const almacen = String(data.get('almacen'));
      const insumoNombre = String(data.get('insumo'));
      const cantidad = parseFloat(String(data.get('cantidad'))) || 0;
      const costoUnit = parseFloat(String(data.get('costoUnit'))) || 0;
      const fecha = String(data.get('fecha') || new Date().toISOString().slice(0, 10));

      if (cantidad <= 0 || costoUnit <= 0) {
        alert('Ingresa una cantidad y costo unitario válidos.');
        return;
      }

      const total = +(cantidad * costoUnit).toFixed(2);
      const provObj = proveedores.find((p: any) => p.nombre === provNombre);
      const ruc = provObj?.ruc || '20000000001';

      const nuevaCompra = {
        id: `comp-${Date.now()}`,
        fecha,
        proveedor: provNombre,
        ruc,
        comprobante,
        almacen,
        insumo: insumoNombre,
        cantidad,
        costoUnit,
        total,
        estado: 'Pagado',
      };

      storage.saveGenericItem('compras', nuevaCompra);

      // Aumentar stock del insumo y actualizar costo
      const insumoObj = insumos.find((i) => i.nombre === insumoNombre);
      if (insumoObj) {
        insumoObj.stockActual = (insumoObj.stockActual || 0) + cantidad;
        insumoObj.costo = costoUnit;
        storage.saveInsumo(insumoObj);
      }

      // Registrar movimiento de almacén
      storage.addMovimientoAlmacen({
        id: `mov-comp-${Date.now()}`,
        fecha,
        tipo: 'ingreso',
        almacen,
        insumo: insumoNombre,
        cant: cantidad,
        costo: costoUnit,
        doc: comprobante,
        motivo: `Compra proveedor: ${provNombre}`,
      });

      form.reset();
      forceUpdate();
      alert(`✔ Compra registrada por ${formatMoney(total)}. Stock de "${insumoNombre}" aumentado en ${cantidad}.`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" /> Registro de Compras & Facturas de Proveedores
            </h2>
            <p className="text-xs text-sky-300">
              Ingreso de compras con factura/boleta SUNAT, cálculo de costo unitario y actualización directa de stock
            </p>
          </div>
          <button
            onClick={() =>
              exportToCsv(
                'compras_proveedores',
                ['ID', 'Fecha', 'Proveedor', 'RUC', 'Comprobante', 'Almacén', 'Insumo', 'Cantidad', 'Costo Unit', 'Total S/'],
                compras.map((c: any) => [c.id, c.fecha, c.proveedor, c.ruc, c.comprobante, c.almacen, c.insumo, c.cantidad, c.costoUnit, c.total])
              )
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Compras
          </button>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Compras Acumuladas</span>
              <span className="text-2xl font-black text-amber-400 font-latina-luxury">{formatMoney(totalCompras)}</span>
            </div>
            <ShoppingCart className="w-7 h-7 text-amber-400/40" />
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Comprobantes Registrados</span>
              <span className="text-2xl font-black text-emerald-400 font-latina-luxury">{compras.length} docs</span>
            </div>
            <CheckCircle className="w-7 h-7 text-emerald-400/40" />
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Proveedores Activos</span>
              <span className="text-2xl font-black text-sky-400 font-latina-luxury">{proveedores.length}</span>
            </div>
            <Warehouse className="w-7 h-7 text-sky-400/40" />
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardarCompra} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Proveedor</label>
            <select name="proveedor" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {proveedores.map((p: any) => (
                <option key={p.id} value={p.nombre}>{p.nombre} ({p.ruc})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">N° Comprobante / Factura</label>
            <input
              type="text"
              name="comprobante"
              required
              placeholder="Ej. F001-002341"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Insumo Comprado</label>
            <select name="insumo" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {insumos.map((i) => (
                <option key={i.id} value={i.nombre}>{i.nombre} ({i.unidad})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Almacén Destino</label>
            <select name="almacen" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              <option value="Almacén Central (Bodega)">Almacén Central (Bodega)</option>
              <option value="Cocina Principal">Cocina Principal</option>
              <option value="Barra & Licores">Barra & Licores</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Cantidad Comprada</label>
            <input
              type="number"
              name="cantidad"
              step="0.1"
              required
              placeholder="Ej. 25"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Costo Unit. (S/)</label>
            <input
              type="number"
              name="costoUnit"
              step="0.01"
              required
              placeholder="Ej. 34.50"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Fecha Emisión</label>
            <input
              type="date"
              name="fecha"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Compra
            </button>
          </div>
        </form>

        {/* Tabla */}
        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Comprobante</th>
                <th className="p-3">Proveedor</th>
                <th className="p-3">Insumo</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3 text-right">Costo Unit.</th>
                <th className="p-3 text-right">Total (S/)</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">No hay compras registradas.</td>
                </tr>
              ) : (
                compras.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono text-slate-300">{c.fecha}</td>
                    <td className="p-3 font-mono font-bold text-sky-400">{c.comprobante}</td>
                    <td className="p-3 text-white font-semibold">{c.proveedor}</td>
                    <td className="p-3 font-bold text-amber-300">{c.insumo}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">{c.cantidad}</td>
                    <td className="p-3 text-right font-mono text-slate-300">{formatMoney(c.costoUnit)}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">{formatMoney(c.total)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar compra ${c.comprobante}?`)) {
                            storage.deleteGenericItem('compras', c.id);
                            forceUpdate();
                          }
                        }}
                        className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
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
     3. UNIDADES DE MEDIDA
     ========================================================================= */
  if (moduleId === 'unidades') {
    const defaultUnidades = [
      { id: 'u-kg', nombre: 'Kilogramos', abrev: 'kg', descripcion: 'Unidad de peso para carnes, verduras y quesos' },
      { id: 'u-gr', nombre: 'Gramos', abrev: 'gr', descripcion: 'Porcionamiento y especias finas' },
      { id: 'u-lt', nombre: 'Litros', abrev: 'lt', descripcion: 'Líquidos, aceites, leche y jugos' },
      { id: 'u-ml', nombre: 'Mililitros', abrev: 'ml', descripcion: 'Coctelería y licores por onza' },
      { id: 'u-und', nombre: 'Unidad', abrev: 'und', descripcion: 'Huevos, frutas enteras, choclo' },
      { id: 'u-bot', nombre: 'Botella 750ml', abrev: 'botella 750ml', descripcion: 'Vinos, piscos y destilados' },
      { id: 'u-por', nombre: 'Porción', abrev: 'porción', descripcion: 'Unidad de receta de cocina' },
    ];
    const unidades = storage.getGenericList<any>('unidades', defaultUnidades);

    const handleGuardarUnidad = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const nombre = String(data.get('nombre') || '').trim();
      const abrev = String(data.get('abrev') || '').trim();
      const descripcion = String(data.get('descripcion') || '').trim();

      if (!nombre || !abrev) {
        alert('Ingresa el nombre y abreviatura de la unidad.');
        return;
      }

      storage.saveGenericItem('unidades', {
        id: `u-${Date.now()}`,
        nombre,
        abrev,
        descripcion,
      });

      form.reset();
      forceUpdate();
      alert(`✔ Unidad "${nombre}" (${abrev}) creada.`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" /> Unidades de Medida
            </h2>
            <p className="text-xs text-sky-300">Definición de magnitudes estándar para costeo y control de inventario</p>
          </div>
        </div>

        <form onSubmit={handleGuardarUnidad} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej. Galón"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Abreviatura / Símbolo</label>
            <input
              type="text"
              name="abrev"
              required
              placeholder="Ej. gal"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Descripción / Uso</label>
            <input
              type="text"
              name="descripcion"
              placeholder="Ej. Líquidos a granel"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Unidad
            </button>
          </div>
        </form>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Nombre</th>
                <th className="p-3">Abreviatura</th>
                <th className="p-3">Descripción</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {unidades.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-white">{u.nombre}</td>
                  <td className="p-3 font-mono font-bold text-amber-400">{u.abrev}</td>
                  <td className="p-3 text-slate-300">{u.descripcion}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar unidad "${u.nombre}"?`)) {
                          storage.deleteGenericItem('unidades', u.id);
                          forceUpdate();
                        }
                      }}
                      className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
     4. TIPOS DE INSUMO (CATEGORÍAS DE MATERIA PRIMA)
     ========================================================================= */
  if (moduleId === 'tipos_insumo') {
    const defaultTipos = [
      { id: 'ti-1', nombre: 'Carnes & Aves', color: '#ef4444' },
      { id: 'ti-2', nombre: 'Pescados & Mariscos', color: '#0ea5e9' },
      { id: 'ti-3', nombre: 'Verduras & Hortalizas', color: '#10b981' },
      { id: 'ti-4', nombre: 'Abarrotes & Granos', color: '#f59e0b' },
      { id: 'ti-5', nombre: 'Licores & Destilados', color: '#8b5cf6' },
      { id: 'ti-6', nombre: 'Lácteos & Quesos', color: '#ec4899' },
      { id: 'ti-7', nombre: 'Especias & Salsas', color: '#14b8a6' },
    ];
    const tipos = storage.getGenericList<any>('tipos_insumo', defaultTipos);

    const handleCrearTipo = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const nombre = String(data.get('nombre') || '').trim();
      if (!nombre) return;

      storage.saveGenericItem('tipos_insumo', {
        id: `ti-${Date.now()}`,
        nombre,
        color: '#0ea5e9',
      });
      form.reset();
      forceUpdate();
      alert(`✔ Categoría "${nombre}" agregada.`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Tags className="w-5 h-5 text-amber-400" /> Categorías & Tipos de Insumo
            </h2>
            <p className="text-xs text-sky-300">Clasificación de materias primas para reportes y costeo analítico</p>
          </div>
        </div>

        <form onSubmit={handleCrearTipo} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex gap-3 max-w-xl">
          <input
            type="text"
            name="nombre"
            required
            placeholder="Nueva categoría (ej. Panadería y Postres)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tipos.map((t: any) => {
            const count = insumos.filter(
              (i) => i.tipo?.toLowerCase() === t.nombre.toLowerCase() || t.nombre.toLowerCase().includes(i.tipo?.toLowerCase() || '')
            ).length;
            return (
              <div key={t.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{t.nombre}</h3>
                  <span className="text-[11px] text-sky-300 font-medium">{count} insumos vinculados</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar categoría "${t.nombre}"?`)) {
                      storage.deleteGenericItem('tipos_insumo', t.id);
                      forceUpdate();
                    }
                  }}
                  className="p-1.5 rounded bg-red-950 text-red-400 hover:text-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* =========================================================================
     5. ALMACENES DEL RESTAURANTE
     ========================================================================= */
  if (moduleId === 'almacenes') {
    const defaultAlmacenes = [
      { id: 'alm-1', nombre: 'Almacén Central (Bodega)', encargado: 'Carlos Mendoza', ubicacion: 'Sótano Sector A', estado: 'Operativo' },
      { id: 'alm-2', nombre: 'Cocina Principal', encargado: 'Ramiro Quispe (Chef)', ubicacion: 'Planta Baja', estado: 'Operativo' },
      { id: 'alm-3', nombre: 'Barra & Licores', encargado: 'Javier Bartender', ubicacion: 'Salón Principal', estado: 'Operativo' },
      { id: 'alm-4', nombre: 'Cámara de Frío', encargado: 'Ramiro Quispe (Chef)', ubicacion: 'Área Cocina', estado: 'Operativo' },
    ];
    const almacenes = storage.getGenericList<any>('almacenes', defaultAlmacenes);

    const handleCrearAlmacen = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const nombre = String(data.get('nombre') || '').trim();
      const encargado = String(data.get('encargado') || '').trim();
      const ubicacion = String(data.get('ubicacion') || '').trim();

      if (!nombre) return;

      storage.saveGenericItem('almacenes', {
        id: `alm-${Date.now()}`,
        nombre,
        encargado: encargado || 'Encargado General',
        ubicacion: ubicacion || 'Restaurante',
        estado: 'Operativo',
      });

      form.reset();
      forceUpdate();
      alert(`✔ Almacén "${nombre}" creado.`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-400" /> Almacenes Físicos & Ubicaciones
            </h2>
            <p className="text-xs text-sky-300">Puntos de control físico para entradas, salidas y transferencias</p>
          </div>
        </div>

        <form onSubmit={handleCrearAlmacen} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Nombre Almacén</label>
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej. Almacén Seco 2"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Responsable / Encargado</label>
            <input
              type="text"
              name="encargado"
              placeholder="Ej. Mozo Jefe / Cocina"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Ubicación Física</label>
            <input
              type="text"
              name="ubicacion"
              placeholder="Ej. Segundo Nivel"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Crear Almacén
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {almacenes.map((a: any) => (
            <div key={a.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    {a.estado}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar almacén "${a.nombre}"?`)) {
                        storage.deleteGenericItem('almacenes', a.id);
                        forceUpdate();
                      }
                    }}
                    className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-bold text-white text-sm mb-1">{a.nombre}</h3>
                <p className="text-xs text-slate-300">👤 {a.encargado}</p>
                <p className="text-[11px] text-slate-400">📍 {a.ubicacion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* =========================================================================
     6. KARDEX SEGUIMIENTO DIARIO
     ========================================================================= */
  if (['kardex_diario', 'kardex_seguimiento_diario'].includes(moduleId)) {
    const movs = storage.getMovimientosAlmacen();

    // Calcular entradas y salidas por insumo en la fecha seleccionada
    const kardexRows = insumos.map((ins) => {
      const movsHoy = movs.filter((m) => m.insumo === ins.nombre && (!fechaFiltro || m.fecha === fechaFiltro));
      const entradas = movsHoy.filter((m) => m.tipo === 'ingreso' || m.tipo === 'tin').reduce((s, m) => s + (m.cant || 0), 0);
      const salidas = movsHoy.filter((m) => m.tipo === 'salida' || m.tipo === 'tout').reduce((s, m) => s + (m.cant || 0), 0);
      const stockFinal = ins.stockActual || 0;
      const stockInicial = +(stockFinal - entradas + salidas).toFixed(2);
      const valorTotal = +(stockFinal * (ins.costo || 0)).toFixed(2);

      return {
        insumo: ins.nombre,
        unidad: ins.unidad,
        costo: ins.costo,
        stockInicial,
        entradas,
        salidas,
        stockFinal,
        valorTotal,
      };
    });

    const totalValorizado = kardexRows.reduce((acc, r) => acc + r.valorTotal, 0);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" /> Kardex Seguimiento Diario
            </h2>
            <p className="text-xs text-sky-300">Balance del día por insumo con stock inicial, entradas, salidas y valorización</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
            />
            <button
              onClick={() =>
                exportToCsv(
                  `kardex_diario_${fechaFiltro}`,
                  ['Insumo', 'Unidad', 'Costo Unit.', 'Stock Inicial', 'Entradas', 'Salidas', 'Stock Final', 'Valorizado S/'],
                  kardexRows.map((r) => [r.insumo, r.unidad, r.costo, r.stockInicial, r.entradas, r.salidas, r.stockFinal, r.valorTotal])
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Inventario Valorizado (S/)</span>
            <span className="text-2xl font-black text-amber-400 font-latina-luxury">{formatMoney(totalValorizado)}</span>
          </div>
          <span className="text-xs text-slate-400">Total Insumos: <b>{kardexRows.length}</b></span>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Insumo</th>
                <th className="p-3">Unidad</th>
                <th className="p-3 text-right">Costo Unit.</th>
                <th className="p-3 text-right">Stock Inicial</th>
                <th className="p-3 text-right text-emerald-400">Entradas (+)</th>
                <th className="p-3 text-right text-rose-400">Salidas (-)</th>
                <th className="p-3 text-right font-black text-white">Stock Final</th>
                <th className="p-3 text-right text-amber-300">Valorizado S/</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {kardexRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-white">{r.insumo}</td>
                  <td className="p-3 text-slate-300">{r.unidad}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{formatMoney(r.costo)}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{r.stockInicial}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">+{r.entradas}</td>
                  <td className="p-3 text-right font-mono font-bold text-rose-400">-{r.salidas}</td>
                  <td className="p-3 text-right font-mono font-black text-white">{r.stockFinal}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-400">{formatMoney(r.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* =========================================================================
     7. KARDEX SEGUIMIENTO DETALLADO
     ========================================================================= */
  if (['kardex_detallado', 'kardex_seguimiento_detallado'].includes(moduleId)) {
    const movs = storage.getMovimientosAlmacen();

    const filtrados = movs.filter((m) => (!insumoFiltro || m.insumo === insumoFiltro));

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" /> Kardex Seguimiento Detallado
            </h2>
            <p className="text-xs text-sky-300">Libro contable de movimientos unitarios de entrada, salida y transferencias</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={insumoFiltro}
              onChange={(e) => setInsumoFiltro(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              <option value="">Todos los Insumos</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.nombre}>{i.nombre}</option>
              ))}
            </select>
            <button
              onClick={() =>
                exportToCsv(
                  'kardex_detallado',
                  ['ID', 'Fecha', 'Tipo', 'Insumo', 'Almacén', 'Cantidad', 'Costo Unit.', 'Doc', 'Motivo'],
                  filtrados.map((m) => [m.id, m.fecha, m.tipo, m.insumo, m.almacen, m.cant, m.costo, m.doc || '', m.motivo || ''])
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Insumo</th>
                <th className="p-3">Almacén</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3 text-right">Costo Unit.</th>
                <th className="p-3">Documento</th>
                <th className="p-3">Concepto / Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No hay movimientos registrados para este insumo.
                  </td>
                </tr>
              ) : (
                filtrados.map((m) => {
                  const isIngreso = m.tipo === 'ingreso' || m.tipo === 'tin';
                  return (
                    <tr key={m.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono text-slate-300">{m.fecha}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isIngreso ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {isIngreso ? '🟢 Ingreso' : '🔴 Salida'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">{m.insumo}</td>
                      <td className="p-3 text-slate-300">{m.almacen}</td>
                      <td className="p-3 text-right font-mono font-black text-white">{m.cant}</td>
                      <td className="p-3 text-right font-mono text-slate-400">{formatMoney(m.costo)}</td>
                      <td className="p-3 font-mono text-sky-400 font-semibold">{m.doc || '-'}</td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">{m.motivo || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};
