import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Trash2,
  Globe,
  LayoutGrid,
  Film,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
  Receipt,
  UserCheck,
  Search,
  Heart,
  Share2,
  MessageCircle,
  Check,
} from 'lucide-react';
import { Producto, CartItem, Language, Comanda, ConfigRestaurante } from '../../types';
import { storage } from '../../services/storage';
import { consultarDNI } from '../../services/sunatApi';
import { MENU_TRANSLATIONS } from './menuTranslations';

interface MenuDigitalProps {
  config: ConfigRestaurante;
  onNavigateToFactura?: () => void;
}

export const MenuDigital: React.FC<MenuDigitalProps> = ({ config, onNavigateToFactura }) => {
  const [productos, setProductos] = useState<Producto[]>(storage.getProductos());
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lang, setLang] = useState<Language>('es');
  const t = MENU_TRANSLATIONS[lang] || MENU_TRANSLATIONS.es;

  // TikTok gestures tutorial & interactive likes state
  const [showGestureTutorial, setShowGestureTutorial] = useState<boolean>(() => {
    return !sessionStorage.getItem('cusq_tiktok_tutorial_seen');
  });
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [hasLikedMap, setHasLikedMap] = useState<Record<string, boolean>>({});
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [showReviewsModal, setShowReviewsModal] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'reels' | 'grid'>('reels');

  // Order placement state
  const [selectedMesa, setSelectedMesa] = useState<string>('Mesa 01');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteDni, setClienteDni] = useState<string>('');
  const [orderNotas, setOrderNotas] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
  const [efectivoEntregado, setEfectivoEntregado] = useState<string>('');
  const [isSearchingDni, setIsSearchingDni] = useState<boolean>(false);
  const [socioEncontrado, setSocioEncontrado] = useState<string | null>(null);

  // Active tracking & lifecycle
  const [activeOrder, setActiveOrder] = useState<Comanda | null>(null);
  const [lastOrderState, setLastOrderState] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bloqueadoPorPago, setBloqueadoPorPago] = useState<boolean>(false);
  const [ventaCompletada, setVentaCompletada] = useState<any>(null);
  const [calificacionEstrellas, setCalificacionEstrellas] = useState<number>(5);
  const [comentarioResena, setComentarioResena] = useState<string>('');
  const [resenaEnviada, setResenaEnviada] = useState<boolean>(false);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [pinUnlock, setPinUnlock] = useState<string>('');
  const [errorPinUnlock, setErrorPinUnlock] = useState<string>('');

  // Lock / Access gate state (prompts for PIN registered in Usuarios)
  const [isMenuUnlocked, setIsMenuUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('auth_menu_active') === 'true';
  });
  const [menuPinInput, setMenuPinInput] = useState<string>('');
  const [menuAccessError, setMenuAccessError] = useState<string>('');

  // Touch gesture refs for vertical swiping
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const mouseStartY = useRef<number>(0);
  const isMouseDown = useRef<boolean>(false);
  const wheelLock = useRef<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const checkState = () => {
      setProductos(storage.getProductos());
      const myOrderId = sessionStorage.getItem('cusq_my_order_id');
      const comandas = storage.getComandas();

      // Check if current mesa has an active comanda
      const current = comandas.find(
        (c) => c.mesa.toLowerCase() === selectedMesa.toLowerCase() && c.estado !== 'finalizado' && c.estado !== 'anulado'
      );

      // Transition detection
      if (current) {
        if (lastOrderState && current.estado !== lastOrderState) {
          if (current.estado === 'cocina') {
            showToast(t.chefAcceptedMessage);
          } else if (current.estado === 'servido') {
            showToast(t.orderReadyMessage);
          }
        }
        if (current.despachadoCocina && !sessionStorage.getItem('notif_despachado_' + current.id)) {
          sessionStorage.setItem('notif_despachado_' + current.id, 'true');
          showToast(
            lang === 'en'
              ? '🍽️ Your order was dispatched by the Chef! Enjoy your meal. You can request the bill whenever you are ready.'
              : '🍽️ ¡Tu pedido fue despachado por el Chef y está en tu mesa! Buen provecho. Puedes pulsar «Pagar Cuenta» cuando desees.'
          );
        }
      }
      if (current) setLastOrderState(current.estado);
      setActiveOrder(current || null);

      // Check if this specific order was officially PAID and finalized by the cashier
      const mesaKey = 'cusq_mesa_pagada_' + selectedMesa.replace(/\s+/g, '_').toLowerCase();
      const mesaPagadaRaw = localStorage.getItem(mesaKey);
      let wasPaid = false;
      let completedSale: any = null;

      if (myOrderId) {
        const orderFound = comandas.find((c) => c.id === myOrderId);
        // Only block if this exact order was finalized AND there is a real Venta matching its exact ID
        if (orderFound && orderFound.estado === 'finalizado') {
          const ventas = storage.getVentas();
          const matchingVenta = ventas.find((x) => x.id === myOrderId);
          if (matchingVenta) {
            wasPaid = true;
            completedSale = matchingVenta;
          }
        }
      }

      // Check mesaPagadaRaw ONLY if it matches the current active order ID and was paid in this session
      if (!wasPaid && mesaPagadaRaw) {
        try {
          const parsed = JSON.parse(mesaPagadaRaw);
          if (parsed && (parsed.id === myOrderId || (current && parsed.id === current.id))) {
            wasPaid = true;
            completedSale = parsed;
          } else {
            // It belongs to a past cycle or different order: remove it so it never falsely blocks the client!
            localStorage.removeItem(mesaKey);
          }
        } catch {
          localStorage.removeItem(mesaKey);
        }
      }

      setBloqueadoPorPago(wasPaid);
      if (wasPaid && completedSale) {
        setVentaCompletada(completedSale);
      } else {
        setVentaCompletada(null);
      }
    };

    checkState();
    const unsub = storage.subscribe(checkState);
    return unsub;
  }, [selectedMesa, lastOrderState, t]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const filteredDishes = productos.filter((p) => {
    if (!p.disponible) return false;
    if (selectedCategory === 'all') return true;
    return p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const currentDish: Producto | undefined = filteredDishes[currentSlideIndex] || filteredDishes[0];

  const handleNextSlide = () => {
    if (filteredDishes.length === 0) return;
    if (showGestureTutorial) {
      setShowGestureTutorial(false);
      sessionStorage.setItem('cusq_tiktok_tutorial_seen', 'true');
    }
    setCurrentSlideIndex((prev) => (prev + 1) % filteredDishes.length);
  };

  const handlePrevSlide = () => {
    if (filteredDishes.length === 0) return;
    if (showGestureTutorial) {
      setShowGestureTutorial(false);
      sessionStorage.setItem('cusq_tiktok_tutorial_seen', 'true');
    }
    setCurrentSlideIndex((prev) => (prev - 1 + filteredDishes.length) % filteredDishes.length);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Touch / Swipe Gesture Handlers for moving up and down like TikTok
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const diffY = touchStartY.current - endY;
    const diffX = touchStartX.current - endX;

    // Detect vertical swipe of at least 30px
    if (Math.abs(diffY) > 30 && Math.abs(diffY) > Math.abs(diffX) * 1.05) {
      if (diffY > 0) {
        // Swiped UP -> Next dish
        handleNextSlide();
      } else {
        // Swiped DOWN -> Previous dish
        handlePrevSlide();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartY.current = e.clientY;
    isMouseDown.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    const diffY = mouseStartY.current - e.clientY;
    if (Math.abs(diffY) > 35) {
      if (diffY > 0) handleNextSlide();
      else handlePrevSlide();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLock.current) return;
    if (Math.abs(e.deltaY) > 20) {
      wheelLock.current = true;
      if (e.deltaY > 0) handleNextSlide();
      else handlePrevSlide();
      setTimeout(() => {
        wheelLock.current = false;
      }, 350);
    }
  };

  // Like Toggle
  const handleToggleLike = (dishId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const alreadyLiked = !!hasLikedMap[dishId];
    setHasLikedMap((prev) => ({ ...prev, [dishId]: !alreadyLiked }));
    setLikesMap((prev) => {
      const cur = prev[dishId] !== undefined ? prev[dishId] : 1420;
      return { ...prev, [dishId]: alreadyLiked ? cur - 1 : cur + 1 };
    });

    if (!alreadyLiked) {
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { x: 0.9, y: 0.6 },
          colors: ['#ef4444', '#f43f5e', '#fb7185'],
        });
      } catch {}
    }
  };

  // Share Dish
  const handleShareDish = (dish?: Producto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!dish) return;
    const dishName = dish.i18n?.[lang]?.name || dish.i18n?.es?.name || 'Plato Cusqueño';
    if (navigator.share) {
      navigator.share({
        title: `${dishName} - ${config.nombre}`,
        text: `¡Mira este delicioso plato en ${config.nombre}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast(lang === 'en' ? '🔗 Link copied to clipboard!' : '🔗 ¡Enlace del plato copiado al portapapeles!');
    }
  };

  // Cart operations
  const addToCart = (prod: Producto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.producto.id === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].cantidad += 1;
        return next;
      }
      return [...prev, { producto: prod, cantidad: 1 }];
    });

    const pName = prod.i18n?.[lang]?.name || prod.i18n?.es?.name || (prod as any).nombre || 'Plato';
    showToast(`¡${pName} - ${t.addedToOrder}`);
  };

  const updateCartQty = (prodId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.producto.id === prodId) {
            const nextQty = item.cantidad + delta;
            return nextQty > 0 ? { ...item, cantidad: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemNote = (prodId: string, notas: string) => {
    setCart((prev) =>
      prev.map((item) => (item.producto.id === prodId ? { ...item, notas } : item))
    );
  };

  const cartTotalPEN = cart.reduce((sum, item) => sum + item.producto.precioPEN * item.cantidad, 0);
  const cartTotalUSD = Number((cartTotalPEN / (config.exchangeRateUSD || 3.75)).toFixed(2));
  const totalItemsCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

  // Cash change calculation
  const cashNum = parseFloat(efectivoEntregado) || 0;
  const vuelto = cashNum >= cartTotalPEN ? cashNum - cartTotalPEN : 0;

  // Search socio by DNI
  const handleBuscarSocio = async () => {
    if (!clienteDni || clienteDni.trim().length !== 8) {
      alert('Ingresa un DNI de 8 dígitos para consultar.');
      return;
    }
    setIsSearchingDni(true);
    try {
      const res = await consultarDNI(clienteDni);
      if (res.success && res.nombres_completos) {
        setClienteNombre(res.nombres_completos);
        const socio = storage.getSocioByDni(clienteDni);
        if (socio) {
          setSocioEncontrado(`¡Socio Encontrado! ${socio.sellos} sellos acumulados.`);
        } else {
          setSocioEncontrado('Cliente verificado en RENIEC.');
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsSearchingDni(false);
    }
  };

  // Submit Order
  const handleEnviarPedido = () => {
    if (cart.length === 0) {
      alert(t.cartEmpty);
      return;
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const itemsSummary = cart
      .map((i) => `${i.cantidad}x ${i.producto.i18n?.[lang]?.name || i.producto.i18n?.es?.name || (i.producto as any).nombre || 'Plato'}`)
      .join(', ');

    const newComanda: Comanda = {
      id: orderId,
      numero: `CMD-${Date.now().toString().slice(-5)}`,
      mesa: selectedMesa,
      cliente: clienteNombre.trim() || 'Cliente Salón',
      dni: clienteDni.trim() || undefined,
      productos: itemsSummary,
      items: cart.map((i) => ({
        id: i.producto.id,
        nombre: i.producto.i18n?.[lang]?.name || i.producto.i18n?.es?.name || (i.producto as any).nombre || 'Plato',
        cantidad: i.cantidad,
        precio: i.producto.precioPEN || (i.producto as any).precio || 35,
        notas: i.notas,
      })),
      totalPEN: cartTotalPEN,
      totalUSD: cartTotalUSD,
      total: cartTotalPEN,
      estado: 'iniciado',
      pago: metodoPago,
      tipoComprobante: 'Boleta',
      fecha: new Date().toISOString().slice(0, 10),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      notas: orderNotas.trim() || undefined,
    };

    storage.saveComanda(newComanda);
    sessionStorage.setItem('cusq_my_order_id', newComanda.id);
    try {
      localStorage.removeItem('cusq_mesa_pagada_' + selectedMesa.replace(/\s+/g, '_').toLowerCase());
    } catch {}
    setActiveOrder(newComanda);
    setCart([]);
    setIsCartOpen(false);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }

    showToast(`¡${newComanda.numero || newComanda.id} - ${t.sendOrderToKitchen}!`);
  };

  const handlePedirCuenta = () => {
    if (activeOrder) {
      storage.requestBill(activeOrder.id, metodoPago);
      showToast(
        lang === 'en'
          ? '🧾 Payment request sent to Cashier! The cashier has been notified with high priority.'
          : '🧾 ¡Solicitud de pago enviada a Caja! El cajero ha recibido la alerta con resplandor en el Panel de Control para cobrar la cuenta.'
      );
    } else {
      alert(lang === 'en' ? 'No active order at this table.' : 'No tienes una orden activa en esta mesa.');
    }
  };

  const handleLlamarMozo = () => {
    if (activeOrder) {
      storage.callWaiter(activeOrder.id);
    }
    showToast(t.waiterCalledMessage);
  };

  const categories = [
    { id: 'all', label: t.catAll },
    { id: 'entradas', label: t.catEntradas },
    { id: 'mains', label: t.catMains },
    { id: 'bebidas', label: t.catBebidas },
    { id: 'postres', label: t.catPostres },
  ];

  // PAID & LOCKED THANK YOU SCREEN
  if (bloqueadoPorPago) {
    return (
      <div className="relative w-full max-w-lg mx-auto min-h-[calc(100vh-60px)] bg-gradient-to-b from-[#0a192f] via-[#050d1a] to-[#020617] text-slate-100 flex flex-col justify-between p-5 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center pt-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-1 shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#071224] overflow-hidden flex items-center justify-center text-3xl">
              {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
                <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span>{config.logo || '🏺'}</span>
              )}
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full mb-2">
            {config.nombre} • {selectedMesa}
          </span>
          <h1 className="text-2xl font-black text-white font-latina-luxury tracking-wide">
            {t.thankYouTitle}
          </h1>
          <p className="text-xs text-slate-300 max-w-xs mt-2 leading-relaxed">
            {t.thankYouMessage}
          </p>
        </div>

        {/* Voucher / Paid Details Card */}
        <div className="my-5 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">{t.billPaidClosed}</span>
            </div>
            <span className="text-[10px] uppercase font-black bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              Finalizado
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">{t.mesa}:</span>
              <span className="font-extrabold text-white">{selectedMesa}</span>
            </div>
            {ventaCompletada && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Comprobante:</span>
                  <span className="font-bold text-amber-300">
                    {ventaCompletada.tipoComprobante || 'Boleta'} N° {ventaCompletada.numero || 'B001-XXXX'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Titular:</span>
                  <span className="font-bold text-white">{ventaCompletada.cliente || 'Cliente'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.paymentMethod}</span>
                  <span className="font-semibold text-slate-200">{ventaCompletada.pago || 'Cancelado'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-sm font-black text-amber-400">{t.totalToPay}</span>
                  <span className="text-base font-black text-emerald-400">
                    S/ {(ventaCompletada.totalPEN || ventaCompletada.total || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rating and Feedback */}
        <div className="bg-[#0b1b36] border border-sky-500/30 rounded-2xl p-4 shadow-xl">
          <h3 className="text-xs font-extrabold text-sky-300 uppercase tracking-wider text-center mb-2">
            {t.ratingQuestion}
          </h3>
          <div className="flex justify-center items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCalificacionEstrellas(star)}
                className="text-2xl transition-transform hover:scale-125 focus:outline-none"
              >
                {star <= calificacionEstrellas ? '⭐' : '☆'}
              </button>
            ))}
          </div>

          {!resenaEnviada ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder={t.leaveCommentPlaceholder}
                value={comentarioResena}
                onChange={(e) => setComentarioResena(e.target.value)}
                className="w-full text-xs bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  storage.addResena({
                    id: 'res-' + Date.now(),
                    cliente: ventaCompletada?.cliente || clienteNombre || 'Comensal',
                    mesa: selectedMesa,
                    comentario: comentarioResena.trim() || '¡Excelente sabor y atención!',
                    calificacion: calificacionEstrellas,
                    fecha: new Date().toISOString().slice(0, 10),
                  });
                  setResenaEnviada(true);
                  try {
                    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
                  } catch {}
                }}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all"
              >
                {t.submitRating}
              </button>
            </div>
          ) : (
            <div className="text-center py-2 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.ratingSubmittedThanks}</span>
            </div>
          )}
        </div>

        {/* Lock footer note & Waiter Unlock */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <span>🔒</span>
            <span>{t.tableLockedNotice}</span>
          </p>
          <button
            type="button"
            onClick={() => setShowUnlockModal(true)}
            className="text-[11px] font-bold text-slate-400 hover:text-amber-300 underline cursor-pointer transition-colors"
          >
            {t.unlockForNewGuests}
          </button>
        </div>

        {/* Unlock PIN Modal */}
        {showUnlockModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09152b] border border-amber-500/50 rounded-2xl p-5 w-full max-w-xs shadow-2xl text-center">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider mb-1">
                {t.unlockTableModalTitle}
              </h3>
              <p className="text-xs text-slate-300 mb-3">
                {t.enterWaiterPin} ({selectedMesa}):
              </p>
              <input
                type="password"
                placeholder="Clave (Ej: mozo123)"
                value={pinUnlock}
                onChange={(e) => {
                  setPinUnlock(e.target.value);
                  setErrorPinUnlock('');
                }}
                className="w-full text-center tracking-widest text-lg font-black bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white mb-2 outline-none focus:border-amber-400"
              />
              {errorPinUnlock && (
                <p className="text-xs text-red-400 font-bold mb-2">{errorPinUnlock}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setPinUnlock('');
                    setErrorPinUnlock('');
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (storage.validarClave('mozo', pinUnlock) || storage.validarClave('admin', pinUnlock)) {
                      sessionStorage.removeItem('cusq_my_order_id');
                      try {
                        localStorage.removeItem('cusq_mesa_pagada_' + selectedMesa.replace(/\s+/g, '_').toLowerCase());
                      } catch {}
                      setBloqueadoPorPago(false);
                      setVentaCompletada(null);
                      setActiveOrder(null);
                      setShowUnlockModal(false);
                      setPinUnlock('');
                      showToast(`✔ ${selectedMesa} desbloqueada y lista.`);
                    } else {
                      setErrorPinUnlock(t.invalidMozoPin);
                    }
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 text-white font-black text-xs rounded-xl shadow"
                >
                  {t.unlock}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ACCESS GATE: MUST ENTER PASSWORD BEFORE OPENING MENÚ DIGITAL
  if (!isMenuUnlocked) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-[#0a192f] via-[#050d1a] to-[#020617] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#09152b] border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg border-2 border-amber-400 overflow-hidden flex items-center justify-center" title="La Chuspa Tech">
              <img
                src="/CHUSPITA-circulo.png"
                alt="La Chuspa Tech"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/1000367606_24125dba.jpg';
                }}
              />
            </div>
            <div className="w-16 h-16 rounded-full bg-[#071224] border-2 border-amber-400 flex items-center justify-center overflow-hidden text-2xl shadow-lg">
              {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
                <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span>{config.logo || '🍽️'}</span>
              )}
            </div>
          </div>

          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full mb-1">
            {config.nombre}
          </span>
          <h1 className="text-xl font-black text-white font-latina-luxury mt-1">
            {t.lockScreenTitle}
          </h1>
          <p className="text-xs text-slate-300 mt-1 mb-4">
            {t.lockScreenSubtitle}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const pin = menuPinInput.trim();
              if (
                storage.validarClave('mozo', pin) ||
                storage.validarClave('admin', pin)
              ) {
                sessionStorage.setItem('auth_menu_active', 'true');
                setIsMenuUnlocked(true);
                setMenuAccessError('');
                setMenuPinInput('');
              } else {
                setMenuAccessError(t.invalidPin);
              }
            }}
            className="w-full space-y-3 text-left"
          >
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                {t.diningTable}
              </label>
              <select
                value={selectedMesa}
                onChange={(e) => setSelectedMesa(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none focus:border-amber-400"
              >
                {storage.getMesas().map((m) => (
                  <option key={m.id} value={m.nombre}>
                    {m.nombre} {m.estado === 'ocupada' ? '(Ocupada)' : '(Disponible)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                {t.accessPassword}
              </label>
              <input
                type="password"
                placeholder="Ingresa clave registrada (Mozo/Admin)"
                value={menuPinInput}
                onChange={(e) => {
                  setMenuPinInput(e.target.value);
                  setMenuAccessError('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-center tracking-widest text-white text-base font-black outline-none focus:border-amber-400 placeholder:text-slate-500 placeholder:tracking-normal placeholder:text-xs"
                autoFocus
              />
            </div>

            {menuAccessError && (
              <p className="text-xs text-red-400 font-bold text-center">{menuAccessError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-xl shadow-lg cursor-pointer active:scale-98 transition-all"
            >
              <i className="fa-solid fa-lock-open mr-1.5"></i> {t.unlockAndEnter}
            </button>
          </form>

          <p className="mt-4 text-[10px] text-slate-400">
            * Se valida contra los usuarios registrados en <b>Gestión de Usuarios</b>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto min-h-[calc(100vh-60px)] bg-[#050d1a] text-slate-100 overflow-hidden flex flex-col select-none">
      {/* Toast alert: CENTRADO EN LA PARTE DEL MEDIO EXACTAMENTE */}
      {toastMessage && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#0f2142] via-[#09152b] to-[#071224] border-2 border-amber-400 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.5)] text-center flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-inner animate-pulse">
              🔔
            </div>
            <h3 className="text-base font-black text-amber-400 uppercase tracking-wider font-latina-luxury">
              {t.tableNotification}
            </h3>
            <p className="text-sm font-bold text-slate-100 leading-relaxed">
              {toastMessage}
            </p>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="mt-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer active:scale-95 transition-all"
            >
              {t.acceptContinue}
            </button>
          </div>
        </div>
      )}

      {/* DEDO GESTUAL: ANIMATED INTERACTIVE TUTORIAL OVERLAY */}
      {showGestureTutorial && (
        <div
          onClick={() => {
            setShowGestureTutorial(false);
            sessionStorage.setItem('cusq_tiktok_tutorial_seen', 'true');
          }}
          className="fixed inset-0 z-[99990] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none animate-in fade-in duration-300"
        >
          {/* Animated Hand/Finger Gesture moving up and down */}
          <div className="relative mb-6 flex flex-col items-center">
            <div className="w-24 h-44 rounded-3xl border-2 border-dashed border-amber-400/70 flex flex-col items-center justify-between py-4 relative bg-slate-900/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <ChevronUp className="w-7 h-7 text-amber-400 animate-bounce" />
              <div className="relative text-6xl filter drop-shadow-[0_0_20px_rgba(245,158,11,0.9)] animate-[bounce_1.5s_infinite]">
                👆
              </div>
              <ChevronDown className="w-7 h-7 text-amber-400 animate-bounce" />
            </div>
          </div>

          <div className="max-w-xs bg-slate-900/95 border-2 border-amber-400 rounded-3xl p-5 shadow-[0_0_40px_rgba(245,158,11,0.5)]">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs uppercase mb-2 border border-amber-400/40">
              {lang === 'es' ? 'Experiencia TikTok' : lang === 'en' ? 'TikTok Experience' : lang === 'fr' ? 'Expérience TikTok' : 'Experiência TikTok'}
            </div>
            <h3 className="text-lg font-black text-white font-latina-luxury mb-2">
              {t.gestureHelp}
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed mb-4">
              {t.tiktokSwipeTutorial}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowGestureTutorial(false);
                sessionStorage.setItem('cusq_tiktok_tutorial_seen', 'true');
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              {t.tapToDismiss}
            </button>
          </div>
        </div>
      )}

      {/* Top Filter Bar (Reels header) */}
      <div className="sticky top-0 z-30 w-full px-3 py-2 bg-gradient-to-b from-[#071224]/95 via-[#071224]/85 to-transparent flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Table select pill */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-400/40 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-sky-400">{t.mesa}:</span>
            <select
              value={selectedMesa}
              onChange={(e) => setSelectedMesa(e.target.value)}
              className="bg-transparent text-amber-300 font-extrabold outline-none cursor-pointer text-xs"
            >
              {storage.getMesas().map((m) => (
                <option key={m.id} value={m.nombre} className="bg-slate-900 text-white">
                  {m.nombre} {m.estado === 'ocupada' ? '(Ocupada)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* View toggle (Reels / Grid) */}
          <div className="flex items-center bg-slate-900/90 border border-sky-400/30 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('reels')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'reels' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={t.reelsMode}
            >
              <Film className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={t.gridMode}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dedo Gestual Help Button */}
          <button
            type="button"
            onClick={() => setShowGestureTutorial(true)}
            className="p-1.5 bg-slate-900/90 border border-amber-400/50 hover:border-amber-400 rounded-xl text-amber-300 text-xs flex items-center gap-1 transition-colors animate-pulse"
            title={t.gestureHelp}
          >
            <span className="text-xs">👆</span>
          </button>



          {/* Lock station button */}
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('auth_menu_active');
              setIsMenuUnlocked(false);
            }}
            className="p-1.5 bg-slate-900/90 border border-slate-700 hover:border-amber-400 rounded-xl text-slate-400 hover:text-amber-400 text-xs flex items-center gap-1 transition-colors"
            title={t.lockMenu}
          >
            <i className="fa-solid fa-lock text-[11px]"></i>
          </button>
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-xl px-2 py-1 text-xs">
            <Globe className="w-3 h-3 text-sky-400" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer uppercase text-xs"
            >
              <option value="es" className="bg-slate-900 text-white">ES</option>
              <option value="en" className="bg-slate-900 text-white">EN</option>
              <option value="fr" className="bg-slate-900 text-white">FR</option>
              <option value="pt" className="bg-slate-900 text-white">PT</option>
            </select>
          </div>
        </div>

        {/* Category Pills (100% translated) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentSlideIndex(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900/80 text-slate-300 border border-slate-700/60 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Order Banner if order in kitchen (100% translated) */}
      {activeOrder && (
        <div className="px-3 py-2 bg-gradient-to-r from-blue-900/90 via-sky-900/90 to-blue-900/90 border-y border-amber-400/50 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="font-extrabold text-white">
                {t.activeOrderTitle} ({activeOrder.numero || activeOrder.id}):{' '}
                <span className="text-amber-300 uppercase">
                  {activeOrder.estado === 'iniciado'
                    ? t.statusReceived
                    : activeOrder.estado === 'cocina'
                    ? t.statusInKitchen
                    : activeOrder.despachadoCocina
                    ? '🍽️ Servido en Mesa'
                    : t.statusServed}
                </span>
              </p>
              <p className="text-[10px] text-sky-200">{t.total}: S/ {activeOrder.totalPEN.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleLlamarMozo}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-[11px] flex items-center gap-1 shadow cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" /> {t.callWaiter}
            </button>
            <button
              onClick={handlePedirCuenta}
              className={`px-2.5 py-1 text-white font-black rounded-lg text-[11px] flex items-center gap-1 shadow-md cursor-pointer transition-all ${
                activeOrder.pideCuenta
                  ? 'bg-emerald-700 text-emerald-100 border border-emerald-400'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-300 animate-pulse'
              }`}
            >
              <Receipt className="w-3 h-3 text-amber-300" />
              <span>{activeOrder.pideCuenta ? '⏳ Cuenta Solicitada' : '💳 Pagar Cuenta'}</span>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING PROMPT WHEN DISHES ARE SERVED / DISPATCHED */}
      {activeOrder && (activeOrder.despachadoCocina || activeOrder.estado === 'servido') && (
        <div className="mx-3 mt-1 px-3 py-2 bg-gradient-to-r from-purple-950/90 via-[#0d1c3b]/90 to-purple-950/90 border border-purple-400/60 rounded-xl flex items-center justify-between gap-2 shadow-lg backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base">🍽️</span>
            <div>
              <p className="text-[11px] font-black text-white">¡Platos servidos en tu mesa!</p>
              <p className="text-[10px] text-slate-300">
                {activeOrder.pideCuenta ? '✔ El cajero ya tiene tu cuenta en pantalla.' : 'Cuando desees terminar tu estadía, pulsa Pagar Cuenta.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePedirCuenta}
            disabled={activeOrder.pideCuenta}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 shadow transition-all ${
              activeOrder.pideCuenta
                ? 'bg-emerald-800/80 text-emerald-200 border border-emerald-500/50 cursor-default'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 text-white border border-purple-300 animate-pulse cursor-pointer active:scale-95'
            }`}
          >
            <Receipt className="w-3 h-3" />
            <span>{activeOrder.pideCuenta ? 'Cuenta Pedida' : 'Pagar Cuenta'}</span>
          </button>
        </div>
      )}

      {/* MAIN VIEW: TIKTOK REELS OR GRID */}
      {viewMode === 'reels' ? (
        <div
          className="relative flex-1 w-full h-[calc(100vh-170px)] bg-black overflow-hidden flex flex-col justify-end select-none cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {currentDish ? (
            <>
              {/* Swipe Guide Indicator */}
              <div 
                onClick={() => setShowGestureTutorial(true)}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-20 cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-amber-400/50 text-[10px] text-amber-300 font-extrabold shadow-lg backdrop-blur-sm animate-pulse"
              >
                <span>👆</span>
                <span>{t.tiktokSwipeHint}</span>
              </div>

              {/* Video Player */}
              <video
                ref={videoRef}
                key={currentDish.id}
                src={currentDish.videoUrl}
                poster={currentDish.posterUrl}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                className="absolute inset-0 w-full h-full object-cover"
                onClick={togglePlay}
              />

              {/* Gradient Overlay for high readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/40 pointer-events-none" />

              {/* TIKTOK FLOATING ACTION COLUMN ON RIGHT */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5">
                {/* 1. Restaurant Avatar with Follow "+" badge */}
                <div className="relative mb-1">
                  <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-amber-200 border border-white shadow-xl flex items-center justify-center text-lg bg-[#071224] overflow-hidden">
                    {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
                      <img src={config.logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{config.logo || '🏺'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow transition-all ${
                      isFollowing ? 'bg-emerald-500' : 'bg-red-500 hover:scale-110'
                    }`}
                  >
                    {isFollowing ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-3 h-3" />}
                  </button>
                </div>

                {/* 2. TikTok Heart / Like Button with Counter */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(currentDish.id, e)}
                    className="w-10 h-10 rounded-full bg-slate-900/80 border border-white/20 flex items-center justify-center backdrop-blur shadow-lg active:scale-125 transition-transform cursor-pointer"
                    title="Me gusta"
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        hasLikedMap[currentDish.id]
                          ? 'text-red-500 fill-red-500 animate-pulse'
                          : 'text-white hover:text-red-400'
                      }`}
                    />
                  </button>
                  <span className="text-[10px] font-black text-white drop-shadow mt-0.5">
                    {likesMap[currentDish.id] !== undefined ? likesMap[currentDish.id] : t.likes}
                  </span>
                </div>

                {/* 3. TikTok Comment Bubble */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setShowReviewsModal(true)}
                    className="w-10 h-10 rounded-full bg-slate-900/80 border border-white/20 text-white flex items-center justify-center backdrop-blur shadow-lg active:scale-110 transition-transform cursor-pointer"
                    title="Reseñas"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] font-black text-white drop-shadow mt-0.5">
                    {t.reviews}
                  </span>
                </div>

                {/* 4. Share Button */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={(e) => handleShareDish(currentDish, e)}
                    className="w-10 h-10 rounded-full bg-slate-900/80 border border-white/20 text-white flex items-center justify-center backdrop-blur shadow-lg active:scale-110 transition-transform cursor-pointer"
                    title={t.share}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] font-black text-white drop-shadow mt-0.5">
                    {t.share}
                  </span>
                </div>

                {/* 5. Sound / Audio Mute Toggle */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-full bg-slate-900/80 border border-amber-400/40 text-amber-300 flex items-center justify-center backdrop-blur shadow-lg active:scale-95 cursor-pointer"
                  title={isMuted ? t.unmute : t.mute}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>

                {/* 6. Spinning Vinyl Record (TikTok Disc) */}
                <div className="relative flex items-center justify-center mt-1">
                  <div
                    onClick={togglePlay}
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 border-2 border-slate-700 p-1 shadow-2xl flex items-center justify-center cursor-pointer ${
                      isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                    }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-cover bg-center border border-amber-400/60 flex items-center justify-center text-[10px] bg-amber-950">
                      {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
                        <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span>{config.logo || '🏺'}</span>
                      )}
                    </div>
                  </div>
                  {isPlaying && (
                    <span className="absolute -top-2 -left-2 text-[10px] text-amber-300 animate-bounce pointer-events-none">
                      🎵
                    </span>
                  )}
                </div>

                {/* Up/Down Quick Navigation buttons */}
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    onClick={handlePrevSlide}
                    className="w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                    title={t.previousDish}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                    title={t.nextDish}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slide Counter Indicator */}
              <div className="absolute top-4 right-4 z-20 px-2 py-0.5 rounded-full bg-slate-900/80 text-[11px] font-black text-amber-300 border border-amber-400/30">
                {currentSlideIndex + 1} / {filteredDishes.length}
              </div>

              {/* Bottom Dish Information (TikTok metadata overlay) */}
              <div className="relative z-20 px-4 pb-20 pt-4 w-[78%]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-black text-white flex items-center gap-1 drop-shadow">
                    @{config.nombre.toLowerCase().replace(/\s+/g, '')}
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                  </span>
                  <span className="inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-blue-600/80 border border-amber-400 text-amber-300 shadow">
                    {categories.find((c) => c.id === currentDish.category)?.label || currentDish.category}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight font-latina-luxury drop-shadow-md">
                  {currentDish?.i18n?.[lang]?.name || currentDish?.i18n?.es?.name || (currentDish as any)?.nombre || 'Plato'}
                </h2>

                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 mt-1 drop-shadow leading-relaxed">
                  {currentDish?.i18n?.[lang]?.desc || currentDish?.i18n?.es?.desc || (currentDish as any)?.descripcion || ''}
                </p>

                {/* Sound Marquee */}
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold mt-1.5 drop-shadow">
                  <span>🎵</span>
                  <span className="truncate">Sonido original - {config.nombre} Gourmet Cusco</span>
                </div>

                <div className="flex items-center justify-between mt-3 gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400 drop-shadow">
                      S/ {currentDish.precioPEN.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-sky-300">
                      ~ ${((currentDish.precioPEN / (config.exchangeRateUSD || 3.75))).toFixed(2)} USD
                    </span>
                  </div>

                  <button
                    onClick={(e) => addToCart(currentDish, e)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(239,68,68,0.6)] border border-rose-300 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addToOrder}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No hay platos en esta categoría.
            </div>
          )}
        </div>
      ) : (
        /* GRID / CATALOG VIEW */
        <div className="flex-1 overflow-y-auto touch-pan-y px-3 py-4 grid grid-cols-2 gap-3 pb-24 scroll-smooth">
          {filteredDishes.map((prod) => (
            <div
              key={prod.id}
              className="bg-slate-900/90 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col shadow-lg hover:border-amber-400/60 transition-all"
            >
              <div className="relative aspect-square w-full bg-black overflow-hidden group">
                <img
                  src={prod.posterUrl}
                  alt={prod.i18n?.[lang]?.name || prod.i18n?.es?.name || (prod as any)?.nombre || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 border border-amber-400 text-[9px] font-black uppercase text-amber-300">
                  {categories.find((c) => c.id === prod.category)?.label || prod.category}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleToggleLike(prod.id, e)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer"
                >
                  <Heart className={`w-3.5 h-3.5 ${hasLikedMap[prod.id] ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                </button>
              </div>

              <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white leading-tight font-latina-luxury line-clamp-1">
                    {prod.i18n?.[lang]?.name || prod.i18n?.es?.name || (prod as any)?.nombre || 'Plato'}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {prod.i18n?.[lang]?.desc || prod.i18n?.es?.desc || (prod as any)?.descripcion || ''}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-sm sm:text-base font-black text-amber-400">
                      S/ {prod.precioPEN.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(prod)}
                    className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-black text-xs flex items-center justify-center hover:shadow-[0_0_10px_rgba(2,132,199,0.5)] active:scale-90 cursor-pointer"
                    title={t.addToOrder}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Cart Trigger Button */}
      <div className="fixed bottom-4 right-4 sm:right-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 border-2 border-amber-400 shadow-[0_6px_25px_rgba(0,86,210,0.6)] flex items-center gap-2.5 text-white font-black text-sm active:scale-95 transition-transform cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5 text-amber-300" />
          <span>{t.viewOrder}</span>
          {totalItemsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-black">
              {totalItemsCount}
            </span>
          )}
          <span className="text-amber-300 font-extrabold text-sm ml-1">
            S/ {cartTotalPEN.toFixed(2)}
          </span>
        </button>
      </div>

      {/* REVIEWS DRAWER MODAL (TikTok Comments) */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="w-full max-w-lg max-h-[75vh] bg-[#09152b] border-t-2 border-amber-400 rounded-t-3xl p-5 flex flex-col shadow-2xl text-slate-100 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2 font-latina-luxury">
                <MessageCircle className="w-4 h-4" /> Comentarios & Valoraciones
              </h3>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="my-3 space-y-2.5">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-white">Luciana Ramos ⭐⭐⭐⭐⭐</span>
                  <span className="text-[10px] text-slate-400">Hace 15 min</span>
                </div>
                <p className="text-xs text-slate-300">¡El mejor sabor andino de Cusco! La sazón es auténtica y la presentación insuperable.</p>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-white">Michael Smith ⭐⭐⭐⭐⭐</span>
                  <span className="text-[10px] text-slate-400">Hace 1 hora</span>
                </div>
                <p className="text-xs text-slate-300">Amazing experience! The meat was juicy, tender and cooked to perfection.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART & ORDERING MODAL DRAWER (100% translated) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] bg-slate-900 border-t-4 sm:border-2 border-blue-600 sm:border-amber-400 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 flex flex-col shadow-2xl text-slate-100 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-amber-400 font-latina-luxury flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" /> {t.yourOrder}
                </h3>
                <span className="text-xs text-sky-300 font-bold">{t.mesa}: {selectedMesa}</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="my-3 flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <p>{t.cartEmpty}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.producto.id}
                    className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-xs font-black text-white font-latina-luxury">
                          {item.producto.i18n?.[lang]?.name || item.producto.i18n?.es?.name || (item.producto as any).nombre || 'Plato'}
                        </h4>
                        <span className="text-[11px] text-amber-400 font-bold">
                          S/ {(item.producto.precioPEN || (item.producto as any).precio || 35).toFixed(2)} c/u
                        </span>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                        <button
                          onClick={() => updateCartQty(item.producto.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-400 font-black cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-white min-w-4 text-center">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.producto.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-emerald-400 font-black cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-amber-300 ml-3 min-w-14 text-right">
                        S/ {(item.producto.precioPEN * item.cantidad).toFixed(2)}
                      </span>
                    </div>

                    {/* Dish notes */}
                    <input
                      type="text"
                      placeholder={t.specialNotes}
                      value={item.notas || ''}
                      onChange={(e) => updateItemNote(item.producto.id, e.target.value)}
                      className="w-full text-[11px] bg-slate-900/90 border border-slate-700/80 rounded px-2 py-1 text-slate-200 outline-none"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Customer Details & Socio Lookup */}
            <div className="pt-2 border-t border-slate-700/80 flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-sky-400 tracking-wider">
                {t.yourNameOptional}
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="DNI (8 dígitos) para puntos"
                  value={clienteDni}
                  onChange={(e) => setClienteDni(e.target.value)}
                  className="w-1/2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleBuscarSocio}
                  disabled={isSearchingDni}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Search className="w-3 h-3" />
                  {isSearchingDni ? '...' : 'DNI'}
                </button>
              </div>

              {socioEncontrado && (
                <p className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {socioEncontrado}
                </p>
              )}

              <input
                type="text"
                placeholder={t.yourNameOptional}
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="mt-3">
              <label className="text-[10px] font-black uppercase text-sky-400 tracking-wider block mb-1.5">
                {t.paymentMethod}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'Efectivo', label: t.cash },
                  { id: 'Tarjeta POS', label: t.posCard },
                  { id: 'Yape / Plin', label: t.digitalWallet },
                ].map((met) => (
                  <button
                    key={met.id}
                    type="button"
                    onClick={() => setMetodoPago(met.id)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      metodoPago === met.id
                        ? 'bg-blue-600 text-white border border-amber-400 shadow'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                    }`}
                  >
                    {met.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Calculator if Efectivo */}
            {metodoPago === 'Efectivo' && (
              <div className="mt-2.5 p-2.5 bg-slate-800/60 border border-amber-400/30 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">{t.cashGivenQuestion}</span>
                  <input
                    type="number"
                    placeholder="S/ 0.00"
                    value={efectivoEntregado}
                    onChange={(e) => setEfectivoEntregado(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-right font-black text-amber-300 text-xs outline-none"
                  />
                </div>
                {/* Quick cash buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[20, 50, 100, 200].map((monto) => (
                    <button
                      key={monto}
                      type="button"
                      onClick={() => setEfectivoEntregado(monto.toString())}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-700 border border-slate-600 rounded text-[11px] font-bold text-sky-300 cursor-pointer"
                    >
                      S/ {monto}
                    </button>
                  ))}
                </div>
                {cashNum > 0 && (
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700 text-xs font-black">
                    <span className="text-slate-300">{t.estimatedChange}</span>
                    <span className={`text-sm ${vuelto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      S/ {vuelto.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Totals Summary */}
            <div className="mt-4 pt-3 border-t border-slate-700 flex items-baseline justify-between">
              <span className="text-sm font-extrabold uppercase text-slate-300">{t.totalToPay}</span>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400 font-latina-luxury">
                  S/ {cartTotalPEN.toFixed(2)}
                </span>
                <span className="block text-xs font-bold text-sky-300">
                  ~ ${cartTotalUSD.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleEnviarPedido}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(239,68,68,0.4)] border border-rose-300 cursor-pointer active:scale-98 transition-transform"
              >
                <Send className="w-4 h-4" />
                <span>{t.sendOrderToKitchen}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={handlePedirCuenta}
                  className="py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{t.requestBill}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLlamarMozo}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.callWaiter}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
