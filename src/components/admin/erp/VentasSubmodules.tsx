import React, { useState } from 'react';
import {
  SlidersHorizontal,
  LayoutGrid,
  UtensilsCrossed,
  Link2,
  Printer,
  FileCheck,
  FileText,
  TrendingUp,
  Receipt,
  Building,
  PieChart,
  Users,
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { storage } from '../../../services/storage';
import { Producto, Venta, Comanda } from '../../../types';

interface VentasSubmodulesProps {
  moduleId: string;
  onSelectSubmenu?: (subId: string) => void;
  onRefresh?: () => void;
}

export const VentasSubmodules: React.FC<VentasSubmodulesProps> = ({
  moduleId,
  onSelectSubmenu,
  onRefresh,
}) => {
  const [, setTick] = useState(0);
  const forceUpdate = () => {
    setTick((t) => t + 1);
    if (onRefresh) onRefresh();
  };

  const productos = storage.getProductos();
  const ventas = storage.getVentas();
  const comandas = storage.getComandas();
  const config = storage.getConfig();

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
     1. STOCK MANUAL DE PLATOS
     ========================================================================= */
  if (moduleId === 'stock_platos' || moduleId === 'stock_manual' || moduleId === 'stock_platos_rep') {
    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

    const productosFiltrados = productos.filter((p) => {
      const matchCat = categoriaFiltro === 'todas' || p.category === categoriaFiltro;
      const matchText = p.i18n.es.name.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchText;
    });

    const handleIncrementarStock = (p: Producto, delta: number) => {
      const actual = p.stock ?? 20;
      const nuevo = Math.max(0, actual + delta);
      p.stock = nuevo;
      p.disponible = nuevo > 0;
      storage.saveProducto(p);
      forceUpdate();
    };

    const handleToggleDisponible = (p: Producto) => {
      p.disponible = !p.disponible;
      if (p.disponible && (p.stock || 0) <= 0) {
        p.stock = 10;
      }
      storage.saveProducto(p);
      forceUpdate();
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" /> Stock Manual de Platos
            </h2>
            <p className="text-xs text-sky-300">
              Control de raciones disponibles en cocina, activación rápida y bloqueo automático al agotarse
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                productos.forEach((p) => {
                  p.stock = 25;
                  p.disponible = true;
                  storage.saveProducto(p);
                });
                forceUpdate();
                alert('✔ Stock de todos los platos reseteado a 25 raciones.');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-200 text-xs font-bold"
            >
              Restablecer Todo a 25 Raciones
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar plato por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex gap-2">
            {['todas', 'mains', 'entradas', 'drinks', 'postres'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                  categoriaFiltro === cat ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:text-white'
                }`}
              >
                {cat === 'todas' ? 'Todos' : cat === 'mains' ? 'Platos Fuertes' : cat === 'drinks' ? 'Bebidas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla / Grid de Stock */}
        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Foto</th>
                <th className="p-3">Plato de la Carta</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 text-right">Precio Carta</th>
                <th className="p-3 text-center">Raciones Disponibles</th>
                <th className="p-3 text-center">Ajuste Rápido</th>
                <th className="p-3 text-center">Disponibilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {productosFiltrados.map((p) => {
                const stock = p.stock ?? 20;
                const disp = p.disponible !== false;
                const agotado = !disp || stock <= 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="p-3">
                      <img src={p.posterUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white text-sm">{p.i18n.es.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.i18n.es.desc}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-400">
                      {formatMoney(p.precioPEN || p.precio || 0)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-sm ${
                        agotado ? 'bg-red-950 text-red-400 border border-red-500' : stock <= 5 ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'bg-slate-900 text-emerald-400 border border-slate-700'
                      }`}>
                        {stock} raciones
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                        <button
                          onClick={() => handleIncrementarStock(p, -5)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                          title="-5 raciones"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleIncrementarStock(p, -1)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                          title="-1 ración"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleIncrementarStock(p, 1)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                          title="+1 ración"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleIncrementarStock(p, 5)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                          title="+5 raciones"
                        >
                          +5
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleDisponible(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition ${
                          disp
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 hover:bg-red-950 hover:text-red-300 hover:border-red-500'
                            : 'bg-red-950 text-red-300 border border-red-500/60 hover:bg-emerald-950 hover:text-emerald-300'
                        }`}
                      >
                        {disp ? '🟢 Disponible' : '🔴 Agotado'}
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

  /* =========================================================================
     2. ESTRUCTURA DE MENÚ
     ========================================================================= */
  if (moduleId === 'estructura_menu') {
    const defaultSecciones = [
      { id: 'sec-1', orden: 1, nombre: 'Entradas & Piqueos Andinos', tipo: 'entradas', activo: true },
      { id: 'sec-2', orden: 2, nombre: 'Platos Fuertes & Especialidades', tipo: 'mains', activo: true },
      { id: 'sec-3', orden: 3, nombre: 'Bebidas & Coctelería de Autor', tipo: 'drinks', activo: true },
      { id: 'sec-4', orden: 4, nombre: 'Postres Tradicionales Cusqueños', tipo: 'postres', activo: true },
    ];
    const secciones = storage.getGenericList<any>('estructura_menu', defaultSecciones);

    const handleCrearSeccion = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const nombre = String(data.get('nombre') || '').trim();
      const tipo = String(data.get('tipo') || 'mains');

      if (!nombre) return;

      storage.saveGenericItem('estructura_menu', {
        id: `sec-${Date.now()}`,
        orden: secciones.length + 1,
        nombre,
        tipo,
        activo: true,
      });

      form.reset();
      forceUpdate();
      alert(`✔ Sección "${nombre}" añadida a la estructura del menú.`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-amber-400" /> Estructura del Menú & Carta
            </h2>
            <p className="text-xs text-sky-300">Organización y jerarquía de secciones de la carta digital de comensales y mozos</p>
          </div>
        </div>

        <form onSubmit={handleCrearSeccion} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex gap-3 max-w-xl">
          <input
            type="text"
            name="nombre"
            required
            placeholder="Nombre de sección (ej. Menú Criollo del Día)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <select name="tipo" className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
            <option value="entradas">Entradas</option>
            <option value="mains">Platos Fuertes</option>
            <option value="drinks">Bebidas</option>
            <option value="postres">Postres</option>
          </select>
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow">
            <Plus className="w-3.5 h-3.5" /> Agregar Sección
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secciones.map((sec: any) => {
            const platosEnSec = productos.filter((p) => p.category === sec.tipo);
            return (
              <div key={sec.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Orden #{sec.orden}</span>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar sección "${sec.nombre}"?`)) {
                          storage.deleteGenericItem('estructura_menu', sec.id);
                          forceUpdate();
                        }
                      }}
                      className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">{sec.nombre}</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Tipo de categoría: <b className="text-sky-300">{sec.tipo}</b> ({platosEnSec.length} platos vinculados)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {platosEnSec.slice(0, 5).map((pl) => (
                      <span key={pl.id} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]">
                        {pl.i18n.es.name}
                      </span>
                    ))}
                    {platosEnSec.length > 5 && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 text-[10px]">
                        +{platosEnSec.length - 5} más
                      </span>
                    )}
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
     3. ARMA TU MENÚ / COMBOS EJECUTIVOS
     ========================================================================= */
  if (moduleId === 'arma_menu') {
    const defaultCombos = [
      {
        id: 'cmb-1',
        nombre: 'Menú Ejecutivo Cusqueño',
        entrada: 'Causa Limeña con Trucha',
        fondo: 'Lomo Saltado Criollo',
        bebida: 'Chicha Morada Clásica',
        precio: 28.0,
        activo: true,
      },
      {
        id: 'cmb-2',
        nombre: 'Menú Criollo Tradición',
        entrada: 'Tequeños con Guacamole',
        fondo: 'Ají de Gallina Tradicional',
        bebida: 'Limonada de Hierba Luisa',
        precio: 25.0,
        activo: true,
      },
    ];
    const combos = storage.getGenericList<any>('combos_menu', defaultCombos);

    const handleCrearCombo = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const nombre = String(data.get('nombre') || '').trim();
      const entrada = String(data.get('entrada'));
      const fondo = String(data.get('fondo'));
      const bebida = String(data.get('bebida'));
      const precio = parseFloat(String(data.get('precio'))) || 25;

      if (!nombre) return;

      storage.saveGenericItem('combos_menu', {
        id: `cmb-${Date.now()}`,
        nombre,
        entrada,
        fondo,
        bebida,
        precio,
        activo: true,
      });

      form.reset();
      forceUpdate();
      alert(`✔ Combo "${nombre}" registrado con éxito.`);
    };

    const entradas = productos.filter((p) => p.category === 'entradas');
    const fondos = productos.filter((p) => p.category === 'mains');
    const bebidas = productos.filter((p) => p.category === 'drinks');

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" /> Arma tu Menú / Combos Ejecutivos
            </h2>
            <p className="text-xs text-sky-300">Configuración de paquetes cerrados con Entrada + Plato de Fondo + Bebida a precio especial</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleCrearCombo} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Nombre del Combo</label>
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej. Menú Turístico Andino"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Entrada Incluida</label>
            <select name="entrada" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {entradas.map((e) => (
                <option key={e.id} value={e.i18n.es.name}>{e.i18n.es.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Plato de Fondo</label>
            <select name="fondo" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {fondos.map((f) => (
                <option key={f.id} value={f.i18n.es.name}>{f.i18n.es.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Bebida / Refresco</label>
            <select name="bebida" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {bebidas.map((b) => (
                <option key={b.id} value={b.i18n.es.name}>{b.i18n.es.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Precio Combo (PEN)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                name="precio"
                required
                defaultValue="26.0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {combos.map((c: any) => (
            <div key={c.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-base">{c.nombre}</h3>
                  <span className="text-xl font-black text-amber-400 font-latina-luxury">{formatMoney(c.precio)}</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-slate-300 mt-2">
                  <div>🥗 <b>Entrada:</b> {c.entrada}</div>
                  <div>🍲 <b>Fondo:</b> {c.fondo}</div>
                  <div>🍹 <b>Bebida:</b> {c.bebida}</div>
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar combo "${c.nombre}"?`)) {
                      storage.deleteGenericItem('combos_menu', c.id);
                      forceUpdate();
                    }
                  }}
                  className="p-1 rounded bg-red-950 text-red-400 hover:text-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* =========================================================================
     4. PLATOS AMARRADOS (GUARNICIONES Y ACOMPAÑAMIENTOS VINCULADOS)
     ========================================================================= */
  if (moduleId === 'platos_amarrados') {
    const defaultAmarrados = [
      { id: 'am-1', plato: 'Lomo Saltado Criollo', amarrado: 'Porción de Arroz Blanco', cant: 1, obligatorio: true },
      { id: 'am-2', plato: 'Lomo Saltado Criollo', amarrado: 'Papas Fritas Nativas', cant: 1, obligatorio: true },
      { id: 'am-3', plato: 'Ceviche Clásico de Trucha', amarrado: 'Choclo Desgranado & Camote Glaseado', cant: 1, obligatorio: true },
    ];
    const amarrados = storage.getGenericList<any>('platos_amarrados', defaultAmarrados);

    const handleCrearAmarrado = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const plato = String(data.get('plato'));
      const amarrado = String(data.get('amarrado') || '').trim();
      const cant = parseInt(String(data.get('cant'))) || 1;

      if (!amarrado) return;

      storage.saveGenericItem('platos_amarrados', {
        id: `am-${Date.now()}`,
        plato,
        amarrado,
        cant,
        obligatorio: true,
      });

      form.reset();
      forceUpdate();
      alert(`✔ Acompañamiento "${amarrado}" vinculado a "${plato}".`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Link2 className="w-5 h-5 text-amber-400" /> Platos Amarrados & Guarniciones
            </h2>
            <p className="text-xs text-sky-300">Vinculación de acompañamientos automáticos que deben descontarse al pedir un plato</p>
          </div>
        </div>

        <form onSubmit={handleCrearAmarrado} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Plato Principal</label>
            <select name="plato" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              {productos.map((p) => (
                <option key={p.id} value={p.i18n.es.name}>{p.i18n.es.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Acompañamiento / Guarnición</label>
            <input
              type="text"
              name="amarrado"
              required
              placeholder="Ej. Porción Papa Frita"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Vincular Guarnición
            </button>
          </div>
        </form>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Plato Principal</th>
                <th className="p-3">Guarnición o Complemento Amarrado</th>
                <th className="p-3 text-center">Porciones</th>
                <th className="p-3 text-center">Obligatorio</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {amarrados.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-white">{a.plato}</td>
                  <td className="p-3 font-semibold text-amber-400">{a.amarrado}</td>
                  <td className="p-3 text-center font-mono font-bold text-white">{a.cant}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                      SÍ (Automático)
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`¿Desvincular "${a.amarrado}"?`)) {
                          storage.deleteGenericItem('platos_amarrados', a.id);
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
     5. IMPRESIÓN POR PANTALLA & SPOOLER TÉRMICO
     ========================================================================= */
  if (moduleId === 'impresion') {
    const handleTestPrint = (tipo: string) => {
      alert(`🖨️ Enviando ticket de prueba "${tipo}" a la impresora térmica de 80mm configurada.`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" /> Monitor & Spooler de Impresión por Pantalla
            </h2>
            <p className="text-xs text-sky-300">Gestión de colas de tickets de cocina, pre-cuentas y comprobantes térmicos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Ticket de Cocina (Comanda KDS)</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">Impresora térmica de cocina / KDS (Ancho 80mm). Imprime platos y notas de preparación.</p>
            </div>
            <button
              onClick={() => handleTestPrint('Cocina')}
              className="w-full px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir Ticket Prueba Cocina
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Ticket Pre-cuenta Comensal</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">Para llevar a la mesa antes del cobro formal. Sin validez fiscal.</p>
            </div>
            <button
              onClick={() => handleTestPrint('Pre-cuenta')}
              className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir Pre-cuenta de Prueba
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">Boleta / Factura SUNAT (80mm)</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">Comprobante electrónico con QR oficial, RUC, IGV y firma digital.</p>
            </div>
            <button
              onClick={() => {
                if (onSelectSubmenu) onSelectSubmenu('factura');
              }}
              className="w-full px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> Ir a Diseñador de Boletas / Factura
            </button>
          </div>
        </div>

        {/* Historial de últimos tickets impresos */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <h3 className="text-xs font-black uppercase text-amber-400 mb-2">Últimos Tickets Emitidos por el Sistema</h3>
          <div className="space-y-2">
            {comandas.slice(0, 5).map((c) => (
              <div key={c.id} className="p-2.5 bg-slate-900 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white">{c.mesa}</span> • <span className="text-slate-300">{c.cliente}</span>
                  <div className="text-[11px] text-slate-400">{c.productos}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono text-emerald-400">{formatMoney(c.totalPEN)}</div>
                  <span className="text-[10px] text-slate-400">{c.hora}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     6. FACTURACIÓN PERSONALIZADA
     ========================================================================= */
  if (moduleId === 'facturacion_pers') {
    const [tipo, setTipo] = useState<'Factura' | 'Boleta'>('Factura');
    const [docNumero, setDocNumero] = useState('');
    const [razon, setRazon] = useState('');
    const [direccion, setDireccion] = useState('');
    const [concepto, setConcepto] = useState('Consumo Restaurante La Cusqueñita');
    const [montoTotal, setMontoTotal] = useState<number>(150);

    const base = +(montoTotal / 1.18).toFixed(2);
    const igv = +(montoTotal - base).toFixed(2);

    const handleEmitirPersonalizada = (e: React.FormEvent) => {
      e.preventDefault();
      if (!docNumero || !razon) {
        alert('Ingresa el RUC/DNI y la Razón Social.');
        return;
      }

      const serie = tipo === 'Factura' ? 'F001' : 'B001';
      const correlativo = String(Math.floor(100000 + Math.random() * 900000));
      const nuevaVenta: Venta = {
        id: `v-pers-${Date.now()}`,
        numero: `${serie}-${correlativo}`,
        serie,
        fecha: new Date().toISOString().slice(0, 10),
        mesa: 'Caja Principal / Mostrador',
        cliente: razon,
        productos: concepto,
        items: [{ nombre: concepto, cantidad: 1, precio: montoTotal }],
        baseImponible: base,
        igv,
        totalPEN: montoTotal,
        pago: 'Efectivo / Transferencia',
        tipoComprobante: tipo,
        rucCliente: docNumero,
        razonSocialCliente: razon,
        cajero: 'Administrador General',
      };

      storage.saveVenta(nuevaVenta);
      forceUpdate();
      alert(`✔ ${tipo} Electrónica ${serie}-${correlativo} generada con éxito a nombre de "${razon}".`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" /> Emisión de Facturación Personalizada
            </h2>
            <p className="text-xs text-sky-300">Generación directa de comprobantes electrónicos a empresas o comensales externos</p>
          </div>
        </div>

        <form onSubmit={handleEmitirPersonalizada} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Tipo de Comprobante</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="Factura">🏢 Factura Electrónica (RUC)</option>
              <option value="Boleta">🧾 Boleta de Venta (DNI)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">
              {tipo === 'Factura' ? 'RUC (11 dígitos)' : 'DNI (8 dígitos)'}
            </label>
            <input
              type="text"
              required
              placeholder={tipo === 'Factura' ? '20601234567' : '45871234'}
              value={docNumero}
              onChange={(e) => setDocNumero(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Razón Social o Nombre Completo</label>
            <input
              type="text"
              required
              placeholder="Ej. AGENCIA DE VIAJES ANDINA S.A.C."
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Concepto o Descripción</label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Importe Total (PEN)</label>
            <input
              type="number"
              step="0.5"
              required
              value={montoTotal}
              onChange={(e) => setMontoTotal(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
            />
          </div>

          <div className="sm:col-span-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400">Base Imponible: </span>
              <b className="text-white font-mono">{formatMoney(base)}</b>
            </div>
            <div>
              <span className="text-slate-400">IGV (18%): </span>
              <b className="text-amber-400 font-mono">{formatMoney(igv)}</b>
            </div>
            <div>
              <span className="text-slate-400">Total a Pagar: </span>
              <b className="text-emerald-400 font-mono text-sm">{formatMoney(montoTotal)}</b>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <CheckCircle className="w-4 h-4" /> Emitir {tipo} Electrónica
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* =========================================================================
     7. NOTAS ELECTRÓNICAS (NOTAS DE CRÉDITO Y DÉBITO)
     ========================================================================= */
  if (moduleId === 'notas_electronicas') {
    const defaultNotas = [
      {
        id: 'nc-1',
        tipo: 'Nota de Crédito',
        numero: 'FC01-000012',
        fecha: new Date().toISOString().slice(0, 10),
        docRef: 'B001-000412',
        motivo: 'Anulación de la operación por error en pedido',
        monto: 38.0,
      },
    ];
    const notas = storage.getGenericList<any>('notas_electronicas', defaultNotas);

    const handleCrearNota = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const tipoNota = String(data.get('tipoNota'));
      const docRef = String(data.get('docRef') || '').trim();
      const motivo = String(data.get('motivo'));
      const monto = parseFloat(String(data.get('monto'))) || 0;

      if (!docRef) return alert('Ingresa el comprobante de referencia.');

      const serie = tipoNota.includes('Crédito') ? 'FC01' : 'FD01';
      const corr = String(Math.floor(100000 + Math.random() * 900000));

      storage.saveGenericItem('notas_electronicas', {
        id: `nt-${Date.now()}`,
        tipo: tipoNota,
        numero: `${serie}-${corr}`,
        fecha: new Date().toISOString().slice(0, 10),
        docRef,
        motivo,
        monto,
      });

      form.reset();
      forceUpdate();
      alert(`✔ ${tipoNota} ${serie}-${corr} emitida correctamente.`);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> Notas Electrónicas SUNAT
            </h2>
            <p className="text-xs text-sky-300">Emisión y registro de Notas de Crédito y Débito asociadas a Boletas y Facturas</p>
          </div>
        </div>

        <form onSubmit={handleCrearNota} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Tipo de Nota</label>
            <select name="tipoNota" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              <option value="Nota de Crédito">Nota de Crédito (Anulación / Descuento)</option>
              <option value="Nota de Débito">Nota de Débito (Aumento de valor)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Doc. Referencia (Boleta / Factura)</label>
            <input
              type="text"
              name="docRef"
              required
              placeholder="Ej. B001-000451"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Motivo SUNAT</label>
            <select name="motivo" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              <option value="01 Anulación de la operación">01 Anulación de la operación</option>
              <option value="02 Anulación por error en el RUC">02 Anulación por error en el RUC</option>
              <option value="04 Descuento global">04 Descuento global</option>
              <option value="07 Devolución total">07 Devolución total</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-sky-400 block mb-1">Monto (PEN)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                name="monto"
                required
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Emitir
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
                <th className="p-3">N° Documento</th>
                <th className="p-3">Doc. Referencia</th>
                <th className="p-3">Motivo</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {notas.map((n: any) => (
                <tr key={n.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-mono text-slate-300">{n.fecha}</td>
                  <td className="p-3 font-bold text-amber-400">{n.tipo}</td>
                  <td className="p-3 font-mono font-bold text-sky-400">{n.numero}</td>
                  <td className="p-3 font-mono text-slate-300">{n.docRef}</td>
                  <td className="p-3 text-slate-400">{n.motivo}</td>
                  <td className="p-3 text-right font-mono font-black text-rose-400">{formatMoney(n.monto)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => alert(`🖨️ Imprimiendo ${n.numero}...`)}
                      className="p-1 rounded bg-slate-800 text-sky-400 hover:text-white"
                      title="Imprimir"
                    >
                      <Printer className="w-3.5 h-3.5" />
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
     8. REPORTES DE VENTAS / BOLETAS / FACTURAS
     ========================================================================= */
  if (
    moduleId === 'reporte_ventas' ||
    moduleId === 'reporte_boletas' ||
    moduleId === 'reporte_facturas'
  ) {
    const isSoloBoletas = moduleId === 'reporte_boletas';
    const isSoloFacturas = moduleId === 'reporte_facturas';

    const ventasFiltradas = ventas.filter((v) => {
      if (isSoloBoletas) return v.tipoComprobante?.toLowerCase().includes('boleta');
      if (isSoloFacturas) return v.tipoComprobante?.toLowerCase().includes('factura');
      return true;
    });

    const totalCobrado = ventasFiltradas.reduce((s, v) => s + (v.totalPEN || 0), 0);
    const totalIGV = ventasFiltradas.reduce((s, v) => s + (v.igv || 0), 0);

    const titulo = isSoloBoletas
      ? 'Reporte de Boletas de Venta Electrónicas'
      : isSoloFacturas
      ? 'Reporte de Facturas Electrónicas (Empresas)'
      : 'Reporte General de Ventas & Facturación';

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> {titulo}
            </h2>
            <p className="text-xs text-sky-300">Auditoría contable y consolidado de comprobantes emitidos en caja</p>
          </div>
          <button
            onClick={() =>
              exportToCsv(
                moduleId,
                ['ID', 'Comprobante', 'Fecha', 'Mesa', 'Cliente', 'Doc', 'Pago', 'Base', 'IGV', 'Total PEN'],
                ventasFiltradas.map((v) => [
                  v.id,
                  v.numero,
                  v.fecha,
                  v.mesa,
                  v.razonSocialCliente || v.cliente,
                  v.rucCliente || '',
                  v.pago,
                  v.baseImponible,
                  v.igv,
                  v.totalPEN,
                ])
              )
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Recaudado</span>
            <span className="text-2xl font-black text-emerald-400 font-latina-luxury">{formatMoney(totalCobrado)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total IGV Fiscal (18%)</span>
            <span className="text-2xl font-black text-amber-400 font-latina-luxury">{formatMoney(totalIGV)}</span>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Comprobantes Emitidos</span>
            <span className="text-2xl font-black text-sky-400 font-latina-luxury">{ventasFiltradas.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">Comprobante</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Mesa</th>
                <th className="p-3">Cliente / Razón Social</th>
                <th className="p-3">Medio de Pago</th>
                <th className="p-3 text-right">Base Imp.</th>
                <th className="p-3 text-right">IGV (18%)</th>
                <th className="p-3 text-right font-black text-emerald-400">Total (PEN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No se han registrado ventas bajo este filtro.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-sky-400">{v.numero}</td>
                    <td className="p-3 font-mono text-slate-300">{v.fecha}</td>
                    <td className="p-3 font-semibold text-amber-400">{v.mesa}</td>
                    <td className="p-3 text-white font-medium">
                      {v.razonSocialCliente || v.cliente} {v.rucCliente && <span className="text-[11px] text-slate-400">({v.rucCliente})</span>}
                    </td>
                    <td className="p-3 text-slate-300">{v.pago}</td>
                    <td className="p-3 text-right font-mono text-slate-400">{formatMoney(v.baseImponible)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">{formatMoney(v.igv)}</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">{formatMoney(v.totalPEN)}</td>
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
     9. REPORTE CONSUMOS POR PLATO
     ========================================================================= */
  if (moduleId === 'reporte_consumos') {
    const rankingMap: Record<string, { nombre: string; cant: number; total: number }> = {};
    ventas.forEach((v) => {
      v.items?.forEach((item) => {
        if (!rankingMap[item.nombre]) {
          rankingMap[item.nombre] = { nombre: item.nombre, cant: 0, total: 0 };
        }
        rankingMap[item.nombre].cant += item.cantidad || 1;
        rankingMap[item.nombre].total += (item.precio || 0) * (item.cantidad || 1);
      });
    });

    const ranking = Object.values(rankingMap).sort((a, b) => b.cant - a.cant);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-400" /> Reporte de Consumos & Demanda
            </h2>
            <p className="text-xs text-sky-300">Ranking de platos más pedidos, volumen de salidas e ingresos generados</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3 text-center">Puesto</th>
                <th className="p-3">Plato de la Carta</th>
                <th className="p-3 text-center">Porciones Vendidas</th>
                <th className="p-3 text-right">Total Facturado (PEN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ranking.map((r, i) => (
                <tr key={r.nombre} className="hover:bg-slate-900/40">
                  <td className="p-3 text-center font-bold text-amber-400">#{i + 1}</td>
                  <td className="p-3 font-bold text-white text-sm">{r.nombre}</td>
                  <td className="p-3 text-center font-mono font-black text-white">{r.cant} unidades</td>
                  <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">{formatMoney(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* =========================================================================
     10. REPORTE DE CLIENTES & FIDELIZACIÓN
     ========================================================================= */
  if (moduleId === 'reporte_clientes') {
    const socios = storage.getSocios();

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Reporte de Clientes & Club de Fidelidad
            </h2>
            <p className="text-xs text-sky-300">Historial de clientes frecuentes, visitas acumuladas y canjes de premios</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <th className="p-3">DNI</th>
                <th className="p-3">Nombre del Cliente</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3 text-center">Total Visitas</th>
                <th className="p-3 text-center">Sellos Acumulados</th>
                <th className="p-3 text-center">Estado Premio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {socios.map((s) => (
                <tr key={s.dni} className="hover:bg-slate-900/40">
                  <td className="p-3 font-mono font-bold text-amber-400">{s.dni}</td>
                  <td className="p-3 font-bold text-white">{s.nombre}</td>
                  <td className="p-3 text-slate-300">{s.telefono || 'Sin teléfono'}</td>
                  <td className="p-3 text-center font-mono font-bold text-white">{s.totalVisitas}</td>
                  <td className="p-3 text-center font-mono font-bold text-sky-400">{s.sellos % 10} / 10</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      s.sellos >= 10 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {s.sellos >= 10 ? '🎁 PREMIO LISTO' : 'EN PROCESO'}
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

  return null;
};
