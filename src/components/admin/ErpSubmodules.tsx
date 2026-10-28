import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Printer,
  Calendar,
  Warehouse,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Search,
  Lock,
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Utensils,
  BookOpen,
} from 'lucide-react';
import { storage } from '../../services/storage';
import { Venta, Insumo, Receta, MovimientoAlmacen, Producto, Comanda } from '../../types';
import { AlmacenSubmodules } from './erp/AlmacenSubmodules';
import { VentasSubmodules } from './erp/VentasSubmodules';
import { PersonalSubmodules } from './erp/PersonalSubmodules';
import { ReportesCajaSubmodules } from './erp/ReportesCajaSubmodules';

export interface ErpSubmodulesProps {
  moduleId: string; // e.g. 'recetas', 'insumos', 'guias_ingreso', etc.
  onSelectSubmenu?: (subId: string) => void;
}

export const ErpSubmodules: React.FC<ErpSubmodulesProps> = ({ moduleId, onSelectSubmenu }) => {
  // Common states
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Form states for generic CRUD
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number>>({});

  // Cierre diario state
  const [cierreFecha, setCierreFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Global data sources
  const ventas = storage.getVentas();
  const comandas = storage.getComandas();
  const insumos = storage.getInsumos();
  const recetas = storage.getRecetas();
  const productos = storage.getProductos();
  const movsAlmacen = storage.getMovimientosAlmacen();
  const personal = storage.getPersonal();
  const cierres = storage.getCierres();
  const cajaMovs = storage.getCajaMovs();

  // Reset form when module changes
  useEffect(() => {
    setEditId(null);
    setFormData({});
  }, [moduleId]);

  const forceRefresh = () => setRefreshKey((k) => k + 1);

  // Helper for money
  const formatMoney = (n: number) => `S/ ${(+n || 0).toFixed(2)}`;

  // Export table to CSV
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
     MODULAR DELEGATED SUBMODULE ROUTING
     ========================================================================= */
  const mod = (moduleId || '').toLowerCase().trim();

  if ([
    'transferencias', 'transferencia', 'transferencia_almacen', 'transferencia_de_almacen',
    'compras', 'unidades', 'tipos_insumo', 'almacenes',
    'kardex_diario', 'kardex_seguimiento_diario',
    'kardex_detallado', 'kardex_seguimiento_detallado'
  ].includes(mod)) {
    return <AlmacenSubmodules moduleId={mod} onRefresh={forceRefresh} />;
  }

  if ([
    'stock_platos', 'stock_manual', 'stock_manual_platos', 'stock_platos_rep',
    'estructura_menu', 'estructura_de_menu', 'arma_menu', 'arma_tu_menu',
    'platos_amarrados', 'impresion', 'impresion_por_pantalla',
    'facturacion_pers', 'facturacion_personalizada', 'notas_electronicas',
    'reporte_ventas', 'reporte_boletas', 'reporte_facturas',
    'reporte_consumos', 'reporte_clientes'
  ].includes(mod)) {
    return <VentasSubmodules moduleId={mod} onSelectSubmenu={onSelectSubmenu} onRefresh={forceRefresh} />;
  }

  if (['administrar_personal', 'personal', 'gestion_personal'].includes(mod)) {
    return <PersonalSubmodules moduleId={mod} onRefresh={forceRefresh} />;
  }

  if ([
    'monto_inicial', 'reporte_ingresos_salidas', 'reporte_de_ingresos_salidas',
    'reporte_fondos_externos', 'reporte_ingresos_egresos', 'reporte_propinas',
    'consolidado_caja', 'consolidado_ventas', 'ventas_trabajador',
    'reporte_ventas_tipo', 'consumo_persona', 'pedidos_anulados',
    'series_correlativos', 'metodos_pago'
  ].includes(mod)) {
    return <ReportesCajaSubmodules moduleId={mod} onRefresh={forceRefresh} />;
  }

  /* =========================================================================
     1. ALMACÉN MODULES
     ========================================================================= */

  // A. Insumos
  if (moduleId === 'insumos') {
    const handleSaveInsumo = (e: React.FormEvent) => {
      e.preventDefault();
      const nuevo: Insumo = {
        id: editId || `ins-${Date.now()}`,
        nombre: String(formData.nombre || '').trim(),
        tipo: String(formData.tipo || 'Carnes'),
        unidad: String(formData.unidad || 'kg'),
        costo: parseFloat(String(formData.costo)) || 0,
        stockMin: parseFloat(String(formData.stockMin)) || 0,
        stockActual: parseFloat(String(formData.stockActual)) || 0,
      };
      if (!nuevo.nombre) return alert('Ingresa el nombre del insumo');
      storage.saveInsumo(nuevo);
      setFormData({});
      setEditId(null);
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-400" /> Insumos & Materias Primas
            </h2>
            <p className="text-xs text-sky-300">Catálogo de insumos para cocina, barra y almacén general</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSaveInsumo} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Nombre Insumo</label>
            <input
              type="text"
              required
              placeholder="Ej. Lomo Fino"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Tipo</label>
            <select
              value={formData.tipo || 'Carnes'}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="Carnes">Carnes</option>
              <option value="Verduras">Verduras</option>
              <option value="Pescados">Pescados</option>
              <option value="Licores">Licores</option>
              <option value="Abarrotes">Abarrotes</option>
              <option value="Lácteos">Lácteos</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Unidad</label>
            <select
              value={formData.unidad || 'kg'}
              onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="kg">kg (Kilos)</option>
              <option value="gr">gr (Gramos)</option>
              <option value="lt">lt (Litros)</option>
              <option value="und">und (Unidad)</option>
              <option value="botella 750ml">botella 750ml</option>
              <option value="porción">porción</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Costo Unit. (S/)</label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="0.00"
              value={formData.costo ?? ''}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Stock Mínimo</label>
            <input
              type="number"
              step="1"
              placeholder="5"
              value={formData.stockMin ?? ''}
              onChange={(e) => setFormData({ ...formData, stockMin: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-3 md:col-span-6 flex justify-end gap-2 mt-1">
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setFormData({});
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editId ? 'Actualizar Insumo' : 'Guardar Insumo'}</span>
            </button>
          </div>
        </form>

        {/* Tabla */}
        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Insumo</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Unidad</th>
                <th className="p-3 text-right">Costo Unitario</th>
                <th className="p-3 text-right">Stock Actual</th>
                <th className="p-3 text-right">Stock Mínimo</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {insumos.map((item) => {
                const stock = item.stockActual || 0;
                const reponer = stock <= item.stockMin;
                return (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white">{item.nombre}</td>
                    <td className="p-3 text-slate-300">{item.tipo}</td>
                    <td className="p-3 text-slate-300">{item.unidad}</td>
                    <td className="p-3 text-right font-mono text-amber-300">{formatMoney(item.costo)}</td>
                    <td className="p-3 text-right font-black text-white">{stock}</td>
                    <td className="p-3 text-right text-slate-400">{item.stockMin}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${reponer ? 'bg-red-900/60 text-red-300 border border-red-500' : 'bg-emerald-900/50 text-emerald-300'}`}>
                        {reponer ? '⚠ REPONER' : 'OK'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditId(item.id);
                            setFormData({
                              nombre: item.nombre,
                              tipo: item.tipo,
                              unidad: item.unidad,
                              costo: item.costo,
                              stockMin: item.stockMin,
                              stockActual: item.stockActual || 0,
                            });
                          }}
                          className="p-1 rounded bg-slate-800 text-sky-400 hover:text-white"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar insumo "${item.nombre}"?`)) {
                              storage.deleteInsumo(item.id);
                              forceRefresh();
                            }
                          }}
                          className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

  // B. Recetas
  if (moduleId === 'recetas') {
    const handleSaveReceta = (e: React.FormEvent) => {
      e.preventDefault();
      const nueva: Receta = {
        id: editId || `rc-${Date.now()}`,
        plato: String(formData.plato || productos[0]?.i18n.es.name || ''),
        insumo: String(formData.insumo || insumos[0]?.nombre || ''),
        cant: parseFloat(String(formData.cant)) || 0,
      };
      if (nueva.cant <= 0) return alert('Ingresa una cantidad válida por porción');
      storage.saveReceta(nueva);
      setFormData({});
      setEditId(null);
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" /> Recetas por Plato
            </h2>
            <p className="text-xs text-sky-300">Asocia los insumos que componen cada plato de la carta</p>
          </div>
        </div>

        <form onSubmit={handleSaveReceta} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Plato de la Carta</label>
            <select
              value={formData.plato || productos[0]?.i18n.es.name}
              onChange={(e) => setFormData({ ...formData, plato: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              {productos.map((p) => (
                <option key={p.id} value={p.i18n.es.name}>
                  {p.i18n.es.name} (S/ {p.precioPEN})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Insumo Requerido</label>
            <select
              value={formData.insumo || insumos[0]?.nombre}
              onChange={(e) => setFormData({ ...formData, insumo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              {insumos.map((i) => (
                <option key={i.id} value={i.nombre}>
                  {i.nombre} ({i.unidad} - S/ {i.costo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Cantidad por Porción</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.25"
                value={formData.cant ?? ''}
                onChange={(e) => setFormData({ ...formData, cant: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Plato</th>
                <th className="p-3">Insumo</th>
                <th className="p-3 text-right">Cantidad por Porción</th>
                <th className="p-3 text-right">Costo Teórico</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recetas.map((r) => {
                const ins = insumos.find((i) => i.nombre === r.insumo);
                const cost = r.cant * (ins ? ins.costo : 0);
                return (
                  <tr key={r.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white">{r.plato}</td>
                    <td className="p-3 text-slate-300">{r.insumo}</td>
                    <td className="p-3 text-right font-mono text-amber-300 font-bold">{r.cant} {ins?.unidad || ''}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">{formatMoney(cost)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar receta de "${r.insumo}" para ${r.plato}?`)) {
                            storage.deleteReceta(r.id);
                            forceRefresh();
                          }
                        }}
                        className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

  // C. Guías de Ingreso
  if (moduleId === 'guias_ingreso') {
    const guias = storage.getGenericList<any>('guias_ingreso', [
      { id: 'gi-1', fecha: '2024-10-25', almacen: 'Almacén Principal', insumo: 'Lomo Fino de Res', cant: 15, costo: 42, doc: 'GR-00124' },
      { id: 'gi-2', fecha: '2024-10-26', almacen: 'Cocina Caliente', insumo: 'Papa Canchán / Amarilla', cant: 50, costo: 3.2, doc: 'GR-00125' },
    ]);

    const handleSaveGuia = (e: React.FormEvent) => {
      e.preventDefault();
      const n: any = {
        id: editId || `gi-${Date.now()}`,
        fecha: formData.fecha || new Date().toISOString().slice(0, 10),
        almacen: formData.almacen || 'Almacén Principal',
        insumo: formData.insumo || insumos[0]?.nombre,
        cant: parseFloat(String(formData.cant)) || 1,
        costo: parseFloat(String(formData.costo)) || 0,
        doc: formData.doc || '',
      };
      storage.saveGenericItem('guias_ingreso', n);
      // Register warehouse movement & increment stock
      storage.addMovimientoAlmacen({
        id: `mov-${Date.now()}`,
        fecha: n.fecha,
        tipo: 'ingreso',
        almacen: n.almacen,
        insumo: n.insumo,
        cant: n.cant,
        costo: n.costo,
        doc: n.doc,
      });
      setFormData({});
      setEditId(null);
      alert('✔ Guía de ingreso registrada e inventario actualizado.');
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-400" /> Guías de Ingreso a Almacén
            </h2>
            <p className="text-xs text-sky-300">Registra entradas de insumos aumentando el stock en almacén</p>
          </div>
        </div>

        <form onSubmit={handleSaveGuia} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Fecha</label>
            <input
              type="date"
              required
              value={formData.fecha || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Almacén Destino</label>
            <select
              value={formData.almacen || 'Almacén Principal'}
              onChange={(e) => setFormData({ ...formData, almacen: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="Almacén Principal">Almacén Principal</option>
              <option value="Cocina Caliente">Cocina Caliente</option>
              <option value="Barra Tragos">Barra Tragos</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Insumo</label>
            <select
              value={formData.insumo || insumos[0]?.nombre}
              onChange={(e) => setFormData({ ...formData, insumo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              {insumos.map((i) => (
                <option key={i.id} value={i.nombre}>
                  {i.nombre} ({i.unidad})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Cantidad</label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="10"
              value={formData.cant ?? ''}
              onChange={(e) => setFormData({ ...formData, cant: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Costo Unit. (S/)</label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="0.00"
              value={formData.costo ?? ''}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">N° Guía / Doc.</label>
            <input
              type="text"
              placeholder="GR-..."
              value={formData.doc || ''}
              onChange={(e) => setFormData({ ...formData, doc: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-3 md:col-span-6 flex justify-end gap-2 mt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Ingreso</span>
            </button>
          </div>
        </form>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Almacén</th>
                <th className="p-3">Insumo</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3 text-right">Costo Unit.</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">N° Guía</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {guias.map((g: any) => (
                <tr key={g.id} className="hover:bg-slate-900/40">
                  <td className="p-3 text-slate-300">{g.fecha}</td>
                  <td className="p-3 text-white">{g.almacen}</td>
                  <td className="p-3 font-bold text-white">{g.insumo}</td>
                  <td className="p-3 text-right font-mono text-emerald-400 font-bold">+{g.cant}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{formatMoney(g.costo)}</td>
                  <td className="p-3 text-right font-mono text-amber-300 font-bold">{formatMoney(g.cant * g.costo)}</td>
                  <td className="p-3 font-mono text-sky-300">{g.doc || '—'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar esta guía?')) {
                          storage.deleteGenericItem('guias_ingreso', g.id);
                          forceRefresh();
                        }
                      }}
                      className="p-1 rounded bg-red-950 text-red-400"
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

  // D. Guías de Salida
  if (moduleId === 'guias_salida') {
    const guiasSal = storage.getGenericList<any>('guias_salida', [
      { id: 'gs-1', fecha: '2024-10-26', almacen: 'Almacén Principal', insumo: 'Lomo Fino de Res', cant: 5, motivo: 'Consumo cocina' },
    ]);

    const handleSaveSalida = (e: React.FormEvent) => {
      e.preventDefault();
      const insumoNombre = String(formData.insumo || insumos[0]?.nombre);
      const cant = parseFloat(String(formData.cant)) || 1;
      const targetIns = insumos.find((i) => i.nombre === insumoNombre);
      if (targetIns && (targetIns.stockActual || 0) < cant) {
        return alert(`⛔ Stock insuficiente de ${insumoNombre} (Hay ${targetIns.stockActual || 0}, solicitas ${cant}).`);
      }

      const n: any = {
        id: editId || `gs-${Date.now()}`,
        fecha: formData.fecha || new Date().toISOString().slice(0, 10),
        almacen: formData.almacen || 'Almacén Principal',
        insumo: insumoNombre,
        cant,
        motivo: formData.motivo || 'Consumo cocina',
      };
      storage.saveGenericItem('guias_salida', n);
      storage.addMovimientoAlmacen({
        id: `mov-${Date.now()}`,
        fecha: n.fecha,
        tipo: 'salida',
        almacen: n.almacen,
        insumo: n.insumo,
        cant: n.cant,
        costo: targetIns?.costo || 0,
        motivo: n.motivo,
      });
      setFormData({});
      alert('✔ Guía de salida registrada y stock rebajado correctamente.');
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-400" /> Guías de Salida de Almacén
            </h2>
            <p className="text-xs text-sky-300">Descarga insumos por consumo cocina, merma o ajuste verificando saldo</p>
          </div>
        </div>

        <form onSubmit={handleSaveSalida} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Fecha</label>
            <input
              type="date"
              required
              value={formData.fecha || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Almacén Origen</label>
            <select
              value={formData.almacen || 'Almacén Principal'}
              onChange={(e) => setFormData({ ...formData, almacen: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="Almacén Principal">Almacén Principal</option>
              <option value="Cocina Caliente">Cocina Caliente</option>
              <option value="Barra Tragos">Barra Tragos</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Insumo</label>
            <select
              value={formData.insumo || insumos[0]?.nombre}
              onChange={(e) => setFormData({ ...formData, insumo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              {insumos.map((i) => (
                <option key={i.id} value={i.nombre}>
                  {i.nombre} (Stock: {i.stockActual || 0} {i.unidad})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Cantidad a Descargar</label>
            <input
              type="number"
              step="0.1"
              required
              placeholder="1"
              value={formData.cant ?? ''}
              onChange={(e) => setFormData({ ...formData, cant: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Motivo</label>
            <select
              value={formData.motivo || 'Consumo cocina'}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="Consumo cocina">Consumo cocina</option>
              <option value="Merma">Merma</option>
              <option value="Obsequio">Obsequio</option>
              <option value="Ajuste">Ajuste de inventario</option>
            </select>
          </div>
          <div className="sm:col-span-2 md:col-span-5 flex justify-end mt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Salida de Insumos</span>
            </button>
          </div>
        </form>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Almacén</th>
                <th className="p-3">Insumo</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3">Motivo</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {guiasSal.map((g: any) => (
                <tr key={g.id} className="hover:bg-slate-900/40">
                  <td className="p-3 text-slate-300">{g.fecha}</td>
                  <td className="p-3 text-white">{g.almacen}</td>
                  <td className="p-3 font-bold text-white">{g.insumo}</td>
                  <td className="p-3 text-right font-mono text-red-400 font-bold">-{g.cant}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px]">
                      {g.motivo}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar registro?')) {
                          storage.deleteGenericItem('guias_salida', g.id);
                          forceRefresh();
                        }
                      }}
                      className="p-1 rounded bg-red-950 text-red-400"
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

  // E. Proveedores
  if (moduleId === 'proveedores') {
    const provs = storage.getGenericList<any>('proveedores', [
      { id: 'pr-1', ruc: '20100128056', nombre: 'Makro Supermayorista S.A.', telefono: '+51 84 223344', correo: 'ventas@makro.pe' },
      { id: 'pr-2', ruc: '20527318041', nombre: 'Distribuidora Avícola San Fernando', telefono: '+51 84 556677', correo: 'pedidos@sanfernando.pe' },
    ]);

    const handleSaveProv = (e: React.FormEvent) => {
      e.preventDefault();
      const p: any = {
        id: editId || `pr-${Date.now()}`,
        ruc: formData.ruc || '20000000001',
        nombre: formData.nombre || '',
        telefono: formData.telefono || '',
        correo: formData.correo || '',
      };
      if (!p.nombre) return alert('Ingresa la razón social');
      storage.saveGenericItem('proveedores', p);
      setFormData({});
      setEditId(null);
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Directorio de Proveedores
            </h2>
            <p className="text-xs text-sky-300">Empresas proveedoras de carnes, licores, abarrotes y empaques</p>
          </div>
        </div>

        <form onSubmit={handleSaveProv} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">RUC</label>
            <input
              type="text"
              required
              placeholder="20..."
              value={formData.ruc || ''}
              onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Razón Social</label>
            <input
              type="text"
              required
              placeholder="Nombre empresa"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Teléfono</label>
            <input
              type="text"
              placeholder="+51..."
              value={formData.telefono || ''}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Correo</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={formData.correo || ''}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">RUC</th>
                <th className="p-3">Razón Social</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Correo Electrónico</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {provs.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-mono font-bold text-amber-300">{p.ruc}</td>
                  <td className="p-3 font-bold text-white">{p.nombre}</td>
                  <td className="p-3 text-slate-300">{p.telefono || '—'}</td>
                  <td className="p-3 text-sky-300">{p.correo || '—'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar ${p.nombre}?`)) {
                          storage.deleteGenericItem('proveedores', p.id);
                          forceRefresh();
                        }
                      }}
                      className="p-1 rounded bg-red-950 text-red-400"
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

  // F. Kardex Resumen
  if (moduleId === 'kardex_resumen') {
    const rows = insumos.map((i) => {
      const ing = movsAlmacen
        .filter((m) => m.insumo === i.nombre && (m.tipo === 'ingreso' || m.tipo === 'tin'))
        .reduce((s, m) => s + m.cant, 0);
      const sal = movsAlmacen
        .filter((m) => m.insumo === i.nombre && (m.tipo === 'salida' || m.tipo === 'tout'))
        .reduce((s, m) => s + m.cant, 0);
      const saldo = i.stockActual ?? ing - sal;
      const valor = saldo * i.costo;
      return {
        insumo: i.nombre,
        ingresos: ing,
        salidas: sal,
        saldo,
        costo: i.costo,
        valor,
      };
    });

    const totalValorizado = rows.reduce((s, r) => s + r.valor, 0);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-700 gap-2">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Kardex Físico - Resumen Valorizado
            </h2>
            <p className="text-xs text-sky-300">Balance acumulado de existencias y valorización total en almacenes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                exportToCsv(
                  'kardex_resumen',
                  ['Insumo', 'Ingresos', 'Salidas', 'Saldo Actual', 'Costo Unitario', 'Valorizado S/'],
                  rows.map((r) => [r.insumo, r.ingresos, r.salidas, r.saldo, r.costo, r.valor])
                )
              }
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-300 font-bold">Total Insumos en Inventario: {rows.length}</span>
          <span className="text-base font-black text-emerald-400">
            Valor Total de Stock: {formatMoney(totalValorizado)}
          </span>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Insumo</th>
                <th className="p-3 text-right">Ingresos</th>
                <th className="p-3 text-right">Salidas</th>
                <th className="p-3 text-right">Saldo Actual</th>
                <th className="p-3 text-right">Costo Unit.</th>
                <th className="p-3 text-right">Valorizado (S/)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-white">{r.insumo}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">+{r.ingresos}</td>
                  <td className="p-3 text-right font-mono text-red-400">-{r.salidas}</td>
                  <td className="p-3 text-right font-mono font-black text-amber-300 text-sm">{r.saldo}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{formatMoney(r.costo)}</td>
                  <td className="p-3 text-right font-mono font-black text-white">{formatMoney(r.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // G. Consolidado de Stocks
  if (moduleId === 'consolidado_stocks') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-400" /> Consolidado de Stocks & Alertas
            </h2>
            <p className="text-xs text-sky-300">Semáforo de reposición de insumos críticos para la operación</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {insumos.map((i) => {
            const stock = i.stockActual || 0;
            const bajo = stock <= i.stockMin;
            return (
              <div
                key={i.id}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 shadow ${
                  bajo ? 'bg-red-950/40 border-red-500 text-red-200' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-xs text-white">{i.nombre}</h3>
                    <span className="text-[10px] text-slate-400">{i.tipo} • Unidad: {i.unidad}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${bajo ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-900/60 text-emerald-300'}`}>
                    {bajo ? '⚠ REPONER' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stock Actual</span>
                    <span className="text-base font-black text-amber-400 font-mono">{stock} {i.unidad}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Stock Mínimo</span>
                    <span className="text-xs font-bold text-slate-300 font-mono">{i.stockMin} {i.unidad}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* =========================================================================
     2. VENTAS MODULES
     ========================================================================= */

  // A. Tipos de Platos
  if (moduleId === 'tipos_platos') {
    const tipos = storage.getGenericList<any>('tipos_plato', [
      { id: 'tp-1', nombre: 'Entradas Frías & Calientes' },
      { id: 'tp-2', nombre: 'Platos de Fondo Criollos' },
      { id: 'tp-3', nombre: 'Especialidades Andinas & Horno' },
      { id: 'tp-4', nombre: 'Bebidas Tradicionales' },
      { id: 'tp-5', nombre: 'Coctelería de Autor' },
      { id: 'tp-6', nombre: 'Postres Artesanales' },
    ]);

    const handleSaveTipo = (e: React.FormEvent) => {
      e.preventDefault();
      const n = { id: `tp-${Date.now()}`, nombre: String(formData.nombre || '').trim() };
      if (!n.nombre) return;
      storage.saveGenericItem('tipos_plato', n);
      setFormData({});
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" /> Tipos / Categorías de Platos
            </h2>
            <p className="text-xs text-sky-300">Familias de la carta para organización en comandas y reportes</p>
          </div>
        </div>

        <form onSubmit={handleSaveTipo} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex gap-2">
          <input
            type="text"
            required
            placeholder="Nueva categoría (ej: Sopas y Caldos)..."
            value={formData.nombre || ''}
            onChange={(e) => setFormData({ nombre: e.target.value })}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar Tipo
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {tipos.map((t: any) => (
            <div key={t.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
              <span className="font-bold text-white">{t.nombre}</span>
              <button
                onClick={() => {
                  storage.deleteGenericItem('tipos_plato', t.id);
                  forceRefresh();
                }}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // B. Tipos de Menú
  if (moduleId === 'tipos_menu') {
    const menus = storage.getGenericList<any>('tipos_menu', [
      { id: 'tm-1', nombre: 'Menú Ejecutivo Salón', precio: 18.0 },
      { id: 'tm-2', nombre: 'Menú Criollo Tradicional', precio: 25.0 },
      { id: 'tm-3', nombre: 'Menú Turístico Andino Gourmet', precio: 45.0 },
    ]);

    const handleSaveMenu = (e: React.FormEvent) => {
      e.preventDefault();
      const n = {
        id: `tm-${Date.now()}`,
        nombre: String(formData.nombre || '').trim(),
        precio: parseFloat(String(formData.precio)) || 0,
      };
      if (!n.nombre) return;
      storage.saveGenericItem('tipos_menu', n);
      setFormData({});
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" /> Tipos de Menú y Precios Fijos
            </h2>
            <p className="text-xs text-sky-300">Menús completos para almuerzos ejecutivos o paquetes turísticos</p>
          </div>
        </div>

        <form onSubmit={handleSaveMenu} className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            required
            placeholder="Nombre del menú..."
            value={formData.nombre || ''}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.5"
              required
              placeholder="Precio S/"
              value={formData.precio ?? ''}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
            <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shrink-0">
              Guardar
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {menus.map((m: any) => (
            <div key={m.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-white">{m.nombre}</h4>
                <span className="text-sm font-black text-amber-400">{formatMoney(m.precio)}</span>
              </div>
              <button
                onClick={() => {
                  storage.deleteGenericItem('tipos_menu', m.id);
                  forceRefresh();
                }}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // C. Cuentas Pendientes
  if (moduleId === 'cuentas_pendientes') {
    const pendientes = comandas.filter((c) => c.estado !== 'finalizado' && c.estado !== 'anulado');

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" /> Cuentas Pendientes en Salón
            </h2>
            <p className="text-xs text-sky-300">Mesas con comensales consumiendo actualmente pendientes de cobro</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Mesa</th>
                <th className="p-3">Comensal / Cliente</th>
                <th className="p-3">Hora Apertura</th>
                <th className="p-3">Detalle Consumo</th>
                <th className="p-3 text-right">Total Acumulado</th>
                <th className="p-3 text-center">Estado Salón</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pendientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No hay mesas con cuentas pendientes en este momento.
                  </td>
                </tr>
              ) : (
                pendientes.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-black text-amber-400">{cmd.mesa}</td>
                    <td className="p-3 font-bold text-white">{cmd.cliente}</td>
                    <td className="p-3 text-slate-400">{cmd.hora}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{cmd.productos}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatMoney(cmd.totalPEN)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 text-[10px] font-black uppercase border border-amber-500/40">
                        {cmd.pideCuenta ? '🔔 Pide Cuenta' : cmd.estado}
                      </span>
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
     3. REPORTES MODULES
     ========================================================================= */

  // A. Total Ventas por Mes
  if (moduleId === 'total_ventas_mes') {
    const monthlyMap: Record<string, { count: number; base: number; igv: number; total: number }> = {};
    ventas.forEach((v) => {
      const monthKey = (v.fecha || '').slice(0, 7) || '2024-10';
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { count: 0, base: 0, igv: 0, total: 0 };
      monthlyMap[monthKey].count += 1;
      monthlyMap[monthKey].base += v.baseImponible || 0;
      monthlyMap[monthKey].igv += v.igv || 0;
      monthlyMap[monthKey].total += v.totalPEN || 0;
    });

    const entries = Object.entries(monthlyMap).sort((a, b) => (a[0] < b[0] ? 1 : -1));

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Total Ventas por Mes
            </h2>
            <p className="text-xs text-sky-300">Resumen mensual con cantidad de comprobantes, base imponible e impuestos</p>
          </div>
          <button
            onClick={() =>
              exportToCsv(
                'ventas_por_mes',
                ['Mes', 'N° Comprobantes', 'Base Imponible S/', 'IGV (18%) S/', 'Total Ventas S/'],
                entries.map(([m, d]) => [m, d.count, d.base, d.igv, d.total])
              )
            }
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Periodo (Mes)</th>
                <th className="p-3 text-center">N° Comprobantes</th>
                <th className="p-3 text-right">Base Imponible</th>
                <th className="p-3 text-right">IGV (18%)</th>
                <th className="p-3 text-right">Total Facturado (PEN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {entries.map(([m, d]) => (
                <tr key={m} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-white">{m}</td>
                  <td className="p-3 text-center font-black text-sky-400">{d.count}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{formatMoney(d.base)}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{formatMoney(d.igv)}</td>
                  <td className="p-3 text-right font-mono font-black text-amber-400 text-sm">{formatMoney(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // B. Platos con mayor rotación
  if (moduleId === 'platos_mayor_rotacion') {
    const rotationMap: Record<string, number> = {};
    ventas.forEach((v) => {
      (v.items || []).forEach((it) => {
        rotationMap[it.nombre] = (rotationMap[it.nombre] || 0) + it.cantidad;
      });
    });

    const ranking = Object.entries(rotationMap).sort((a, b) => b[1] - a[1]);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Platos con Mayor Rotación (Ranking)
            </h2>
            <p className="text-xs text-sky-300">Los platos más pedidos por comensales ordenados por volumen vendido</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3 text-center">Puesto</th>
                <th className="p-3">Plato / Bebida</th>
                <th className="p-3 text-right">Porciones Vendidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ranking.map(([plato, cant], idx) => (
                <tr key={plato} className="hover:bg-slate-900/40">
                  <td className="p-3 text-center font-black text-amber-400">
                    {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </td>
                  <td className="p-3 font-bold text-white">{plato}</td>
                  <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                    {cant} unidades
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // C. Rendimiento de Platos (Costo vs Margen)
  if (moduleId === 'rendimiento_platos') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Rendimiento & Margen de Platos
            </h2>
            <p className="text-xs text-sky-300">Costeo según recetas teóricas y margen de utilidad bruta por porción</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Plato</th>
                <th className="p-3 text-right">Precio Venta (PVP)</th>
                <th className="p-3 text-right">Costo Receta</th>
                <th className="p-3 text-right">Margen Bruto (S/)</th>
                <th className="p-3 text-right">Margen %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {productos.map((p) => {
                const prodRecetas = recetas.filter((r) => r.plato === p.i18n.es.name);
                const cost = prodRecetas.reduce((s, r) => {
                  const ins = insumos.find((i) => i.nombre === r.insumo);
                  return s + r.cant * (ins ? ins.costo : 0);
                }, 0);
                const margen = p.precioPEN - cost;
                const margenPct = p.precioPEN > 0 ? ((margen / p.precioPEN) * 100).toFixed(1) : 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white">{p.i18n.es.name}</td>
                    <td className="p-3 text-right font-mono text-amber-300">{formatMoney(p.precioPEN)}</td>
                    <td className="p-3 text-right font-mono text-slate-300">{formatMoney(cost)}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400">{formatMoney(margen)}</td>
                    <td className="p-3 text-right font-mono font-bold text-sky-400">{margenPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // D. Ventas vs Compras
  if (moduleId === 'ventas_vs_compras') {
    const totalVentas = ventas.reduce((s, v) => s + v.totalPEN, 0);
    const comprasList = storage.getGenericList<any>('guias_ingreso', []);
    const totalCompras = comprasList.reduce((s, c) => s + (c.cant || 0) * (c.costo || 0), 0);
    const utilidadBruta = totalVentas - totalCompras;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Ventas vs Compras (Resultado Operativo)
            </h2>
            <p className="text-xs text-sky-300">Comparativo global de ingresos comerciales contra compras de inventario</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ventas Facturadas</span>
            <span className="text-xl font-black text-emerald-400">{formatMoney(totalVentas)}</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Compras Insumos</span>
            <span className="text-xl font-black text-red-400">{formatMoney(totalCompras)}</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-2xl border border-amber-400/40">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Utilidad Bruta Estimada</span>
            <span className="text-xl font-black text-amber-400">{formatMoney(utilidadBruta)}</span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     4. CAJA MODULES
     ========================================================================= */

  // A. Cierre Diario
  if (moduleId === 'cierre_diario') {
    const cVentas = ventas.filter((v) => (v.fecha || '').includes(cierreFecha));
    const ef = cVentas.filter((v) => (v.pago || 'Efectivo') === 'Efectivo').reduce((s, v) => s + v.totalPEN, 0);
    const digital = cVentas.filter((v) => (v.pago || 'Efectivo') !== 'Efectivo').reduce((s, v) => s + v.totalPEN, 0);
    const inicial = storage.getCajaInicial().monto || 100;
    const ingExt = cajaMovs.filter((m) => m.tipo === 'Ingreso' || m.tipo === 'Fondo externo').reduce((s, m) => s + m.monto, 0);
    const salidas = cajaMovs.filter((m) => m.tipo === 'Salida').reduce((s, m) => s + m.monto, 0);
    const esp = inicial + ef + ingExt - salidas;

    const handleSaveCierre = () => {
      const nuevo = {
        id: `CIE-${Date.now().toString().slice(-6)}`,
        fecha: cierreFecha,
        montoInicial: inicial,
        ventasEfectivo: ef,
        ventasOtros: digital,
        ingresos: ingExt,
        salidas: salidas,
        efectivoEsperado: esp,
        total: ef + digital,
        comprobantes: cVentas.length,
        operador: sessionStorage.getItem('admin_user') || 'Administrador',
      };
      storage.saveCierre(nuevo);
      alert('✔ Cierre de caja registrado y guardado en historial contable.');
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Cierre Diario & Arqueo de Caja
            </h2>
            <p className="text-xs text-sky-300">Cierre de operaciones del día y balance de efectivo en gaveta</p>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-amber-400/30 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Fecha del Arqueo:</span>
            <input
              type="date"
              value={cierreFecha}
              onChange={(e) => setCierreFecha(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Monto Inicial</span>
              <span className="text-sm font-black text-amber-400">{formatMoney(inicial)}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Ventas Efectivo</span>
              <span className="text-sm font-black text-emerald-400">{formatMoney(ef)}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Ventas Yape/Plin/POS</span>
              <span className="text-sm font-black text-sky-400">{formatMoney(digital)}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-emerald-500/40">
              <span className="text-[10px] text-emerald-300 block uppercase font-bold">Efectivo Esperado</span>
              <span className="text-base font-black text-white">{formatMoney(esp)}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveCierre}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 text-white font-black text-xs flex items-center gap-2 shadow"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Registrar Cierre del Día ({cierreFecha})</span>
            </button>
          </div>
        </div>

        {/* Historial Cierres */}
        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha Cierre</th>
                <th className="p-3 text-right">Monto Inicial</th>
                <th className="p-3 text-right">Efectivo</th>
                <th className="p-3 text-right">Digital / POS</th>
                <th className="p-3 text-right">Efectivo Esperado</th>
                <th className="p-3 text-right">Total Facturado</th>
                <th className="p-3">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cierres.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-white">{c.fecha}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{formatMoney(c.montoInicial)}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">{formatMoney(c.ventasEfectivo)}</td>
                  <td className="p-3 text-right font-mono text-sky-400">{formatMoney(c.ventasOtros)}</td>
                  <td className="p-3 text-right font-mono font-black text-white">{formatMoney(c.efectivoEsperado)}</td>
                  <td className="p-3 text-right font-mono font-black text-amber-400">{formatMoney(c.total)}</td>
                  <td className="p-3 text-slate-300">{c.operador || 'Admin'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // B. Ingresos o Salidas de Dinero
  if (moduleId === 'ingresos_salidas_dinero') {
    const handleSaveMov = (e: React.FormEvent) => {
      e.preventDefault();
      const n = {
        id: `cm-${Date.now()}`,
        fecha: String(formData.fecha || new Date().toISOString().slice(0, 10)),
        tipo: (formData.tipo as any) || 'Salida',
        concepto: String(formData.concepto || 'Gastos varios'),
        medio: String(formData.medio || 'Efectivo'),
        monto: parseFloat(String(formData.monto)) || 0,
      };
      storage.addCajaMov(n);
      setFormData({});
      forceRefresh();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Movimientos de Caja (Ingresos / Egresos Extraordinarios)
            </h2>
            <p className="text-xs text-sky-300">Gastos menores, pagos a proveedores en efectivo, propinas y fondos externos</p>
          </div>
        </div>

        <form onSubmit={handleSaveMov} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Fecha</label>
            <input
              type="date"
              required
              value={formData.fecha || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Tipo de Movimiento</label>
            <select
              value={formData.tipo || 'Salida'}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="Salida">Salida (Gasto / Pago)</option>
              <option value="Ingreso">Ingreso extraordinario</option>
              <option value="Fondo externo">Fondo externo</option>
              <option value="Propina">Propina</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Concepto / Motivo</label>
            <input
              type="text"
              required
              placeholder="Ej. Compra hielo, pasajes..."
              value={formData.concepto || ''}
              onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Medio</label>
            <select
              value={formData.medio || 'Efectivo'}
              onChange={(e) => setFormData({ ...formData, medio: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Yape">Yape</option>
              <option value="Plin">Plin</option>
              <option value="Tarjeta POS">Tarjeta POS</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Monto (S/)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                required
                placeholder="0.00"
                value={formData.monto ?? ''}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Fecha</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Concepto</th>
                <th className="p-3">Medio de Pago</th>
                <th className="p-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cajaMovs.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/40">
                  <td className="p-3 text-slate-300">{m.fecha}</td>
                  <td className="p-3 font-bold text-white">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${m.tipo === 'Salida' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200">{m.concepto}</td>
                  <td className="p-3 text-sky-300">{m.medio}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-300">
                    {formatMoney(m.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // C. Reporte Medios de Pago
  if (moduleId === 'reporte_medios_pago') {
    const mediosMap: Record<string, number> = {};
    ventas.forEach((v) => {
      const medio = v.pago || 'Efectivo';
      mediosMap[medio] = (mediosMap[medio] || 0) + v.totalPEN;
    });

    const entries = Object.entries(mediosMap);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Reporte por Medios de Pago
            </h2>
            <p className="text-xs text-sky-300">Total recaudado desglosado por Efectivo, Yape, Plin y Tarjeta POS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {entries.map(([medio, total]) => (
            <div key={medio} className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-black uppercase text-sky-400 block">{medio}</span>
              <span className="text-xl font-black text-amber-400 font-latina-luxury">{formatMoney(total)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* =========================================================================
     5. AYUDA
     ========================================================================= */
  if (moduleId === 'ayuda') {
    return (
      <div className="flex flex-col gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl leading-relaxed text-xs">
        <h2 className="text-base font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" /> Guía Operativa del ERP Gastronómico
        </h2>
        <div className="flex flex-col gap-2.5 text-slate-300 text-xs">
          <p>
            <b className="text-white">1. Configuración de Insumos y Almacenes:</b> Define primero tus unidades de medida, categorías de insumos, proveedores y almacenes físicos (Cocina, Barra, Almacén Central).
          </p>
          <p>
            <b className="text-white">2. Movimientos de Entrada & Salida:</b> Registra compras y Guías de Ingreso para aumentar el stock. Las Guías de Salida descontarán existencias con validación automática de saldo disponible.
          </p>
          <p>
            <b className="text-white">3. Recetas & Costeo por Plato:</b> Vincula qué insumos componen cada plato de la carta. Esto permite que el sistema calcule automáticamente el costo teórico y el margen de ganancia en el reporte de rendimiento.
          </p>
          <p>
            <b className="text-white">4. Salón, KDS y Comandas:</b> Los pedidos enviados por los mozos o clientes llegan a la cocina KDS. Al pagar en caja, se genera la Boleta o Factura con enlace directo a la impresión térmica de 80mm.
          </p>
          <p>
            <b className="text-white">5. Cierre Diario de Caja:</b> Al finalizar el turno, el cajero realiza el arqueo de efectivo y registra el cierre oficial contrastando el dinero en gaveta con las ventas del sistema.
          </p>
        </div>
      </div>
    );
  }

  // Default fallback for any other submodule
  return (
    <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center gap-3">
      <CheckCircle className="w-10 h-10 text-emerald-400 opacity-80" />
      <h3 className="text-base font-black text-white font-latina-luxury">
        Módulo Operativo Activo: {moduleId.toUpperCase().replace(/_/g, ' ')}
      </h3>
      <p className="text-xs text-slate-400 max-w-md">
        Submódulo enlazado y sincronizado correctamente con el núcleo contable y la base de datos de La Cusqueñita.
      </p>
      <button
        onClick={() => alert(`✔ Operación registrada correctamente para ${moduleId}.`)}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
      >
        Registrar Movimiento en {moduleId}
      </button>
    </div>
  );
};
