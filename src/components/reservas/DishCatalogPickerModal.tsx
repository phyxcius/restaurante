import React, { useState } from 'react';
import { Producto, ReservaItemPedido } from '../../types';
import { storage } from '../../services/storage';

interface DishCatalogPickerModalProps {
  initialItems?: ReservaItemPedido[];
  onConfirm: (items: ReservaItemPedido[], total: number) => void;
  onClose: () => void;
}

export const DishCatalogPickerModal: React.FC<DishCatalogPickerModalProps> = ({
  initialItems = [],
  onConfirm,
  onClose,
}) => {
  const [productos] = useState<Producto[]>(() => storage.getProductos());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Map of dishId/name to ReservaItemPedido
  const [selectedMap, setSelectedMap] = useState<Record<string, ReservaItemPedido>>(() => {
    const map: Record<string, ReservaItemPedido> = {};
    initialItems.forEach((it) => {
      map[it.nombre] = { ...it };
    });
    return map;
  });

  const categories = [
    { id: 'all', label: 'Todo el Menú' },
    { id: 'entradas', label: 'Entradas' },
    { id: 'mains', label: 'Platos de Fondo' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'postres', label: 'Postres' },
  ];

  const filteredProducts = productos.filter((p) => {
    const name = p.nombre || p.i18n?.es?.name || p.id;
    const desc = p.descripcion || p.i18n?.es?.desc || '';
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      !searchTerm.trim() ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const updateQuantity = (prod: Producto, delta: number) => {
    const name = prod.nombre || prod.i18n?.es?.name || prod.id;
    const price = prod.precioPEN || prod.precio || 0;
    const current = selectedMap[name]?.cantidad || 0;
    const next = Math.max(0, current + delta);

    setSelectedMap((prev) => {
      const copy = { ...prev };
      if (next === 0) {
        delete copy[name];
      } else {
        copy[name] = {
          id: prod.id,
          nombre: name,
          cantidad: next,
          precio: price,
        };
      }
      return copy;
    });
  };

  const selectedItemsList = Object.values(selectedMap);
  const totalCantidad = selectedItemsList.reduce((acc, it) => acc + it.cantidad, 0);
  const totalPEN = selectedItemsList.reduce((acc, it) => acc + it.cantidad * it.precio, 0);

  return (
    <div className="fixed inset-0 z-[700] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#0b1a33] border-2 border-amber-400 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-700/80 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-400 uppercase font-latina-luxury leading-tight">
                Catálogo Digital de Platos & Pedidos
              </h3>
              <p className="text-[11px] text-sky-300">
                Selecciona los platos que se servirán en la reserva
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-3 sm:px-6 bg-slate-950/60 border-b border-slate-800 space-y-2.5">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Buscar ceviche, lomo, bebidas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 border-amber-300 text-slate-950 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes List */}
        <div className="flex-1 overflow-y-auto p-3 sm:px-6 space-y-2.5 custom-scroll">
          {filteredProducts.map((prod) => {
            const name = prod.nombre || prod.i18n?.es?.name || prod.id;
            const desc = prod.descripcion || prod.i18n?.es?.desc || '';
            const price = prod.precioPEN || prod.precio || 0;
            const qty = selectedMap[name]?.cantidad || 0;

            return (
              <div
                key={prod.id}
                className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                  qty > 0
                    ? 'bg-amber-500/10 border-amber-400/80'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Image */}
                <div className="w-14 h-14 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-700">
                  <img
                    src={prod.posterUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1544025162-d76694265947?w=400';
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-white truncate">{name}</h4>
                    <span className="text-xs sm:text-sm font-black text-amber-400 shrink-0">
                      S/ {price.toFixed(2)}
                    </span>
                  </div>
                  {desc && (
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{desc}</p>
                  )}
                </div>

                {/* Counter */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 px-2 py-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => updateQuantity(prod, -1)}
                    disabled={qty === 0}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${
                      qty > 0
                        ? 'bg-slate-800 text-white hover:bg-red-600 cursor-pointer'
                        : 'text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-black text-amber-300">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(prod, 1)}
                    className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black cursor-pointer shadow"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary & Confirm */}
        <div className="p-3 sm:px-6 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Platos Seleccionados
              </span>
              <span className="text-xs font-black text-white">
                {totalCantidad} unidad(es)
              </span>
            </div>
            <div className="text-right sm:text-left sm:pl-4 sm:border-l border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Estimado
              </span>
              <span className="text-sm font-black text-emerald-400">
                S/ {totalPEN.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(selectedItemsList, totalPEN);
                onClose();
              }}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              <span>✓</span>
              <span>Confirmar Platos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
