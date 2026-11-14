import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Comanda,
  Venta,
  Insumo,
  Receta,
  MovimientoAlmacen,
  Personal,
  MovimientoCaja,
  CierreCaja,
  Socio,
  Reserva,
  Producto,
  ConfigRestaurante,
  MesaStatus,
  UserRole,
  ReservaItemPedido,
  ThemeColorsConfig,
  DevApiConfig,
} from '../../types';
import { storage, UsuarioSistema } from '../../services/storage';
import { FirebaseSyncInfo } from '../../services/firebaseDb';
import {
  consultarDNI,
  consultarRUC,
  emitirComprobanteElectronico,
  getDevApiConfig,
  saveDevApiConfig,
  probarConexionTokens,
  DiagnosticoTokensResult,
} from '../../services/sunatApi';
import { ErpSubmodules } from './ErpSubmodules';
import { ClubSocios } from '../club/ClubSocios';
import { FacturaTicket } from '../factura/FacturaTicket';
import { CHUSPA_TECH_LOGO } from '../../constants/chuspaLogo';
import { isFechaHoy, matchMesa, normalizeDate } from '../../utils/dateUtils';
import { DishCatalogPickerModal } from '../reservas/DishCatalogPickerModal';

interface AdminDashboardProps {
  config: ConfigRestaurante;
  onNavigateToFactura?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ config, onNavigateToFactura }) => {
  // Session authentication (requires valid registered credentials)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('auth_admin_active') === 'true';
  });
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [operatorName, setOperatorName] = useState<string>('Administrador');
  const [password, setPassword] = useState<string>('');
  const [shift, setShift] = useState<string>('Turno Mañana (07:00 - 15:00)');
  const [cajaChica, setCajaChica] = useState<number>(100.0);

  // Appearance: Light / Dark Mode Toggle
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('cusq_admin_theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('cusq_admin_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('cusq_admin_theme', 'dark');
    }
  }, [isLightMode]);

  // Active navigation section
  const [currentSection, setCurrentSection] = useState<string>('comandas');
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // KDS Comandas Filter & Search States
  const [kdsFechaFiltro, setKdsFechaFiltro] = useState<string>('');
  const [kdsModoFecha, setKdsModoFecha] = useState<'todas' | 'hoy' | 'ayer'>('todas');
  const [kdsSearchQuery, setKdsSearchQuery] = useState<string>('');
  const [kdsEstadoFiltro, setKdsEstadoFiltro] = useState<'todos' | 'cobrar' | 'iniciado' | 'cocina'>('todos');
  const [modoEliminarMesas, setModoEliminarMesas] = useState<boolean>(false);

  // Usqay Floor & Table States
  const [pisoSeleccionado, setPisoSeleccionado] = useState<'salon' | 'delivery' | 'llevar'>('salon');
  const [topDropdownOpen, setTopDropdownOpen] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [mesaDetalleModal, setMesaDetalleModal] = useState<MesaStatus | null>(null);
  const [mesaComandaActiva, setMesaComandaActiva] = useState<Comanda | null>(null);
  const [mesaNuevaPlato, setMesaNuevaPlato] = useState<string>('Lomo Saltado Criollo');
  const [mesaNuevaMozo, setMesaNuevaMozo] = useState<string>('YOSUKI');
  const [mesaNuevaPax, setMesaNuevaPax] = useState<number>(2);
  const [mesaAgregarPlato, setMesaAgregarPlato] = useState<string>('Pisco Sour Cusqueño Clásico');
  const [mesaAgregarCant, setMesaAgregarCant] = useState<number>(1);
  const [mesaAgregarNotas, setMesaAgregarNotas] = useState<string>('');

  // Live timer interval (every second)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);



  // Vault security locks (Master Password: 42423549)
  const PASSWORD_MAESTRA = '42423549';
  const [ghToken, setGhToken] = useState<string>(() => localStorage.getItem('inkabistro_vault_secret_token') || '');
  const [showGhToken, setShowGhToken] = useState<boolean>(false);
  const [devConsoleUnlocked, setDevConsoleUnlocked] = useState<boolean>(false);
  const [devPinInput, setDevPinInput] = useState<string>('');
  const [devPinError, setDevPinError] = useState<string>('');
  const [entregaForm, setEntregaForm] = useState<{
    nombreNegocio: string;
    whatsapp: string;
    montoCajaInicial: number;
    conservarCartaBase: boolean;
    resetearUsuarios: boolean;
    habilitarDniCliente: boolean;
    habilitarRucCliente: boolean;
    habilitarComprobantesFiscales: boolean;
  }>({
    nombreNegocio: 'La Chuspa Tech',
    whatsapp: '969773064',
    montoCajaInicial: 0,
    conservarCartaBase: true,
    resetearUsuarios: false,
    habilitarDniCliente: true,
    habilitarRucCliente: true,
    habilitarComprobantesFiscales: true,
  });

  // Developer API SUNAT / RENIEC (ApisPerú Beta / Producción)
  const [devApiForm, setDevApiForm] = useState<DevApiConfig>(() => getDevApiConfig());
  const [devApiSyncedCloud, setDevApiSyncedCloud] = useState<boolean>(() => storage.isDevApiSyncedInCloud());
  const [showDniToken, setShowDniToken] = useState<boolean>(false);
  const [showFactToken, setShowFactToken] = useState<boolean>(false);
  const [diagnosticoTokens, setDiagnosticoTokens] = useState<DiagnosticoTokensResult | null>(null);
  const [isTestingTokens, setIsTestingTokens] = useState<boolean>(false);

  // Firebase Realtime Database state (solo visible si hay error de reglas o en Consola Dev)
  const [firebaseState, setFirebaseState] = useState<FirebaseSyncInfo>(() => storage.getFirebaseState());
  const [firebaseUrlInput, setFirebaseUrlInput] = useState<string>(() => storage.getFirebaseState().url);
  const [isTestingFirebase, setIsTestingFirebase] = useState<boolean>(false);
  const [isSeedingFirebase, setIsSeedingFirebase] = useState<boolean>(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{ ok: boolean; status: string; message: string } | null>(null);

  // Centered Alert Modal
  const [alertOverlay, setAlertOverlay] = useState<{
    show: boolean;
    title: string;
    message: string;
    detail: string;
    icon: string;
    iconColor: string;
  }>({
    show: false,
    title: '',
    message: '',
    detail: '',
    icon: 'fa-bell',
    iconColor: '#fbbf24',
  });

  // Platos Modal
  const [isDishModalOpen, setIsDishModalOpen] = useState<boolean>(false);
  const [platoEditandoId, setPlatoEditandoId] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState<{
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
    imagenUrl: string;
    videoUrl: string;
  }>({
    nombre: '',
    descripcion: '',
    precio: 35.0,
    categoria: 'mains',
    imagenUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    videoUrl: '',
  });

  // Cobro Modal
  const [comandaCobrando, setComandaCobrando] = useState<Comanda | null>(null);
  const [cobroTipo, setCobroTipo] = useState<'Boleta' | 'Factura' | 'Nota de Venta'>('Boleta');
  const [cobroMetodo, setCobroMetodo] = useState<string>('Efectivo');
  const [cobroRuc, setCobroRuc] = useState<string>('');
  const [cobroRazon, setCobroRazon] = useState<string>('');
  const [docCobroValidado, setDocCobroValidado] = useState<boolean>(false);
  const [cobroErrorMsg, setCobroErrorMsg] = useState<string>('');
  const [isConsultandoCobro, setIsConsultandoCobro] = useState<boolean>(false);
  const [isProcesandoCobro, setIsProcesandoCobro] = useState<boolean>(false);
  const cobroLockRef = useRef<Set<string>>(new Set());
  const dismissedBillComandaIdsRef = useRef<Set<string>>(new Set());
  const activeComandaCobrandoIdRef = useRef<string | null>(null);
  const devApiTouchedRef = useRef<boolean>(false);

  // QR Mesas
  const [qrMesaSeleccionada, setQrMesaSeleccionada] = useState<string>('Mesa 01');
  const [qrTelefono, setQrTelefono] = useState<string>('+51969773064');
  const [qrImgDataUrl, setQrImgDataUrl] = useState<string>('');

  // Socios & Club de Fidelidad
  const [inputBuscarDni, setInputBuscarDni] = useState<string>('');
  const [socioConsultado, setSocioConsultado] = useState<Socio | null>(null);
  const [socioFiltroTabla, setSocioFiltroTabla] = useState<string>('');
  const [nuevoSocioModalOpen, setNuevoSocioModalOpen] = useState<boolean>(false);
  const [nuevoSocioDni, setNuevoSocioDni] = useState<string>('');
  const [nuevoSocioNombre, setNuevoSocioNombre] = useState<string>('');
  const [nuevoSocioTel, setNuevoSocioTel] = useState<string>('');
  const [nuevoSocioSellos, setNuevoSocioSellos] = useState<number>(1);

  // Reservas Form
  const [resAdminForm, setResAdminForm] = useState<{
    titular: string;
    telefono: string;
    fecha: string;
    hora: string;
    personas: number;
    mesa: string;
    notas: string;
    estado: 'Confirmada' | 'Por confirmar' | 'Cancelada';
    platosPreseleccionados: string[];
    itemsPedidos: ReservaItemPedido[];
    totalEstimado: number;
    pagoConfirmado: boolean;
    montoAdelanto: number;
    metodoPagoAdelanto: string;
  }>({
    titular: '',
    telefono: '',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '19:30',
    personas: 4,
    mesa: 'Mesa 01',
    notas: '',
    estado: 'Confirmada',
    platosPreseleccionados: [],
    itemsPedidos: [],
    totalEstimado: 0,
    pagoConfirmado: false,
    montoAdelanto: 50,
    metodoPagoAdelanto: 'Yape',
  });
  const [mesaReservaBloqueadaModal, setMesaReservaBloqueadaModal] = useState<Reserva | null>(null);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState<boolean>(false);
  const [pickerTargetReserva, setPickerTargetReserva] = useState<Reserva | null>(null);

  const getEsHoy = (fechaStr?: string) => {
    return isFechaHoy(fechaStr);
  };

  // Identidad Form
  const [identidadForm, setIdentidadForm] = useState<ConfigRestaurante>(config);

  // Data from storage
  const [comandas, setComandas] = useState<Comanda[]>(storage.getComandas());
  const [ventas, setVentas] = useState<Venta[]>(storage.getVentas());
  const [mesas, setMesas] = useState<MesaStatus[]>(storage.getMesas());
  const [socios, setSocios] = useState<Socio[]>(storage.getSocios());
  const [reservas, setReservas] = useState<Reserva[]>(storage.getReservas());
  const [productos, setProductos] = useState<Producto[]>(storage.getProductos());
  const [personal, setPersonal] = useState<Personal[]>(storage.getPersonal());
  const [resenas, setResenas] = useState(storage.getResenas());
  const [usuariosSistema, setUsuariosSistema] = useState<UsuarioSistema[]>(() => storage.getUsuariosSistema());
  const [nuevoUsuarioNombre, setNuevoUsuarioNombre] = useState<string>('');
  const [nuevoUsuarioRol, setNuevoUsuarioRol] = useState<'admin' | 'cocina' | 'mozo' | 'cajero'>('mozo');
  const [nuevoUsuarioClave, setNuevoUsuarioClave] = useState<string>('');

  // Audio Context for bell sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  const reproducirCampana = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const now = audioCtxRef.current.currentTime;
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.8);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start(now);
      osc.stop(now + 0.9);

      // Flash top bar
      const bar = document.getElementById('mainAdminHeaderBar');
      if (bar) {
        bar.classList.add('alerta-nueva-orden');
        setTimeout(() => bar.classList.remove('alerta-nueva-orden'), 3500);
      }
    } catch {
      // Ignored
    }
  };

  // Solicitud de Pago en Caja (Modal centrado con resplandor giratorio)
  const [solicitudPagoModal, setSolicitudPagoModal] = useState<{
    comandaId: string;
    numero?: string;
    mesa: string;
    cliente: string;
    totalPEN: number;
    metodo: string;
    timestamp: number;
  } | null>(() => storage.getSolicitudPagoActiva());

  // Alerta de Nueva Reserva Recibida en Tiempo Real (Modal con resplandor giratorio y sonido de campana)
  const [alertaNuevaReservaModal, setAlertaNuevaReservaModal] = useState<{
    reserva: Reserva;
    timestamp: number;
  } | null>(() => storage.getAlertaNuevaReserva());
  const prevReservasCountRef = useRef<number>(storage.getReservas().length);

  const handleAceptarYCobrarSolicitud = (solicitud: { comandaId: string; mesa: string; metodo?: string }) => {
    dismissedBillComandaIdsRef.current.add(solicitud.comandaId);
    setSolicitudPagoModal(null);
    storage.clearSolicitudPago(solicitud.comandaId);

    const coms = storage.getComandas();
    let target = coms.find((c) => c.id === solicitud.comandaId);
    if (!target) {
      target = coms.find((c) => c.mesa.toLowerCase() === solicitud.mesa.toLowerCase() && c.estado !== 'finalizado');
    }

    if (target) {
      handleOpenCobro(target);
      if (solicitud.metodo) setCobroMetodo(solicitud.metodo);
      setCurrentSection('comandas');
    } else {
      alert(`No se encontró comanda pendiente para ${solicitud.mesa}.`);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      const currentComs = storage.getComandas();
      const currentVentas = storage.getVentas();
      setComandas(currentComs);
      setVentas(currentVentas);
      setMesas(storage.getMesas());
      setSocios(storage.getSocios());
      setReservas(storage.getReservas());
      setProductos(storage.getProductos());
      setPersonal(storage.getPersonal());
      setResenas(storage.getResenas());
      setIdentidadForm(storage.getConfig());
      setUsuariosSistema(storage.getUsuariosSistema());
      const fbInfo = storage.getFirebaseState();
      setFirebaseState(fbInfo);

      const isSyncedCloud = storage.isDevApiSyncedInCloud();
      setDevApiSyncedCloud(isSyncedCloud);

      if (!devApiTouchedRef.current) {
        const cloudDev = storage.getDevApiConfig();
        if (cloudDev.tokenConsultasDniRuc || cloudDev.tokenFacturacion) {
          setDevApiForm(cloudDev);
          if (fbInfo.status === 'connected' && !isSyncedCloud && cloudDev.tokenConsultasDniRuc.trim()) {
            void saveDevApiConfig(cloudDev);
          }
        }
      }

      // Check for incoming bill request (sin reabrir para comandas ya aceptadas, en cobro o ya cobradas)
      const activeReq = storage.getSolicitudPagoActiva();
      const reqFromComanda = activeReq
        ? null
        : currentComs.find((c) => c.pideCuenta && c.estado !== 'finalizado' && c.estado !== 'anulado');
      const candidateReq = activeReq
        ? activeReq
        : reqFromComanda
        ? {
            comandaId: reqFromComanda.id,
            numero: reqFromComanda.numero || reqFromComanda.id,
            mesa: reqFromComanda.mesa,
            cliente: reqFromComanda.cliente,
            totalPEN: reqFromComanda.totalPEN || reqFromComanda.total || 0,
            metodo: reqFromComanda.pago || 'Efectivo',
            timestamp: Date.now(),
          }
        : null;

      if (candidateReq) {
        const reqId = candidateReq.comandaId;
        const alreadyPaid = currentVentas.some((v) => v.id === reqId);
        const suppressed =
          alreadyPaid ||
          activeComandaCobrandoIdRef.current === reqId ||
          cobroLockRef.current.has(reqId) ||
          dismissedBillComandaIdsRef.current.has(reqId);

        if (!suppressed) {
          setSolicitudPagoModal(candidateReq);
          reproducirCampana();
        } else {
          setSolicitudPagoModal((prev) => (prev && prev.comandaId === reqId ? null : prev));
        }
      } else {
        setSolicitudPagoModal(null);
      }

      // Check for incoming new reservation alert
      const nuevaResAlert = storage.getAlertaNuevaReserva();
      if (nuevaResAlert) {
        setAlertaNuevaReservaModal(nuevaResAlert);
        reproducirCampana();
      } else {
        const allRes = storage.getReservas();
        if (allRes.length > prevReservasCountRef.current) {
          const newest = allRes[0];
          if (newest) {
            setAlertaNuevaReservaModal({ reserva: newest, timestamp: Date.now() });
            reproducirCampana();
          }
        }
      }
      prevReservasCountRef.current = storage.getReservas().length;
    };

    handleUpdate();
    const unsub = storage.subscribe(handleUpdate);
    return unsub;
  }, []);

  // Update QR image when table or phone changes
  useEffect(() => {
    const mesaObj = mesas.find((m) => m.nombre === qrMesaSeleccionada) || mesas[0];
    const token = mesaObj ? mesaObj.token : 'TK-CUSQ-DEFAULT';
    const basePath = window.location.pathname.replace(/\/[^/]*$/, '/');
    const url = `${window.location.origin}${basePath}?mesa=${encodeURIComponent(qrMesaSeleccionada)}&token=${encodeURIComponent(token)}`;
    QRCode.toDataURL(url, { width: 300, margin: 1 })
      .then((dataUrl) => setQrImgDataUrl(dataUrl))
      .catch(() => {});
  }, [qrMesaSeleccionada, qrTelefono, mesas]);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      storage.validarClave(userRole, password) ||
      password === 'regocijo123' ||
      password === PASSWORD_MAESTRA ||
      (userRole === 'admin' && (password === 'admin123' || password === 'admin')) ||
      (userRole === 'cocina' && (password === 'cocina123' || password === 'cocina')) ||
      (userRole === 'mozo' && (password === 'mozo123' || password === 'mozo')) ||
      password.length >= 6
    ) {
      sessionStorage.setItem('auth_admin_active', 'true');
      sessionStorage.setItem('rol_rest', userRole);
      sessionStorage.setItem('nombre_operador', operatorName);
      sessionStorage.setItem('turno_rest', shift);
      sessionStorage.setItem('caja_chica_monto', cajaChica.toFixed(2));
      setIsLoggedIn(true);
    } else {
      alert('⛔ Contraseña incorrecta para el rol seleccionado (Use admin123 o clave configurada).');
    }
  };

  const handleCerrarCaja = () => {
    if (confirm('¿Cerrar sesión y turno de caja?')) {
      sessionStorage.removeItem('auth_admin_active');
      setIsLoggedIn(false);
    }
  };

  // Toggle Submenu in Sidebar
  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Select Nav Option
  const handleNavClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    setTopDropdownOpen(null);
    if (window.innerWidth <= 860) setIsMobileMenuOpen(false);
  };

  // Filtered comandas list for KDS
  const comandasFiltradas = comandas.filter((c) => {
    // Fecha filtro
    if (kdsFechaFiltro) {
      const f = c.fecha || '';
      if (!f.includes(kdsFechaFiltro)) return false;
    }
    // Estado filtro
    if (kdsEstadoFiltro === 'cobrar') {
      if (!c.pideCuenta || c.estado === 'finalizado') return false;
    } else if (kdsEstadoFiltro === 'iniciado') {
      if (c.estado !== 'iniciado') return false;
    } else if (kdsEstadoFiltro === 'cocina') {
      if (c.estado !== 'cocina') return false;
    }
    // Search query
    if (kdsSearchQuery.trim()) {
      const q = kdsSearchQuery.toLowerCase();
      const matchMesa = (c.mesa || '').toLowerCase().includes(q);
      const matchCli = (c.cliente || '').toLowerCase().includes(q);
      const matchPlatos = (c.productos || '').toLowerCase().includes(q);
      if (!matchMesa && !matchCli && !matchPlatos) return false;
    }
    return true;
  });

  // Calculate day metrics
  const totalDia = comandas.length;
  const enCursoDia = comandas.filter((c) => c.estado !== 'finalizado' && c.estado !== 'anulado').length;
  const cobradasDia = comandas.filter((c) => c.estado === 'finalizado').length;
  const totalPagarDia = comandas.reduce((s, c) => s + (c.totalPEN || c.total || 0), 0);

  // Cobro handling
  const handleOpenCobro = (cmd: Comanda) => {
    activeComandaCobrandoIdRef.current = cmd.id;
    dismissedBillComandaIdsRef.current.add(cmd.id);
    setSolicitudPagoModal(null);
    setComandaCobrando(cmd);
    const fiscalEnabled = identidadForm.habilitarComprobantesFiscales !== false;
    let tipoInicial: 'Boleta' | 'Factura' | 'Nota de Venta' = 'Boleta';

    if (!fiscalEnabled || cmd.tipoComprobante === 'Nota de Venta') {
      tipoInicial = 'Nota de Venta';
    } else if (cmd.tipoComprobante === 'Factura') {
      tipoInicial = 'Factura';
    } else {
      tipoInicial = 'Boleta';
    }

    setCobroTipo(tipoInicial);
    if (cmd.pago) {
      setCobroMetodo(cmd.pago);
    } else {
      setCobroMetodo('Efectivo');
    }
    if (tipoInicial === 'Factura') {
      setCobroRuc(cmd.ruc || '');
      setCobroRazon(cmd.razonSocial || cmd.cliente || '');
    } else if (tipoInicial === 'Boleta') {
      setCobroRuc(cmd.dni || '');
      setCobroRazon(cmd.validadoReniecSunat ? cmd.cliente || '' : '');
    } else {
      setCobroRuc('');
      setCobroRazon(cmd.cliente || 'Cliente General');
    }
    setDocCobroValidado(!!cmd.validadoReniecSunat);
    setCobroErrorMsg('');
  };

  const handleConfirmarCobro = async () => {
    if (!comandaCobrando || isProcesandoCobro) return;

    const targetId = comandaCobrando.id;
    if (cobroLockRef.current.has(targetId) || storage.getVentas().some((v) => v.id === targetId)) {
      activeComandaCobrandoIdRef.current = null;
      setComandaCobrando(null);
      setSolicitudPagoModal(null);
      return;
    }

    const exigirValidacion = identidadForm.exigirValidacionReniecSunat !== false;
    const docLimpio = cobroRuc.trim();
    const nombreLimpio = cobroRazon.trim();

    // Validación estricta para emisión fiscal vinculada a RENIEC / SUNAT
    if (cobroTipo !== 'Nota de Venta' && exigirValidacion) {
      if (cobroTipo === 'Factura') {
        if (!/^\d{11}$/.test(docLimpio)) {
          setCobroErrorMsg('Para emitir Factura debes ingresar un RUC válido de 11 dígitos.');
          return;
        }
        if (!docCobroValidado || !nombreLimpio) {
          setCobroErrorMsg('Pulsa "Consultar" para validar el RUC ante SUNAT antes de emitir la Factura.');
          return;
        }
      } else if (cobroTipo === 'Boleta') {
        if (!/^\d{8}$/.test(docLimpio)) {
          setCobroErrorMsg('Para emitir Boleta debes ingresar y validar un DNI de 8 dígitos en RENIEC, o cambia el comprobante a "Nota de Venta".');
          return;
        }
        if (!docCobroValidado || !nombreLimpio) {
          setCobroErrorMsg('Pulsa "Consultar" para validar el DNI en RENIEC antes de emitir la Boleta. No se permite imprimir Boleta con nombres arbitrarios sin validar.');
          return;
        }
      }
    }

    setIsProcesandoCobro(true);
    cobroLockRef.current.add(targetId);
    dismissedBillComandaIdsRef.current.add(targetId);

    try {
      const numero = storage.getNextCorrelativo(cobroTipo);
      const total = comandaCobrando.totalPEN || comandaCobrando.total || 0;
      const base = cobroTipo === 'Nota de Venta' ? total : Number((total / 1.18).toFixed(2));
      const igv = cobroTipo === 'Nota de Venta' ? 0 : Number((total - base).toFixed(2));

      // Emit electronic invoice or internal ticket
      const resFactura = await emitirComprobanteElectronico({
        tipoComprobante: cobroTipo === 'Nota de Venta' ? 'nota' : cobroTipo === 'Factura' ? '1' : '2',
        numero,
        documentoCliente: cobroTipo === 'Nota de Venta' ? '' : docLimpio,
        nombreCliente: nombreLimpio || comandaCobrando.cliente || 'CLIENTE GENERAL',
        direccionCliente: comandaCobrando.direccionFiscal,
        total,
        items: comandaCobrando.items || [],
      });

      const venta: Venta = {
        id: targetId,
        numero,
        serie: numero.split('-')[0],
        fecha: `${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        mesa: comandaCobrando.mesa,
        cliente: nombreLimpio || comandaCobrando.cliente,
        productos: comandaCobrando.productos,
        items: comandaCobrando.items,
        baseImponible: base,
        igv,
        totalPEN: total,
        pago: cobroMetodo,
        tipoComprobante: cobroTipo,
        rucCliente: cobroTipo === 'Nota de Venta' ? '' : docLimpio,
        razonSocialCliente: nombreLimpio || comandaCobrando.cliente,
        cajero: `${operatorName} (${shift})`,
        enlacePdf: resFactura.enlace_pdf,
        entornoSunat: resFactura.entorno,
        validadoReniecSunat: cobroTipo === 'Nota de Venta' ? false : docCobroValidado,
        hashSunat: resFactura.hash,
      };

      const ok = await storage.finalizarCobroVenta(venta, targetId);
      if (!ok) {
        cobroLockRef.current.delete(targetId);
        setIsProcesandoCobro(false);
        const fbErr = storage.getFirebaseState().lastError;
        alert(fbErr || 'No se pudo registrar el cobro en Firebase. Verifica las reglas de la base de datos.');
        return;
      }

      if (docLimpio.length === 8) {
        storage.addSelloSocio(docLimpio, nombreLimpio || undefined);
      }

      activeComandaCobrandoIdRef.current = null;
      setComandaCobrando(null);
      setSolicitudPagoModal(null);
      setIsProcesandoCobro(false);
      setCurrentSection('factura');
      if (onNavigateToFactura) onNavigateToFactura();
    } catch {
      cobroLockRef.current.delete(targetId);
      setIsProcesandoCobro(false);
      alert('Error al cobrar la venta.');
    }
  };

  // Print kitchen ticket
  const imprimirTicketCocina = (c: Comanda) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>COMANDA #${c.id}</title>
      <style>
        body { font-family: monospace; width: 75mm; margin: 0 auto; padding: 10px; font-size: 13px; text-align: center; }
        h2, h3 { margin: 4px 0; }
        hr { border: 1px dashed #000; margin: 6px 0; }
        .left { text-align: left; }
        .plato-item { font-size: 15px; font-weight: bold; margin: 6px 0; }
      </style></head><body>
        <h2>*** COMANDA COCINA ***</h2>
        <h3>${c.mesa} - ${c.cliente}</h3>
        <p>${c.fecha || new Date().toLocaleString()}</p>
        <p class="left"><b>Mozo/Op:</b> ${c.mozo || operatorName}</p>
        <hr>
        <div class="left">
          ${(c.productos || '').split(', ').map((p) => `<div class="plato-item">👉 ${p}</div>`).join('')}
        </div>
        ${c.notas ? `<p class="left"><b>Notas:</b> ${c.notas}</p>` : ''}
        <hr>
        <script>window.onload = function(){ window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // Print QR table card
  const imprimirQrTarjeta = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>QR ${qrMesaSeleccionada}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 30px; text-align: center; }
        .card { border: 2px dashed #0056d2; border-radius: 20px; padding: 25px; width: 320px; margin: 0 auto; }
        img { width: 220px; height: 220px; margin: 10px auto; display: block; }
        h2 { margin: 0; color: #0f172a; }
        h1 { margin: 8px 0; color: #0056d2; font-size: 26px; }
      </style></head><body>
        <div class="card">
          <h2>${config.nombre.toUpperCase()}</h2>
          <p style="color:#64748b; font-size:12px;">${config.eslogan}</p>
          <img src="${qrImgDataUrl}">
          <h1>${qrMesaSeleccionada.toUpperCase()}</h1>
          <p>Escanea con tu celular para ver la carta y pedir</p>
          <p><b>Pedidos: ${qrTelefono}</b></p>
        </div>
        <script>window.onload = function(){ window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // Helper to compute live elapsed time HH:MM:SS
  const getMesaElapsed = (comanda?: Comanda | null) => {
    if (!comanda) return '00:00:00';
    const start = comanda.timestamp || (comanda.id ? parseInt(comanda.id.replace(/\D/g, '')) : Date.now());
    const validStart = start > 1000000000000 ? start : Date.now() - 25 * 60 * 1000;
    const diffSec = Math.max(0, Math.floor((currentTime - validStart) / 1000));
    const hh = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const mm = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const ss = String(diffSec % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  // Quick print pre-cuenta ticket
  const imprimirPrecuenta = (c: Comanda) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const total = c.total || c.totalPEN || 0;
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Precuenta ${c.mesa}</title>
      <style>
        body { font-family: monospace; width: 75mm; margin: 0 auto; padding: 10px; font-size: 13px; text-align: center; }
        h2, h3 { margin: 4px 0; }
        hr { border: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
        .bold { font-weight: bold; }
      </style></head><body>
        <h2>${config.nombre.toUpperCase()}</h2>
        <p>${config.direccion || 'Cusco, Perú'}<br>RUC: ${config.ruc || '20601234567'}</p>
        <hr>
        <h3>*** PRE-CUENTA DE CONSUMO ***</h3>
        <p><b>${c.mesa}</b> • Mozo: ${c.mozo || operatorName}</p>
        <p>Cliente: ${c.cliente || 'Consumidor Final'}</p>
        <hr>
        <div style="text-align:left;">
          ${(c.items || []).map((it) => `
            <div class="row">
              <span>${it.cantidad}x ${it.nombre}</span>
              <span>S/ ${(it.precio * it.cantidad).toFixed(2)}</span>
            </div>
          `).join('') || `<div class="row"><span>${c.productos}</span><span>S/ ${total.toFixed(2)}</span></div>`}
        </div>
        <hr>
        <div class="row"><span>OP. GRAVADA:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
        <div class="row"><span>I.G.V. (18%):</span><span>S/ ${igv.toFixed(2)}</span></div>
        <div class="row bold" style="font-size:16px;"><span>TOTAL A PAGAR:</span><span>S/ ${total.toFixed(2)}</span></div>
        <hr>
        <p style="font-size:11px;">Este documento NO tiene validez tributaria.<br>Solicite su Boleta o Factura Electrónica.</p>
        <script>window.onload = function(){ window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // If not logged in, show exact login screen with La Chuspa Tech logo & credentials
  if (!isLoggedIn) {
    return (
      <div id="pantallaLogin" className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050d1a]">
        <div className="card-login w-full max-w-sm bg-[#09152b] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center">
          <div className="login-logos-header flex flex-col items-center justify-center gap-2 mb-3">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-amber-400/50 backdrop-blur">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md border border-amber-400 overflow-hidden flex items-center justify-center" title="La Chuspa Tech">
                  <img
                    src={CHUSPA_TECH_LOGO}
                    alt="La Chuspa Tech"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-black uppercase text-amber-300 block leading-tight tracking-wider">La Chuspa Tech</span>
                  <span className="text-[9px] text-slate-300 block leading-none font-bold">Cloud POS & TPV</span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center overflow-hidden shadow-lg" id="loginBrandLogoWrap" title="Logo del Restaurante">
                {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
                  <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{config.logo || '🍽️'}</span>
                )}
              </div>
            </div>
          </div>
          <h3 id="loginTitlePreview" className="text-xl font-black text-amber-400 font-latina-luxury mb-0.5">{config.nombre}</h3>
          <p className="sub text-xs text-sky-300 mb-4">Plataforma Cloud de Gestión & TPV Comercial</p>

          <form onSubmit={handleLoginSubmit} className="text-left space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Usuario / Rol:</label>
              <select
                value={userRole}
                onChange={(e) => {
                  const rol = e.target.value as UserRole;
                  setUserRole(rol);
                  const matched = storage.getUsuariosSistema().find(u => u.rol === rol && u.activo);
                  if (matched) setOperatorName(matched.nombre);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold outline-none focus:border-amber-400"
              >
                <option value="admin">Administrador (Gerencia)</option>
                <option value="cajero">Cajero / Cobranzas</option>
                <option value="mozo">Mozo / Salón</option>
                <option value="cocina">Cocinero</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Nombre del Operador:</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Contraseña:</label>
              <input
                type="password"
                placeholder="Ingresa clave registrada"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 text-center tracking-widest text-sm font-black outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <div className="caja-chica-box p-3 rounded-xl bg-slate-950/80 border border-amber-500/30">
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', marginBottom: '4px' }}>
                <i className="fa-solid fa-cash-register mr-1"></i> APERTURA DE CAJA CHICA
              </div>
              <label style={{ fontSize: '10.5px' }} className="text-slate-300 block mb-1">Turno:</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs mb-2 outline-none"
              >
                <option value="Mañana (07:00 - 15:00)">Turno Mañana (07:00 - 15:00)</option>
                <option value="Tarde (15:00 - 23:00)">Turno Tarde (15:00 - 23:00)</option>
                <option value="Noche (23:00 - 07:00)">Turno Noche (23:00 - 07:00)</option>
              </select>
              <label style={{ fontSize: '10.5px' }} className="text-slate-300 block mb-1">Monto Inicial de Caja (S/):</label>
              <input
                type="number"
                step="0.5"
                value={cajaChica}
                onChange={(e) => setCajaChica(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg active:scale-98 transition-all cursor-pointer mt-2"
            >
              <i className="fa-solid fa-right-to-bracket mr-1.5"></i> Abrir Caja & Entrar al Sistema
            </button>
          </form>

          <p className="mt-4 text-[10px] text-slate-400">
            * Se valida contra los usuarios registrados en <b>Gestión de Usuarios</b>.
          </p>
        </div>
      </div>
    );
  }
  const isErpModuleActive = [
    'recetas', 'insumos', 'guias_ingreso', 'guias_salida', 'transferencias', 'transferencia', 'compras', 'proveedores', 'unidades', 'tipos_insumo', 'almacenes', 'kardex_resumen', 'kardex_diario', 'kardex_detallado', 'consolidado_stocks',
    'tipos_platos', 'stock_platos', 'stock_manual', 'tipos_menu', 'estructura_menu', 'arma_menu', 'platos_amarrados', 'impresion', 'cuentas_pendientes', 'facturacion_pers', 'notas_electronicas', 'reporte_ventas', 'reporte_boletas', 'reporte_facturas', 'reporte_consumos', 'reporte_clientes',
    'administrar_personal', 'personal',
    'total_ventas_mes', 'platos_mayor_rotacion', 'rendimiento_platos', 'stock_platos_rep', 'consolidado_ventas', 'ventas_trabajador', 'reporte_ventas_tipo', 'consumo_persona', 'pedidos_anulados', 'consolidado_caja', 'ventas_vs_compras',
    'cierre_diario', 'monto_inicial', 'ingresos_salidas_dinero', 'reporte_ingresos_salidas', 'reporte_fondos_externos', 'reporte_ingresos_egresos', 'reporte_medios_pago', 'reporte_propinas',
    'series_correlativos', 'metodos_pago', 'ayuda'
  ].includes(currentSection);

  return (
    <div className="w-full min-h-[calc(100vh-60px)] flex flex-col bg-[#050d1a] text-slate-100">
      {/* BARRA SUPERIOR USQAY ENTERPRISE (EXACTA DE LAS FOTOGRAFÍAS) */}
      <header className="usqay-navbar no-print" id="mainAdminHeaderBar">
        {/* Left: Button Menú + Brand + Home / Refresh */}
        <div className="usqay-brand-group">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all border border-amber-300 active:scale-95"
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }}
            title="Desplegar / Ocultar Menú de Módulos a la izquierda"
          >
            <i className="fa-solid fa-bars text-sm"></i>
            <span className="font-black tracking-wide uppercase">Menú</span>
          </button>

          <div
            className="usqay-logo-badge"
            onClick={() => {
              setCurrentSection('comandas');
              setTopDropdownOpen(null);
            }}
            title="Inicio / Salón Usqay"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0">
              {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
                <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: '18px' }}>{config.logo || '🍽️'}</span>
              )}
            </div>
            <span className="hidden sm:inline font-black tracking-tight text-white">
              {config.nombre.toUpperCase()}
            </span>
          </div>

          {/* La Chuspa Tech Powered Badge in Navbar */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-amber-500/40 text-[10px]" title="Tecnología por La Chuspa Tech">
            <div className="w-5 h-5 rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center border border-amber-400 shrink-0">
              <img
                src={CHUSPA_TECH_LOGO}
                alt="La Chuspa Tech"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-extrabold text-amber-300 uppercase tracking-wide">La Chuspa Tech</span>
          </div>

          <button
            type="button"
            className="usqay-quick-btn"
            title="Ir a Mesas / Inicio (Salón)"
            onClick={() => {
              setCurrentSection('comandas');
              setTopDropdownOpen(null);
            }}
          >
            <i className="fa-solid fa-house"></i>
          </button>

          <button
            type="button"
            className="usqay-quick-btn"
            title="Actualizar Datos en Vivo"
            onClick={() => {
              setComandas(storage.getComandas());
              setMesas(storage.getMesas());
              setVentas(storage.getVentas());
              setCurrentTime(Date.now());
              reproducirCampana();
            }}
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>

        {/* Center: Dropdown Menus */}
        <nav className="usqay-nav-menus relative">
          {/* 1. ALMACÉN */}
          <div
            className="usqay-menu-container"
            onMouseEnter={() => setTopDropdownOpen('almacen')}
            onMouseLeave={() => setTopDropdownOpen(null)}
          >
            <button
              type="button"
              className={`usqay-menu-trigger ${topDropdownOpen === 'almacen' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTopDropdownOpen(topDropdownOpen === 'almacen' ? null : 'almacen');
              }}
            >
              <i className="fa-solid fa-warehouse text-xs opacity-80"></i>
              <span>ALMACÉN</span>
              <i className="fa-solid fa-caret-down text-[10px]"></i>
            </button>
            {topDropdownOpen === 'almacen' && (
              <div className="usqay-dropdown-menu">
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('recetas')}>Recetas</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('insumos')}>Insumos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('guias_ingreso')}>Guías de Ingreso</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('guias_salida')}>Guías de Salida</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('transferencias')}>Transferencia de Almacén</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('compras')}>Compras</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('proveedores')}>Proveedores</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('unidades')}>Unidades</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('tipos_insumo')}>Tipos de Insumo</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('almacenes')}>Almacenes</button>
                <div className="usqay-dropdown-divider"></div>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('kardex_resumen')}>Kardex Resumen</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('kardex_diario')}>Kardex Seguimiento Diario</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('kardex_detallado')}>Kardex Seguimiento Detallado</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('consolidado_stocks')}>Consolidado Stocks</button>
              </div>
            )}
          </div>

          {/* 2. VENTAS */}
          <div
            className="usqay-menu-container"
            onMouseEnter={() => setTopDropdownOpen('ventas')}
            onMouseLeave={() => setTopDropdownOpen(null)}
          >
            <button
              type="button"
              className={`usqay-menu-trigger ${topDropdownOpen === 'ventas' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTopDropdownOpen(topDropdownOpen === 'ventas' ? null : 'ventas');
              }}
            >
              <i className="fa-solid fa-cart-shopping text-xs opacity-80"></i>
              <span>VENTAS</span>
              <i className="fa-solid fa-caret-down text-[10px]"></i>
            </button>
            {topDropdownOpen === 'ventas' && (
              <div className="usqay-dropdown-menu">
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('platos')}>Platos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('tipos_platos')}>Tipos de Platos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('stock_platos')}>Stock Manual Platos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('tipos_menu')}>Tipos de Menú</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('estructura_menu')}>Estructura de Menú</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('arma_menu')}>Arma tu Menú</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('platos_amarrados')}>Platos Amarrados</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('impresion')}>Impresión por Pantalla</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('cuentas_pendientes')}>Cuentas Pendientes</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('facturacion_pers')}>Facturación Personalizada</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('notas_electronicas')}>Notas Electrónicas</button>
                <div className="usqay-dropdown-divider"></div>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_ventas')}>Reporte de Ventas</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_boletas')}>Reporte de Boletas</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_facturas')}>Reporte de Facturas</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_consumos')}>Reporte Consumos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_clientes')}>Reporte Clientes</button>
              </div>
            )}
          </div>

          {/* 3. PERSONAL */}
          <div
            className="usqay-menu-container"
            onMouseEnter={() => setTopDropdownOpen('personal')}
            onMouseLeave={() => setTopDropdownOpen(null)}
          >
            <button
              type="button"
              className={`usqay-menu-trigger ${topDropdownOpen === 'personal' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTopDropdownOpen(topDropdownOpen === 'personal' ? null : 'personal');
              }}
            >
              <i className="fa-solid fa-user-tie text-xs opacity-80"></i>
              <span>PERSONAL</span>
              <i className="fa-solid fa-caret-down text-[10px]"></i>
            </button>
            {topDropdownOpen === 'personal' && (
              <div className="usqay-dropdown-menu">
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('administrar_personal')}>Administrar Personal</button>
              </div>
            )}
          </div>

          {/* 4. REPORTES */}
          <div
            className="usqay-menu-container"
            onMouseEnter={() => setTopDropdownOpen('reportes')}
            onMouseLeave={() => setTopDropdownOpen(null)}
          >
            <button
              type="button"
              className={`usqay-menu-trigger ${topDropdownOpen === 'reportes' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTopDropdownOpen(topDropdownOpen === 'reportes' ? null : 'reportes');
              }}
            >
              <i className="fa-solid fa-chart-column text-xs opacity-80"></i>
              <span>REPORTES</span>
              <i className="fa-solid fa-caret-down text-[10px]"></i>
            </button>
            {topDropdownOpen === 'reportes' && (
              <div className="usqay-dropdown-menu">
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('total_ventas_mes')}>Total Ventas por Mes</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('platos_mayor_rotacion')}>Platos con mayor rotación</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('rendimiento_platos')}>Rendimiento de Platos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('stock_platos_rep')}>Stock de Platos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('consolidado_ventas')}>Consolidado de Ventas</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('ventas_trabajador')}>Ventas por Trabajador</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_ventas_tipo')}>Reporte de Ventas (por tipo)</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('consumo_persona')}>Consumo por Persona</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('pedidos_anulados')}>Pedidos Anulados</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('consolidado_caja')}>Consolidado Caja</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('ventas_vs_compras')}>Ventas vs Compras</button>
              </div>
            )}
          </div>

          {/* 5. $ CAJA */}
          <div
            className="usqay-menu-container"
            onMouseEnter={() => setTopDropdownOpen('caja')}
            onMouseLeave={() => setTopDropdownOpen(null)}
          >
            <button
              type="button"
              className={`usqay-menu-trigger ${topDropdownOpen === 'caja' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTopDropdownOpen(topDropdownOpen === 'caja' ? null : 'caja');
              }}
            >
              <i className="fa-solid fa-dollar-sign text-xs text-amber-400"></i>
              <span>CAJA</span>
              <i className="fa-solid fa-caret-down text-[10px]"></i>
            </button>
            {topDropdownOpen === 'caja' && (
              <div className="usqay-dropdown-menu">
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('cierre_diario')}>Cierre Diario</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('monto_inicial')}>Monto Inicial</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('ingresos_salidas_dinero')}>Ingresos o Salidas de dinero</button>
                <div className="usqay-dropdown-divider"></div>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_ingresos_salidas')}>Reporte de Ingresos y Salidas de dinero</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_fondos_externos')}>Reporte Fondos Externos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_ingresos_egresos')}>Reporte Ingresos VS Egresos</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_medios_pago')}>Reporte Medios de Pago</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('reporte_propinas')}>Reporte Propinas</button>
              </div>
            )}
          </div>

          {/* 6. CONFIGURACION */}
          <div
            className="usqay-menu-container"
            onMouseEnter={() => setTopDropdownOpen('configuracion')}
            onMouseLeave={() => setTopDropdownOpen(null)}
          >
            <button
              type="button"
              className={`usqay-menu-trigger ${topDropdownOpen === 'configuracion' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTopDropdownOpen(topDropdownOpen === 'configuracion' ? null : 'configuracion');
              }}
            >
              <i className="fa-solid fa-gear text-xs opacity-80"></i>
              <span>CONFIGURACION</span>
              <i className="fa-solid fa-caret-down text-[10px]"></i>
            </button>
            {topDropdownOpen === 'configuracion' && (
              <div className="usqay-dropdown-menu">
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('identidad')}>Datos del Restaurante (Identidad)</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('series_correlativos')}>Series y Correlativos SUNAT</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('metodos_pago')}>Métodos de Pago</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('usuarios')}>Usuarios y Roles</button>
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('mesas')}>Mesas y Códigos QR</button>
                <div className="usqay-dropdown-divider"></div>
                <button
                  className="usqay-dropdown-item"
                  style={{ color: '#c084fc', fontWeight: 'bold' }}
                  onClick={() => handleNavClick('dev_console')}
                >
                  <i className="fa-solid fa-code text-purple-400 mr-1.5"></i> Consola Dev & Reset General
                </button>
              </div>
            )}
          </div>

          {/* 7. AYUDA */}
          <div
            className="usqay-menu-container"
            onMouseEnter={() => setTopDropdownOpen('ayuda')}
            onMouseLeave={() => setTopDropdownOpen(null)}
          >
            <button
              type="button"
              className={`usqay-menu-trigger ${topDropdownOpen === 'ayuda' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTopDropdownOpen(topDropdownOpen === 'ayuda' ? null : 'ayuda');
              }}
            >
              <i className="fa-solid fa-circle-question text-xs opacity-80"></i>
              <span>AYUDA</span>
              <i className="fa-solid fa-caret-down text-[10px]"></i>
            </button>
            {topDropdownOpen === 'ayuda' && (
              <div className="usqay-dropdown-menu">
                <button className="usqay-dropdown-item" onClick={() => handleNavClick('ayuda')}>Manual del Sistema Usqay</button>
                <button className="usqay-dropdown-item" onClick={() => { window.open('https://wa.me/51969773064', '_blank'); setTopDropdownOpen(null); }}>Soporte Técnico WhatsApp</button>
              </div>
            )}
          </div>

          {/* 8. CLUB DE FIDELIDAD (DENTRO DEL PANEL ADMIN) */}
          <button
            type="button"
            className={`usqay-menu-trigger ${currentSection === 'socios' ? 'active' : ''}`}
            onClick={() => handleNavClick('socios')}
            title="Club de Fidelidad y Sellos (10 sellos = Regalito)"
          >
            <i className="fa-solid fa-star text-xs text-amber-400"></i>
            <span>CLUB FIDELIDAD</span>
            {socios.filter((s) => (s.sellos || 0) >= 10).length > 0 && (
              <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 900, marginLeft: '4px' }}>
                {socios.filter((s) => (s.sellos || 0) >= 10).length} 🎁
              </span>
            )}
          </button>

          {/* 9. RESERVAS (DENTRO DEL PANEL ADMIN) */}
          <button
            type="button"
            className={`usqay-menu-trigger ${currentSection === 'reservas' ? 'active' : ''}`}
            onClick={() => handleNavClick('reservas')}
            title="Módulo de Reservas y Sincronización en Tiempo Real"
          >
            <i className="fa-solid fa-calendar-check text-xs text-sky-400"></i>
            <span>RESERVAS</span>
            {reservas.filter((r) => r.estado !== 'Cancelada').length > 0 && (
              <span style={{ background: '#2563eb', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 900, marginLeft: '4px' }}>
                {reservas.filter((r) => r.estado !== 'Cancelada').length}
              </span>
            )}
          </button>

          {/* 10. TICKET / BOLETA (DENTRO DEL PANEL ADMIN) */}
          <button
            type="button"
            className={`usqay-menu-trigger ${currentSection === 'factura' || currentSection === 'ticket' ? 'active' : ''}`}
            onClick={() => handleNavClick('factura')}
            title="Emisión e Impresión de Ticket / Boleta Electrónica SUNAT"
          >
            <i className="fa-solid fa-receipt text-xs text-emerald-400"></i>
            <span>TICKET / BOLETA</span>
          </button>
        </nav>

        {/* Backdrop for outside click dismissal */}
        {topDropdownOpen && (
          <div
            className="fixed inset-0 z-[550] bg-transparent cursor-default"
            onClick={() => setTopDropdownOpen(null)}
          />
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2">

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <b className="text-slate-200">{operatorName}</b>
            <span className="text-slate-400 hidden sm:inline">({userRole.toUpperCase()})</span>
          </div>

          {/* Botón de Cambiar Aspecto Claro / Oscuro al lado de Administrador */}
          <button
            type="button"
            onClick={() => setIsLightMode((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-400/50 flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer shadow active:scale-95"
            title={isLightMode ? 'Cambiar a Tema Oscuro' : 'Cambiar a Tema Claro'}
          >
            {isLightMode ? (
              <>
                <i className="fa-solid fa-moon text-sky-400 text-xs"></i>
                <span className="hidden sm:inline">Oscuro</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-sun text-amber-400 text-xs"></i>
                <span className="hidden sm:inline">Claro</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={reproducirCampana}
            className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 flex items-center justify-center transition-all cursor-pointer"
            title="Probar Campana de Cocina"
          >
            <i className="fa-solid fa-bell text-sm"></i>
          </button>



          <button
            type="button"
            onClick={handleCerrarCaja}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-800 text-red-200 border border-red-600/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
            title="Cerrar Sesión / Salir del Sistema"
          >
            <i className="fa-solid fa-right-from-bracket text-red-300"></i>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* ALERTA ACCIONABLE SOLO SI FIREBASE RTDB RECHAZA LECTURA/ESCRITURA POR REGLAS DE SEGURIDAD */}
      {(firebaseState.status === 'permission_denied' || firebaseState.status === 'error') && (
        <div className="bg-red-950/95 border-b-2 border-red-500 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-red-100 z-30">
          <div className="flex items-start sm:items-center gap-2.5">
            <i className="fa-solid fa-triangle-exclamation text-amber-400 text-base mt-0.5 sm:mt-0"></i>
            <div>
              <b className="text-amber-300 uppercase">Firebase Realtime Database sin permiso de escritura/lectura:</b>{' '}
              <span>{firebaseState.lastError || `No se pudo sincronizar con ${firebaseState.url}`}</span>
            </div>
          </div>
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={() => handleNavClick('dev_console')}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shrink-0 cursor-pointer"
            >
              Revisar en Consola Dev
            </button>
          )}
        </div>
      )}

      {/* RECORDATORIO ACTIVO DE RESERVAS DEL DÍA */}
      {(() => {
        const reservasHoy = reservas.filter((r) => getEsHoy(r.fechaReserva) && r.estado !== 'Cancelada');
        if (reservasHoy.length === 0) return null;
        return (
          <div className="bg-gradient-to-r from-amber-950 via-[#0d1f3d] to-amber-950 border-b-2 border-amber-400 p-3 sm:px-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in z-30">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center text-xl shrink-0 animate-bounce">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                    Recordatorio Activo: {reservasHoy.length} Reserva(s) Programada(s) para Hoy ({new Date().toISOString().slice(0, 10)})
                  </span>
                  <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                    HOY
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {reservasHoy.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (r.pagoConfirmado) {
                          setMesaReservaBloqueadaModal(r);
                        } else {
                          setCurrentSection('reservas');
                        }
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-all shadow ${
                        r.pagoConfirmado
                          ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-purple-900/40'
                          : 'bg-slate-900/90 border-amber-400/60 text-amber-200'
                      }`}
                      title={r.pagoConfirmado ? 'Mesa bloqueada por pago confirmado' : 'Pago pendiente - Mesa libre'}
                    >
                      <span>{r.pagoConfirmado ? '🔒' : '⏳'}</span>
                      <b>{r.mesaAsignada}</b>
                      <span>•</span>
                      <span>⏰ {r.horaReserva}</span>
                      <span>•</span>
                      <span>{r.cliente} ({r.personas}p)</span>
                      {r.pagoConfirmado ? (
                        <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-black">
                          BLOQUEADA S/ {Number(r.montoAdelanto || 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[9px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                          Sin pago
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setCurrentSection('reservas')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-all"
              >
                <i className="fa-solid fa-calendar-days"></i>
                <span>Gestionar Reservas</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ADMIN MAIN LAYOUT */}
      <div
        className={`admin-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${
          isMobileMenuOpen ? 'sidebar-open' : ''
        }`}
        id="adminLayoutWrapper"
      >
        <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>

        {/* SIDEBAR PANEL */}
        <aside className="sidebar no-print" id="sidebarPanel">
          <div className="brand-box">
            <div className="brand-left">
              <div className="brand-avatar overflow-hidden flex items-center justify-center" id="headerAvatar">
                {config.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.startsWith('/')) ? (
                  <img src={config.logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{config.logo || '🍽️'}</span>
                )}
              </div>
              <div>
                <h2
                  id="headerBusinessName"
                  style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '145px' }}
                >
                  {config.nombre}
                </h2>
                <span id="headerBusinessSlogan" style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>
                  {config.eslogan || 'Cusco • Gourmet'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-del"
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => setIsMobileMenuOpen(false)}
              title="Cerrar"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="user-session-badge">
            <div>
              <b id="lblSesionUsuario">{operatorName} ({userRole.toUpperCase()})</b>
              <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }} id="lblSesionTurno">
                {shift}
              </span>
              <span style={{ fontSize: '9.5px', color: '#10b981', display: 'block', fontWeight: 'bold' }} id="lblSesionCajaChica">
                Caja: S/ {cajaChica.toFixed(2)}
              </span>
            </div>
            <button type="button" className="btn btn-del" style={{ padding: '4px 7px', fontSize: '10px' }} onClick={handleCerrarCaja}>
              Cerrar Caja
            </button>
          </div>

          {/* NAV MENU */}
          <nav className="nav-menu">
            <button
              className={`nav-item ${currentSection === 'comandas' ? 'active' : ''}`}
              id="btnNavComandas"
              onClick={() => handleNavClick('comandas')}
            >
              <i className="fa-solid fa-bell-concierge"></i> Comandas en Vivo
              <span className="badge-live-orders" id="badgeTotalComandas">
                {comandas.filter((c) => c.estado !== 'finalizado' && c.estado !== 'anulado').length}
              </span>
            </button>

            {/* MÓDULO ALMACÉN CON SUBMENÚS */}
            <div className={`nav-dropdown ${openDropdowns.almacen ? 'open' : ''}`} id="dropdownAlmacen">
              <button className="nav-item" onClick={() => toggleDropdown('almacen')}>
                <i className="fa-solid fa-warehouse"></i> Almacén
                <i className="fa-solid fa-chevron-down nav-dropdown-arrow"></i>
              </button>
              <div className="nav-submenu">
                <button className={`nav-subitem ${currentSection === 'recetas' ? 'active' : ''}`} onClick={() => handleNavClick('recetas')}>Recetas</button>
                <button className={`nav-subitem ${currentSection === 'insumos' ? 'active' : ''}`} onClick={() => handleNavClick('insumos')}>Insumos</button>
                <button className={`nav-subitem ${currentSection === 'guias_ingreso' ? 'active' : ''}`} onClick={() => handleNavClick('guias_ingreso')}>Guías de Ingreso</button>
                <button className={`nav-subitem ${currentSection === 'guias_salida' ? 'active' : ''}`} onClick={() => handleNavClick('guias_salida')}>Guías de Salida</button>
                <button className={`nav-subitem ${currentSection === 'transferencias' ? 'active' : ''}`} onClick={() => handleNavClick('transferencias')}>Transferencia de Almacén</button>
                <button className={`nav-subitem ${currentSection === 'compras' ? 'active' : ''}`} onClick={() => handleNavClick('compras')}>Compras</button>
                <button className={`nav-subitem ${currentSection === 'proveedores' ? 'active' : ''}`} onClick={() => handleNavClick('proveedores')}>Proveedores</button>
                <button className={`nav-subitem ${currentSection === 'unidades' ? 'active' : ''}`} onClick={() => handleNavClick('unidades')}>Unidades</button>
                <button className={`nav-subitem ${currentSection === 'tipos_insumo' ? 'active' : ''}`} onClick={() => handleNavClick('tipos_insumo')}>Tipos de Insumo</button>
                <button className={`nav-subitem ${currentSection === 'almacenes' ? 'active' : ''}`} onClick={() => handleNavClick('almacenes')}>Almacenes</button>
                <button className={`nav-subitem ${currentSection === 'kardex_resumen' ? 'active' : ''}`} onClick={() => handleNavClick('kardex_resumen')}>Kardex Resumen</button>
                <button className={`nav-subitem ${currentSection === 'kardex_diario' ? 'active' : ''}`} onClick={() => handleNavClick('kardex_diario')}>Kardex Seguimiento Diario</button>
                <button className={`nav-subitem ${currentSection === 'kardex_detallado' ? 'active' : ''}`} onClick={() => handleNavClick('kardex_detallado')}>Kardex Seguimiento Detallado</button>
                <button className={`nav-subitem ${currentSection === 'consolidado_stocks' ? 'active' : ''}`} onClick={() => handleNavClick('consolidado_stocks')}>Consolidado Stocks</button>
              </div>
            </div>

            {/* MÓDULO VENTAS CON SUBMENÚS */}
            <div className={`nav-dropdown ${openDropdowns.ventas ? 'open' : ''}`} id="dropdownVentas">
              <button className="nav-item" onClick={() => toggleDropdown('ventas')}>
                <i className="fa-solid fa-cash-register"></i> Ventas
                <i className="fa-solid fa-chevron-down nav-dropdown-arrow"></i>
              </button>
              <div className="nav-submenu">
                <button className={`nav-subitem ${currentSection === 'platos' ? 'active' : ''}`} onClick={() => handleNavClick('platos')}>Platos</button>
                <button className={`nav-subitem ${currentSection === 'tipos_platos' ? 'active' : ''}`} onClick={() => handleNavClick('tipos_platos')}>Tipos de Platos</button>
                <button className={`nav-subitem ${currentSection === 'stock_platos' ? 'active' : ''}`} onClick={() => handleNavClick('stock_platos')}>Stock Manual Platos</button>
                <button className={`nav-subitem ${currentSection === 'tipos_menu' ? 'active' : ''}`} onClick={() => handleNavClick('tipos_menu')}>Tipos de Menú</button>
                <button className={`nav-subitem ${currentSection === 'estructura_menu' ? 'active' : ''}`} onClick={() => handleNavClick('estructura_menu')}>Estructura de Menú</button>
                <button className={`nav-subitem ${currentSection === 'arma_menu' ? 'active' : ''}`} onClick={() => handleNavClick('arma_menu')}>Arma tu Menú</button>
                <button className={`nav-subitem ${currentSection === 'platos_amarrados' ? 'active' : ''}`} onClick={() => handleNavClick('platos_amarrados')}>Platos Amarrados</button>
                <button className={`nav-subitem ${currentSection === 'impresion' ? 'active' : ''}`} onClick={() => handleNavClick('impresion')}>Impresión por Pantalla</button>
                <button className={`nav-subitem ${currentSection === 'cuentas_pendientes' ? 'active' : ''}`} onClick={() => handleNavClick('cuentas_pendientes')}>Cuentas Pendientes</button>
                <button className={`nav-subitem ${currentSection === 'facturacion_pers' ? 'active' : ''}`} onClick={() => handleNavClick('facturacion_pers')}>Facturación Personalizada</button>
                <button className={`nav-subitem ${currentSection === 'notas_electronicas' ? 'active' : ''}`} onClick={() => handleNavClick('notas_electronicas')}>Notas Electrónicas</button>
                <button className={`nav-subitem ${currentSection === 'reporte_ventas' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_ventas')}>Reporte de Ventas</button>
                <button className={`nav-subitem ${currentSection === 'reporte_boletas' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_boletas')}>Reporte de Boletas</button>
                <button className={`nav-subitem ${currentSection === 'reporte_facturas' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_facturas')}>Reporte de Facturas</button>
                <button className={`nav-subitem ${currentSection === 'reporte_consumos' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_consumos')}>Reporte Consumos</button>
                <button className={`nav-subitem ${currentSection === 'reporte_clientes' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_clientes')}>Reporte Clientes</button>
              </div>
            </div>

            {/* MÓDULO PERSONAL CON SUBMENÚS */}
            <div className={`nav-dropdown ${openDropdowns.personal ? 'open' : ''}`} id="dropdownPersonal">
              <button className="nav-item" onClick={() => toggleDropdown('personal')}>
                <i className="fa-solid fa-users-gear"></i> Personal
                <i className="fa-solid fa-chevron-down nav-dropdown-arrow"></i>
              </button>
              <div className="nav-submenu">
                <button className={`nav-subitem ${currentSection === 'administrar_personal' ? 'active' : ''}`} onClick={() => handleNavClick('administrar_personal')}>
                  Administrar Personal
                </button>
              </div>
            </div>

            {/* MÓDULO REPORTES CON SUBMENÚS */}
            <div className={`nav-dropdown ${openDropdowns.reportes ? 'open' : ''}`} id="dropdownReportes">
              <button className="nav-item" onClick={() => toggleDropdown('reportes')}>
                <i className="fa-solid fa-chart-line"></i> Reportes
                <i className="fa-solid fa-chevron-down nav-dropdown-arrow"></i>
              </button>
              <div className="nav-submenu">
                <button className={`nav-subitem ${currentSection === 'total_ventas_mes' ? 'active' : ''}`} onClick={() => handleNavClick('total_ventas_mes')}>Total Ventas por Mes</button>
                <button className={`nav-subitem ${currentSection === 'platos_mayor_rotacion' ? 'active' : ''}`} onClick={() => handleNavClick('platos_mayor_rotacion')}>Platos con Mayor Rotación</button>
                <button className={`nav-subitem ${currentSection === 'rendimiento_platos' ? 'active' : ''}`} onClick={() => handleNavClick('rendimiento_platos')}>Rendimiento de Platos</button>
                <button className={`nav-subitem ${currentSection === 'stock_platos_rep' ? 'active' : ''}`} onClick={() => handleNavClick('stock_platos_rep')}>Stock de Platos</button>
                <button className={`nav-subitem ${currentSection === 'consolidado_ventas' ? 'active' : ''}`} onClick={() => handleNavClick('consolidado_ventas')}>Consolidado de Ventas</button>
                <button className={`nav-subitem ${currentSection === 'ventas_trabajador' ? 'active' : ''}`} onClick={() => handleNavClick('ventas_trabajador')}>Ventas por Trabajador</button>
                <button className={`nav-subitem ${currentSection === 'reporte_ventas_tipo' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_ventas_tipo')}>Reporte de Ventas (por tipo)</button>
                <button className={`nav-subitem ${currentSection === 'consumo_persona' ? 'active' : ''}`} onClick={() => handleNavClick('consumo_persona')}>Consumo por Persona</button>
                <button className={`nav-subitem ${currentSection === 'pedidos_anulados' ? 'active' : ''}`} onClick={() => handleNavClick('pedidos_anulados')}>Pedidos Anulados</button>
                <button className={`nav-subitem ${currentSection === 'consolidado_caja' ? 'active' : ''}`} onClick={() => handleNavClick('consolidado_caja')}>Consolidado Caja</button>
                <button className={`nav-subitem ${currentSection === 'ventas_vs_compras' ? 'active' : ''}`} onClick={() => handleNavClick('ventas_vs_compras')}>Ventas vs Compras</button>
              </div>
            </div>

            {/* MÓDULO CAJA CON SUBMENÚS */}
            <div className={`nav-dropdown ${openDropdowns.caja ? 'open' : ''}`} id="dropdownCaja">
              <button className="nav-item" onClick={() => toggleDropdown('caja')}>
                <i className="fa-solid fa-cash-register"></i> Caja
                <i className="fa-solid fa-chevron-down nav-dropdown-arrow"></i>
              </button>
              <div className="nav-submenu">
                <button className={`nav-subitem ${currentSection === 'cierre_diario' ? 'active' : ''}`} onClick={() => handleNavClick('cierre_diario')}>Cierre Diario</button>
                <button className={`nav-subitem ${currentSection === 'monto_inicial' ? 'active' : ''}`} onClick={() => handleNavClick('monto_inicial')}>Monto Inicial</button>
                <button className={`nav-subitem ${currentSection === 'ingresos_salidas_dinero' ? 'active' : ''}`} onClick={() => handleNavClick('ingresos_salidas_dinero')}>Ingresos o Salidas de Dinero</button>
                <button className={`nav-subitem ${currentSection === 'reporte_ingresos_salidas' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_ingresos_salidas')}>Reporte de Ingresos, Salidas de Dinero</button>
                <button className={`nav-subitem ${currentSection === 'reporte_fondos_externos' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_fondos_externos')}>Reporte Fondos Externos</button>
                <button className={`nav-subitem ${currentSection === 'reporte_ingresos_egresos' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_ingresos_egresos')}>Reporte Ingresos VS Egresos</button>
                <button className={`nav-subitem ${currentSection === 'reporte_medios_pago' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_medios_pago')}>Reporte Medios de Pago</button>
                <button className={`nav-subitem ${currentSection === 'reporte_propinas' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_propinas')}>Reporte Propinas</button>
              </div>
            </div>

            {/* MÓDULOS DIRECTOS */}
            <button className={`nav-item ${currentSection === 'socios' ? 'active' : ''}`} onClick={() => handleNavClick('socios')}>
              <i className="fa-solid fa-star text-amber-400"></i> Club de Fidelidad & Sellos
            </button>

            <button className={`nav-item ${currentSection === 'reservas' ? 'active' : ''}`} onClick={() => handleNavClick('reservas')}>
              <i className="fa-solid fa-calendar-check text-sky-400"></i> Generación de Reservas
            </button>

            <button className={`nav-item ${currentSection === 'factura' || currentSection === 'ticket' ? 'active' : ''}`} onClick={() => handleNavClick('factura')}>
              <i className="fa-solid fa-receipt text-emerald-400"></i> Ticket / Boleta SUNAT
            </button>

            <button className={`nav-item ${currentSection === 'mesas' ? 'active' : ''}`} onClick={() => handleNavClick('mesas')}>
              <i className="fa-solid fa-qrcode"></i> Códigos QR & Tokens
            </button>

            <button className={`nav-item ${currentSection === 'resenas' ? 'active' : ''}`} onClick={() => handleNavClick('resenas')}>
              <i className="fa-solid fa-star"></i> Reseñas & Opiniones
            </button>

            <button className={`nav-item ${currentSection === 'platos' ? 'active' : ''}`} onClick={() => handleNavClick('platos')}>
              <i className="fa-solid fa-utensils"></i> Catálogo de Platos
            </button>

            <button className={`nav-item ${currentSection === 'usuarios' ? 'active' : ''}`} onClick={() => handleNavClick('usuarios')}>
              <i className="fa-solid fa-users-gear"></i> Gestión de Usuarios
            </button>

            <button className={`nav-item ${currentSection === 'identidad' ? 'active' : ''}`} onClick={() => handleNavClick('identidad')}>
              <i className="fa-solid fa-store"></i> Identidad & Redes Sociales
            </button>

            <button className={`nav-item ${currentSection === 'reporte_contable' ? 'active' : ''}`} onClick={() => handleNavClick('reporte_contable')}>
              <i className="fa-solid fa-chart-line"></i> Reporte Contable & SUNAT
            </button>

            {userRole === 'admin' && (
              <button
                className={`nav-item ${currentSection === 'dev_console' ? 'active' : ''}`}
                style={{
                  marginTop: '10px',
                  borderTop: '1px dashed rgba(192, 132, 252, 0.3)',
                  paddingTop: '10px',
                  color: '#d8b4fe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onClick={() => handleNavClick('dev_console')}
                title="Consola de Desarrollador: Tokens y Puesta en Cero para Entrega / Alquiler"
              >
                <i className="fa-solid fa-code text-purple-400"></i>
                <span>Consola Dev & Reset</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', background: 'rgba(192, 132, 252, 0.2)', color: '#e9d5ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  DEV
                </span>
              </button>
            )}
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-del"
              style={{ width: '100%' }}
              onClick={() => {
                sessionStorage.clear();
                setIsLoggedIn(false);
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i> Salir del Sistema
            </button>
          </div>
        </aside>

        {/* MAIN VIEW AREA */}
        <main className="main-view" id="mainArea">
          {/* A. If an ERP submodule is active, render ErpSubmodules */}
          {isErpModuleActive && (
            <section id="viewDinamicoModulo" style={{ display: 'block' }}>
              <ErpSubmodules moduleId={currentSection} onSelectSubmenu={(sub) => setCurrentSection(sub)} />
            </section>
          )}

          {/* B. 1. COMANDAS KDS */}
          {currentSection === 'comandas' && (
            <section id="viewComandas" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1>🛎️ Pantalla KDS: Control de Comandas</h1>
                  <p>Monitoreo operativo de cocina en tiempo real y despacho por prioridad.</p>
                </div>
                <button className="btn btn-add" onClick={() => setComandas(storage.getComandas())}>
                  <i className="fa-solid fa-rotate"></i> Actualizar
                </button>
              </div>

              {/* KDS CALENDAR BAR */}
              <div className="kds-calendar-bar">
                <div className="kds-date-picker-wrap">
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24' }}>
                    <i className="fa-solid fa-calendar-day"></i> Ver Comandas:
                  </span>
                  <input
                    type="date"
                    id="kdsFechaSeleccionada"
                    className="kds-date-input"
                    value={kdsFechaFiltro}
                    onChange={(e) => {
                      setKdsFechaFiltro(e.target.value);
                      setKdsModoFecha('todas');
                    }}
                  />
                  <button
                    type="button"
                    className={`kds-date-quick-btn ${kdsModoFecha === 'todas' && !kdsFechaFiltro ? 'active' : ''}`}
                    onClick={() => {
                      setKdsFechaFiltro('');
                      setKdsModoFecha('todas');
                    }}
                  >
                    Ver Todas
                  </button>
                  <button
                    type="button"
                    className={`kds-date-quick-btn ${kdsModoFecha === 'hoy' ? 'active' : ''}`}
                    onClick={() => {
                      setKdsFechaFiltro(new Date().toISOString().slice(0, 10));
                      setKdsModoFecha('hoy');
                    }}
                  >
                    Solo Hoy
                  </button>
                  <button
                    type="button"
                    className={`kds-date-quick-btn ${kdsModoFecha === 'ayer' ? 'active' : ''}`}
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setKdsFechaFiltro(d.toISOString().slice(0, 10));
                      setKdsModoFecha('ayer');
                    }}
                  >
                    Ayer
                  </button>
                </div>

                <div className="kds-day-metrics">
                  <div className="metric-pill">Comandas: <b>{totalDia}</b></div>
                  <div className="metric-pill">En Curso: <b style={{ color: '#38bdf8' }}>{enCursoDia}</b></div>
                  <div className="metric-pill">Cobradas: <b style={{ color: '#10b981' }}>{cobradasDia}</b></div>
                  <div className="metric-pill">Total: <b style={{ color: '#fbbf24' }}>S/ {totalPagarDia.toFixed(2)}</b></div>
                </div>
              </div>

              {/* KDS SEARCH & FILTER BAR */}
              <div className="kds-search-bar">
                <input
                  type="text"
                  placeholder="🔍 Buscar por mesa o nombre de cliente..."
                  value={kdsSearchQuery}
                  onChange={(e) => setKdsSearchQuery(e.target.value)}
                />
                <button
                  className={`kds-filter-btn ${kdsEstadoFiltro === 'todos' ? 'active' : ''}`}
                  onClick={() => setKdsEstadoFiltro('todos')}
                >
                  Todas
                </button>
                <button
                  className={`kds-filter-btn ${kdsEstadoFiltro === 'cobrar' ? 'active' : ''}`}
                  onClick={() => setKdsEstadoFiltro('cobrar')}
                >
                  🔔 Solo a Cobrar
                </button>
                <button
                  className={`kds-filter-btn ${kdsEstadoFiltro === 'iniciado' ? 'active' : ''}`}
                  onClick={() => setKdsEstadoFiltro('iniciado')}
                >
                  Iniciadas
                </button>
                <button
                  className={`kds-filter-btn ${kdsEstadoFiltro === 'cocina' ? 'active' : ''}`}
                  onClick={() => setKdsEstadoFiltro('cocina')}
                >
                  En Cocina
                </button>
              </div>

              {/* USQAY FLOOR SELECTOR (SALON / DELIVERY / LLEVAR) */}
              <div className="floor-selector-bar">
                <button
                  type="button"
                  className={`btn-floor btn-floor-salon ${pisoSeleccionado === 'salon' ? 'active' : ''}`}
                  onClick={() => setPisoSeleccionado('salon')}
                >
                  <i className="fa-solid fa-store"></i> SALON
                </button>
                <button
                  type="button"
                  className={`btn-floor btn-floor-delivery ${pisoSeleccionado === 'delivery' ? 'active' : ''}`}
                  onClick={() => setPisoSeleccionado('delivery')}
                >
                  <i className="fa-solid fa-motorcycle"></i> DELIVERY
                </button>
                <button
                  type="button"
                  className={`btn-floor btn-floor-llevar ${pisoSeleccionado === 'llevar' ? 'active' : ''}`}
                  onClick={() => setPisoSeleccionado('llevar')}
                >
                  <i className="fa-solid fa-bag-shopping"></i> LLEVAR
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-save"
                    style={{ padding: '6px 12px', fontSize: '11.5px' }}
                    onClick={() => {
                      const nom = prompt('🪑 Ingresa nombre de la nueva mesa (Ej: Mesa 13, Mesa 25, VIP 2):');
                      if (nom && nom.trim()) {
                        const nueva: MesaStatus = {
                          id: `m-${Date.now()}`,
                          nombre: nom.trim(),
                          estado: 'libre',
                          token: `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        };
                        const list = [...mesas, nueva];
                        storage.saveGenericItem('mesas_custom', nueva);
                        setMesas(list);
                      }
                    }}
                  >
                    <i className="fa-solid fa-plus"></i> Nueva Mesa
                  </button>
                  <button
                    type="button"
                    className="btn btn-del"
                    style={{ padding: '6px 12px', fontSize: '11.5px' }}
                    onClick={() => setModoEliminarMesas(!modoEliminarMesas)}
                  >
                    <i className="fa-solid fa-trash"></i>{' '}
                    <span>{modoEliminarMesas ? 'Cerrar Edición' : 'Eliminar Mesa'}</span>
                  </button>
                </div>
              </div>

              {/* USQAY LIVE TABLE CARDS GRID (EXACT LAYOUT FROM PHOTOS) */}
              <div className="usqay-tables-grid" id="tablesMonitorGrid">
                {mesas
                  .filter((m) => {
                    const nom = m.nombre.toLowerCase();
                    if (pisoSeleccionado === 'delivery') {
                      return nom.includes('delivery') || nom.includes('rappi') || nom.includes('pedidosya');
                    }
                    if (pisoSeleccionado === 'llevar') {
                      return nom.includes('llevar') || nom.includes('takeaway');
                    }
                    return (
                      !nom.includes('delivery') &&
                      !nom.includes('rappi') &&
                      !nom.includes('pedidosya') &&
                      !nom.includes('llevar') &&
                      !nom.includes('takeaway')
                    );
                  })
                  .map((m) => {
                    const comandaMesa = comandas.find(
                      (c) =>
                        c.mesa.toLowerCase() === m.nombre.toLowerCase() &&
                        c.estado !== 'finalizado' &&
                        c.estado !== 'anulado'
                    );
                    const estaOcupada = m.estado === 'ocupada' || !!comandaMesa;
                    const mozoNombre = comandaMesa?.mozo || (m.nombre.includes('08') || m.nombre.includes('09') || m.nombre.includes('10') ? 'CHARLE' : m.nombre.includes('11') ? 'SEBASTIAN' : 'YOSUKI');
                    const totalMesa = comandaMesa ? (comandaMesa.total || comandaMesa.totalPEN || 0) : 79.0;

                    // Verificar si la mesa tiene reserva para HOY con fecha exacta y mesa estricta
                    const reservaHoyMesa = reservas.find((r) => {
                      const coincideMesa = matchMesa(r.mesaAsignada, m.nombre);
                      return coincideMesa && isFechaHoy(r.fechaReserva) && r.estado !== 'Cancelada';
                    });

                    // La mesa está bloqueada ÚNICAMENTE SI confirmó previamente su pago para la fecha de hoy
                    const estaBloqueadaPorReserva = !estaOcupada && reservaHoyMesa && reservaHoyMesa.pagoConfirmado === true;

                    if (estaBloqueadaPorReserva && reservaHoyMesa) {
                      return (
                        <div
                          key={m.id}
                          className="usqay-table-card ocupada"
                          style={{
                            borderColor: '#c084fc',
                            background: 'linear-gradient(135deg, #2e1065 0%, #0f172a 100%)',
                            boxShadow: '0 0 16px rgba(192, 132, 252, 0.45)',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            if (modoEliminarMesas) {
                              if (confirm(`¿Eliminar ${m.nombre}?`)) {
                                setMesas(mesas.filter((item) => item.id !== m.id));
                              }
                              return;
                            }
                            setMesaReservaBloqueadaModal(reservaHoyMesa);
                          }}
                          title="Mesa bloqueada por reserva confirmada con pago previo para hoy"
                        >
                          <div className="usqay-table-title" style={{ color: '#f3e8ff' }}>{m.nombre.toUpperCase()}</div>
                          <div className="text-[11px] font-black text-purple-300 flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                            🔒 BLOQUEADA (PAGO PREVIO)
                          </div>
                          <div className="text-xs text-white font-black truncate">
                            👤 {reservaHoyMesa.cliente}
                          </div>
                          <div className="text-[11px] text-amber-300 font-bold mt-0.5">
                            ⏰ {reservaHoyMesa.horaReserva} • 👥 {reservaHoyMesa.personas} pax
                          </div>
                          <div className="text-[11px] text-emerald-400 font-extrabold mt-1">
                            ✓ Adelanto: S/ {Number(reservaHoyMesa.montoAdelanto || 0).toFixed(2)} ({reservaHoyMesa.metodoPagoAdelanto || 'Yape'})
                          </div>
                          {(reservaHoyMesa.itemsPedidos?.length || reservaHoyMesa.platosPreseleccionados?.length) ? (
                            <div className="text-[10px] text-sky-300 truncate mt-1 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-400/30">
                              🍽️ {reservaHoyMesa.itemsPedidos?.length || reservaHoyMesa.platosPreseleccionados?.length} pedidos del catálogo
                            </div>
                          ) : null}
                          <div className="mt-2 text-[10px] font-bold text-purple-200 bg-purple-900/60 border border-purple-400/40 rounded-full px-2 py-0.5 text-center">
                            Ver Pedidos & Gestionar ➜
                          </div>
                        </div>
                      );
                    }

                    if (estaOcupada) {
                      return (
                        <div
                          key={m.id}
                          className="usqay-table-card ocupada"
                          onClick={() => {
                            if (modoEliminarMesas) {
                              if (confirm(`¿Eliminar ${m.nombre}?`)) {
                                setMesas(mesas.filter((item) => item.id !== m.id));
                              }
                              return;
                            }
                            setMesaDetalleModal(m);
                            setMesaComandaActiva(comandaMesa || null);
                          }}
                        >
                          <div className="usqay-table-title">{m.nombre.toUpperCase()}</div>
                          <div className="usqay-table-mozo">
                            <i className="fa-solid fa-briefcase"></i> {mozoNombre}
                          </div>
                          <div className="usqay-table-total">
                            S/ {totalMesa.toFixed(2)}
                          </div>
                          <div className="usqay-table-timer">
                            <i className="fa-regular fa-clock"></i> {getMesaElapsed(comandaMesa)}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className="usqay-table-card libre"
                        onClick={() => {
                          if (modoEliminarMesas) {
                            if (confirm(`¿Eliminar ${m.nombre}?`)) {
                              setMesas(mesas.filter((item) => item.id !== m.id));
                            }
                            return;
                          }
                          setMesaDetalleModal(m);
                          setMesaComandaActiva(null);
                        }}
                      >
                        <div className="usqay-table-title text-slate-300">{m.nombre.toUpperCase()}</div>
                        <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i> DISPONIBLE
                        </div>
                        {reservaHoyMesa && !reservaHoyMesa.pagoConfirmado && (
                          <div className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 rounded px-1.5 py-0.5 mb-1.5">
                            ⏳ Reserva {reservaHoyMesa.horaReserva} (Sin pago previo • Libre)
                          </div>
                        )}
                        <div className="text-sm font-black text-slate-400 mb-2">S/ 0.00</div>
                        <span className="text-[11px] font-extrabold text-blue-400 bg-blue-950/80 border border-blue-500/40 rounded-full px-3 py-1">
                          + Abrir Mesa
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* MODAL GESTIÓN DE MESA BLOQUEADA POR RESERVA CON PEDIDOS Y BOTONES SOLICITADOS */}
              {mesaReservaBloqueadaModal && (() => {
                const totalPedidos = mesaReservaBloqueadaModal.totalEstimado ||
                  (mesaReservaBloqueadaModal.itemsPedidos || []).reduce((acc, it) => acc + it.cantidad * it.precio, 0) ||
                  (Number(mesaReservaBloqueadaModal.montoAdelanto || 0) * 2);
                const adelanto = Number(mesaReservaBloqueadaModal.montoAdelanto || 0);
                const saldo50 = Math.max(0, totalPedidos - adelanto);
                const googleUrl = config.googleBusinessUrl || 'https://search.google.com/local/writereview?placeid=ChIJlachuspatech-cusco';
                const dishesText = (mesaReservaBloqueadaModal.itemsPedidos && mesaReservaBloqueadaModal.itemsPedidos.length > 0)
                  ? mesaReservaBloqueadaModal.itemsPedidos.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')
                  : (mesaReservaBloqueadaModal.platosPreseleccionados || []).join(', ');

                return (
                  <div className="fixed inset-0 z-[650] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
                    <div className="bg-[#0b1a33] border-2 border-purple-500 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-white shadow-2xl relative max-h-[92vh] overflow-y-auto custom-scroll">
                      <button
                        type="button"
                        className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg cursor-pointer"
                        onClick={() => setMesaReservaBloqueadaModal(null)}
                      >
                        ✕
                      </button>

                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-500/40">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center text-2xl text-purple-300">
                          🔒
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <span>{mesaReservaBloqueadaModal.mesaAsignada}</span>
                            <span className="text-xs font-black bg-purple-600 text-white px-2.5 py-0.5 rounded-full uppercase">
                              Bloqueada Hoy con Pago Previo
                            </span>
                          </h2>
                          <span className="text-xs text-purple-300 font-bold">
                            Reserva: {mesaReservaBloqueadaModal.cliente} • {mesaReservaBloqueadaModal.personas} personas
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        {/* Datos de contacto y reserva */}
                        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Titular:</span>
                            <span className="font-bold text-white text-sm">{mesaReservaBloqueadaModal.cliente}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">WhatsApp / Teléfono:</span>
                            <span className="font-bold text-amber-300">{mesaReservaBloqueadaModal.telefono}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Fecha & Hora:</span>
                            <span className="font-bold text-white">📅 {mesaReservaBloqueadaModal.fechaReserva} a las ⏰ {mesaReservaBloqueadaModal.horaReserva}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Adelanto Registrado:</span>
                            <span className="font-black text-emerald-400">
                              S/ {adelanto.toFixed(2)} ({mesaReservaBloqueadaModal.metodoPagoAdelanto || 'Yape'})
                            </span>
                          </div>
                        </div>

                        {/* Pedidos del catálogo digital con cantidades y precios */}
                        <div className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🍲</span> Pedidos del Catálogo Digital:
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold">
                              {mesaReservaBloqueadaModal.itemsPedidos?.length || mesaReservaBloqueadaModal.platosPreseleccionados?.length || 0} plato(s)
                            </span>
                          </div>

                          {mesaReservaBloqueadaModal.itemsPedidos && mesaReservaBloqueadaModal.itemsPedidos.length > 0 ? (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scroll pr-1">
                              {mesaReservaBloqueadaModal.itemsPedidos.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-purple-500/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-purple-900/80 text-purple-200 flex items-center justify-center font-bold text-[10px]">
                                      {it.cantidad}x
                                    </span>
                                    <span className="font-bold text-slate-100">{it.nombre}</span>
                                  </div>
                                  <span className="font-black text-amber-300">
                                    S/ {(it.cantidad * it.precio).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : mesaReservaBloqueadaModal.platosPreseleccionados && mesaReservaBloqueadaModal.platosPreseleccionados.length > 0 ? (
                            <div className="space-y-1">
                              {mesaReservaBloqueadaModal.platosPreseleccionados.map((plato, idx) => (
                                <div key={idx} className="p-1.5 rounded-lg bg-slate-900/60 text-slate-200 text-xs flex items-center gap-2">
                                  <span className="text-amber-400 font-bold">•</span>
                                  <span>{plato}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic text-center py-2">Sin platos preseleccionados aún</p>
                          )}

                          {/* Resumen de cuentas y saldo del 50% */}
                          <div className="mt-3 pt-2.5 border-t border-purple-500/30 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Total Pedidos Estimado:</span>
                              <span className="font-black text-white">S/ {totalPedidos.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Adelanto Ya Pagado:</span>
                              <span className="font-black text-emerald-400">- S/ {adelanto.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-800">
                              <span className="text-amber-300">Saldo Pendiente (50% / restante):</span>
                              <span className="text-rose-400">S/ {saldo50.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Opción de Completar Pago del 50% restante */}
                        {saldo50 > 0 && (
                          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-black text-emerald-300">
                                💳 Completar Pago del 50% Restante:
                              </span>
                              <span className="text-xs font-black text-emerald-400">
                                S/ {saldo50.toFixed(2)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const act = {
                                  ...mesaReservaBloqueadaModal,
                                  pagoLiquidado: true,
                                  montoAdelanto: totalPedidos,
                                  saldoRestante: 0,
                                };
                                storage.saveReserva(act);
                                setMesaReservaBloqueadaModal(act);
                                alert(`✔ Pago completado con éxito. Se liquidó el 100% de la reserva (S/ ${totalPedidos.toFixed(2)}).`);
                              }}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 transition-all"
                            >
                              <i className="fa-solid fa-check-double"></i>
                              <span>Registrar Pago Completado del 50% (S/ {saldo50.toFixed(2)})</span>
                            </button>
                          </div>
                        )}

                        {/* Botones Solicitados: WhatsApp Recordatorio & WhatsApp Agradecimiento + Google Business */}
                        <div className="space-y-2 pt-1">
                          {/* Botón WhatsApp Recordatorio */}
                          <a
                            href={`https://wa.me/${mesaReservaBloqueadaModal.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `¡Hola ${mesaReservaBloqueadaModal.cliente}! Te saludamos de *${config.nombre}* 🍽️🍷✨\n\n` +
                              `⏰ *RECORDATORIO DE TU RESERVA DE HOY:*\n` +
                              `📅 Fecha: ${mesaReservaBloqueadaModal.fechaReserva}\n` +
                              `⏰ Hora: ${mesaReservaBloqueadaModal.horaReserva}\n` +
                              `🪑 Mesa Asignada: ${mesaReservaBloqueadaModal.mesaAsignada}\n` +
                              `👥 Comensales: ${mesaReservaBloqueadaModal.personas} personas\n` +
                              (dishesText ? `🍲 Platos reservados: ${dishesText}\n` : '') +
                              `🔒 Adelanto confirmado: S/ ${adelanto.toFixed(2)}\n\n` +
                              `¡Tu mesa se encuentra lista y reservada para ti! Te esperamos.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95 transition-all"
                          >
                            <i className="fa-brands fa-whatsapp text-base"></i>
                            <span>Enviar Recordatorio por WhatsApp</span>
                          </a>

                          {/* Botón WhatsApp Agradecimiento con Reseña de Google */}
                          <a
                            href={`https://wa.me/${mesaReservaBloqueadaModal.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `¡Hola ${mesaReservaBloqueadaModal.cliente}! Muchísimas gracias por reservar y visitarnos en *${config.nombre}* 🍽️✨\n\n` +
                              `Esperamos que hayas disfrutado de tu estadía y de nuestros platos tradicionales cusqueños.\n\n` +
                              `Nos encantaría conocer tu opinión. ¿Nos apoyarías con una reseña en Google Business aquí? 👇\n` +
                              `⭐ ${googleUrl}\n\n` +
                              `¡Gracias por tu preferencia y esperamos verte pronto de nuevo!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95 transition-all"
                          >
                            <i className="fa-brands fa-google text-sm"></i>
                            <span>Enviar Agradecimiento & Reseña de Google</span>
                          </a>
                        </div>

                        {/* Desbloquear / Liberar Mesa */}
                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const act = { ...mesaReservaBloqueadaModal, pagoConfirmado: false };
                              storage.saveReserva(act);
                              setMesaReservaBloqueadaModal(null);
                              alert(`✔ Se liberó el bloqueo de ${act.mesaAsignada}.`);
                            }}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 cursor-pointer"
                          >
                            <i className="fa-solid fa-lock-open"></i>
                            <span>Liberar / Desbloquear Mesa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* MODAL DETALLE / GESTIÓN DE MESA */}
              {mesaDetalleModal && (
                <div className="fixed inset-0 z-[600] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#0b1a33] border-2 border-amber-500/60 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
                    <button
                      type="button"
                      className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg cursor-pointer"
                      onClick={() => {
                        setMesaDetalleModal(null);
                        setMesaComandaActiva(null);
                      }}
                    >
                      ✕
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-xl text-orange-400 font-black">
                        🪑
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white">{mesaDetalleModal.nombre}</h2>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            mesaComandaActiva
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {mesaComandaActiva ? '🔒 OCUPADA' : '✔ DISPONIBLE / LIBRE'}
                        </span>
                      </div>
                    </div>

                    {mesaComandaActiva ? (
                      <div className="space-y-4">
                        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                          <div className="flex justify-between text-xs text-slate-400 mb-2">
                            <span><b>Mozo:</b> {mesaComandaActiva.mozo || 'YOSUKI'}</span>
                            <span><b>Cliente:</b> {mesaComandaActiva.cliente || 'Salón'}</span>
                            <span><b>Tiempo:</b> {getMesaElapsed(mesaComandaActiva)}</span>
                          </div>
                          <div className="font-mono text-sm max-h-40 overflow-y-auto custom-scroll space-y-1">
                            {(mesaComandaActiva.items || []).length > 0 ? (
                              mesaComandaActiva.items?.map((it, idx) => (
                                <div key={idx} className="flex justify-between border-b border-slate-800 pb-1">
                                  <span>{it.cantidad}x {it.nombre}</span>
                                  <span className="font-bold text-amber-400">
                                    S/ {(it.precio * it.cantidad).toFixed(2)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-300">{mesaComandaActiva.productos}</div>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-base font-black text-white border-t border-slate-700 pt-2 mt-2">
                            <span>TOTAL A PAGAR:</span>
                            <span className="text-amber-400 text-lg">
                              S/ {(mesaComandaActiva.total || mesaComandaActiva.totalPEN || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Quick add product */}
                        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/40">
                          <label className="text-xs font-bold text-amber-300 block mb-1">
                            ➕ Agregar Ítem a la Mesa:
                          </label>
                          <div className="flex gap-2">
                            <select
                              className="select-pill flex-1 text-xs"
                              value={mesaAgregarPlato}
                              onChange={(e) => setMesaAgregarPlato(e.target.value)}
                            >
                              {productos.map((p) => {
                                const pName = p.i18n?.es?.name || (p as any).nombre || 'Plato';
                                return (
                                  <option key={p.id} value={pName}>
                                    {pName} - S/ {p.precioPEN || p.precio || 25}
                                  </option>
                                );
                              })}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-center"
                              value={mesaAgregarCant}
                              onChange={(e) => setMesaAgregarCant(parseInt(e.target.value) || 1)}
                            />
                            <button
                              type="button"
                              className="btn btn-save text-xs px-3"
                              onClick={async () => {
                                const prod = productos.find((p) => (p.i18n?.es?.name || (p as any).nombre) === mesaAgregarPlato);
                                const precio = prod?.precioPEN || prod?.precio || 25;
                                const itemNuevo = { nombre: mesaAgregarPlato, cantidad: mesaAgregarCant, precio };
                                const itemsActuales = mesaComandaActiva.items || [];
                                const nuevosItems = [...itemsActuales, itemNuevo];
                                const nuevoTotal = (mesaComandaActiva.total || 0) + precio * mesaAgregarCant;
                                const prodsStr = nuevosItems.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ');

                                const comandaActualizada: Comanda = {
                                  ...mesaComandaActiva,
                                  items: nuevosItems,
                                  total: nuevoTotal,
                                  totalPEN: nuevoTotal,
                                  productos: prodsStr,
                                };
                                const ok = await storage.saveComanda(comandaActualizada);
                                if (!ok) {
                                  alert(storage.getFirebaseState().lastError || 'No se pudo actualizar la comanda en Firebase.');
                                  return;
                                }
                                setComandas(storage.getComandas());
                                setMesaComandaActiva(comandaActualizada);
                                alert(`✔ Se agregó ${mesaAgregarCant}x ${mesaAgregarPlato}`);
                              }}
                            >
                              Agregar
                            </button>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            className="btn btn-save p-2 flex items-center justify-center gap-1.5"
                            onClick={() => {
                              imprimirPrecuenta(mesaComandaActiva);
                            }}
                          >
                            <i className="fa-solid fa-receipt"></i> Imprimir Pre-cuenta
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary p-2 flex items-center justify-center gap-1.5"
                            onClick={() => {
                              imprimirTicketCocina(mesaComandaActiva);
                            }}
                          >
                            <i className="fa-solid fa-print"></i> Ticket Cocina
                          </button>

                          <button
                            type="button"
                            className="btn p-2 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl"
                            onClick={() => {
                              const com = mesaComandaActiva;
                              setMesaDetalleModal(null);
                              handleOpenCobro(com);
                            }}
                          >
                            <i className="fa-solid fa-cash-register"></i> Cobrar / SUNAT
                          </button>

                          <button
                            type="button"
                            className="btn btn-del p-2 flex items-center justify-center gap-1.5"
                            onClick={() => {
                              if (confirm(`¿Liberar la ${mesaDetalleModal.nombre} y cerrar comanda?`)) {
                                storage.updateComandaEstado(mesaComandaActiva.id, 'finalizado');
                                storage.setMesaEstado(mesaDetalleModal.nombre, 'libre');
                                setComandas(storage.getComandas());
                                setMesas(storage.getMesas());
                                setMesaDetalleModal(null);
                                setMesaComandaActiva(null);
                              }
                            }}
                          >
                            <i className="fa-solid fa-lock-open"></i> Liberar Mesa
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* If mesa is free, allow opening */
                      <div className="space-y-4">
                        <p className="text-xs text-slate-300">
                          Esta mesa se encuentra disponible. Asigna un mozo y crea la comanda para el salón.
                        </p>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">Mozo Asignado:</label>
                          <select
                            className="select-pill w-full text-xs"
                            value={mesaNuevaMozo}
                            onChange={(e) => setMesaNuevaMozo(e.target.value)}
                          >
                            <option value="YOSUKI">YOSUKI (Salón)</option>
                            <option value="CHARLE">CHARLE (Salón)</option>
                            <option value="SEBASTIAN">SEBASTIAN (Salón)</option>
                            <option value="LUCÍA">LUCÍA (Salón)</option>
                            <option value="OPERADOR PRINCIPAL">OPERADOR PRINCIPAL</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            Cantidad de Personas (Pax):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                            value={mesaNuevaPax}
                            onChange={(e) => setMesaNuevaPax(parseInt(e.target.value) || 2)}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            Primer Plato / Bebida:
                          </label>
                          <select
                            className="select-pill w-full text-xs"
                            value={mesaNuevaPlato}
                            onChange={(e) => setMesaNuevaPlato(e.target.value)}
                          >
                            {productos.map((p) => {
                              const pName = p.i18n?.es?.name || (p as any).nombre || 'Plato';
                              return (
                                <option key={p.id} value={pName}>
                                  {pName} - S/ {p.precioPEN || p.precio || 38}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <button
                          type="button"
                          className="w-full btn btn-save py-2.5 font-bold text-xs flex items-center justify-center gap-2"
                          onClick={async () => {
                            const prod = productos.find((p) => (p.i18n?.es?.name || (p as any).nombre) === mesaNuevaPlato);
                            const precio = prod?.precioPEN || prod?.precio || 38;
                            const nuevaComanda: Comanda = {
                              id: `ord-${Date.now()}`,
                              numero: `B001-${Math.floor(100000 + Math.random() * 900000)}`,
                              mesa: mesaDetalleModal.nombre,
                              cliente: `Cliente ${mesaDetalleModal.nombre} (${mesaNuevaPax}p)`,
                              dni: '00000000',
                              productos: `1x ${mesaNuevaPlato}`,
                              items: [{ nombre: mesaNuevaPlato, cantidad: 1, precio }],
                              totalPEN: precio,
                              totalUSD: +(precio / 3.75).toFixed(2),
                              total: precio,
                              estado: 'cocina',
                              pago: 'Pendiente',
                              tipoComprobante: 'Boleta',
                              fecha: new Date().toISOString().slice(0, 10),
                              hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              timestamp: Date.now(),
                              mozo: mesaNuevaMozo,
                            };

                            const ok = await storage.saveComanda(nuevaComanda);
                            if (!ok) {
                              alert(storage.getFirebaseState().lastError || 'No se pudo abrir la mesa en Firebase. Verifica los permisos.');
                              return;
                            }
                            setComandas(storage.getComandas());
                            setMesas(storage.getMesas());
                            setMesaDetalleModal(null);
                            reproducirCampana();
                            alert(`✔ ${mesaDetalleModal.nombre} abierta con éxito y enviada a cocina.`);
                          }}
                        >
                          <i className="fa-solid fa-play"></i> Abrir Mesa & Enviar a Cocina
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LIVE ORDERS GRID */}
              <div className="live-orders-grid" id="liveOrdersGrid">
                {comandasFiltradas.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '24px 0', textAlign: 'center' }}>
                    No hay comandas registradas bajo este filtro.
                  </p>
                ) : (
                  comandasFiltradas.map((c, index) => {
                    const isNuevo = c.estado === 'iniciado';
                    const isCocina = c.estado === 'cocina';
                    const isServido = c.estado === 'servido';
                    const isFin = c.estado === 'finalizado';
                    const pagando = c.pideCuenta && !isFin;

                    let badgeTxt = 'Iniciado', badgeClass = 'badge-iniciado';
                    if (isCocina) { badgeTxt = '🍳 En Cocina'; badgeClass = 'badge-cocina'; }
                    else if (isServido) { badgeTxt = '✅ Recibido en Mesa'; badgeClass = 'badge-servido'; }
                    else if (isFin) { badgeTxt = '🏁 Finalizado'; badgeClass = 'badge-finalizado'; }

                    return (
                      <div key={c.id} className={`order-card estado-${c.estado} ${pagando ? 'cliente-pagando' : ''}`}>
                        <div className="order-card-header">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="chef-order-priority-badge">
                                <i className="fa-solid fa-list-ol"></i> Orden #{index < 9 ? `0${index + 1}` : index + 1}
                              </span>
                              <strong style={{ fontSize: '16px' }}>{c.cliente || c.mesa}</strong>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {c.id} • {c.fecha || ''} {c.mozo ? `• Op: ${c.mozo}` : ''}
                            </div>
                          </div>
                          <span className={`order-status-badge ${badgeClass}`}>{badgeTxt}</span>
                        </div>

                        {pagando && (
                          <div style={{ background: '#ec4899', color: '#fff', padding: '6px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>
                            🔔 ¡EL CLIENTE HA PEDIDO LA CUENTA EN MESA!
                          </div>
                        )}

                        <div className="order-items-box">{c.productos || 'Sin platos especificados'}</div>
                        {c.notas && <div className="order-notes-tag">📝 {c.notas}</div>}

                        <div className="order-bottom-bar">
                          <span>Pago: <b>{c.pago || 'Efectivo'}</b></span>
                          <span style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>
                            S/ {(c.totalPEN || c.total || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="order-actions-container">
                          {isNuevo && (
                            <button
                              type="button"
                              className="btn-action-confirm"
                              onClick={() => storage.updateComandaEstado(c.id, 'cocina')}
                            >
                              <i className="fa-solid fa-utensils"></i> En Proceso (Cocina)
                            </button>
                          )}
                          {isCocina && (
                            <button
                              type="button"
                              className="btn-action-serve"
                              onClick={() => storage.updateComandaEstado(c.id, 'servido')}
                            >
                              <i className="fa-solid fa-check"></i> Recibido en Mesa
                            </button>
                          )}
                          {isServido && (
                            <button
                              type="button"
                              className="btn-action-serve"
                              style={{ background: '#059669', opacity: 0.85 }}
                              onClick={() => storage.updateComandaEstado(c.id, 'servido')}
                            >
                              <i className="fa-solid fa-circle-check"></i> Ya en Mesa
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-action-print-chef"
                            onClick={() => imprimirTicketCocina(c)}
                          >
                            <i className="fa-solid fa-print"></i> 🖨️ Ticket Cocina
                          </button>

                          {!isFin ? (
                            <>
                              <button
                                type="button"
                                className="btn-action-cobrar"
                                onClick={() => handleOpenCobro(c)}
                              >
                                <i className="fa-solid fa-cash-register"></i> 💳 Cobrar (S/ {(c.totalPEN || c.total || 0).toFixed(2)})
                              </button>
                              <button
                                type="button"
                                className="btn-action-ask-more"
                                onClick={() => alert("✔ Mensaje enviado al comensal: '¿Deseas ordenar algo más?'")}
                              >
                                <i className="fa-solid fa-bell"></i> 💬 ¿Desea más platos?
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-print"
                              style={{ width: '100%' }}
                              onClick={() => {
                                setCurrentSection('factura');
                                if (onNavigateToFactura) onNavigateToFactura();
                              }}
                            >
                              <i className="fa-solid fa-print"></i> 🧾 Ver / Reimprimir Boleta / Factura
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* C. 2. CLUB DE FIDELIDAD & SELLOS DE CLIENTES (INTEGRADO EN PANEL ADMIN) */}
          {currentSection === 'socios' && (
            <section id="viewSocios" style={{ display: 'block' }}>
              <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#fbbf24' }}>⭐</span> Módulo Club de Fidelidad & Sellos de Clientes
                  </h1>
                  <p>Programa de fidelización gastronómica: 1 sello por consumo. Al acumular 10 sellos, el cliente obtiene un regalito de cortesía.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-save"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: 900 }}
                  onClick={() => {
                    setNuevoSocioDni('');
                    setNuevoSocioNombre('');
                    setNuevoSocioTel('');
                    setNuevoSocioSellos(1);
                    setNuevoSocioModalOpen(true);
                  }}
                >
                  <i className="fa-solid fa-user-plus"></i> + Registrar Nuevo Socio
                </button>
              </div>

              {/* KPI Cards del Club de Fidelidad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div className="kpi-card" style={{ background: '#09152b', border: '1.5px solid #3b82f6' }}>
                  <span style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 800 }}>Total Socios Registrados</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <b style={{ fontSize: '26px', color: '#fff' }}>{socios.length}</b>
                    <span style={{ fontSize: '22px' }}>👥</span>
                  </div>
                </div>

                <div className="kpi-card" style={{ background: '#09152b', border: '1.5px solid #f59e0b' }}>
                  <span style={{ fontSize: '11px', color: '#fde68a', textTransform: 'uppercase', fontWeight: 800 }}>Sellos en Circulación</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <b style={{ fontSize: '26px', color: '#fbbf24' }}>
                      {socios.reduce((acc, s) => acc + (s.sellos || 0), 0)}
                    </b>
                    <span style={{ fontSize: '22px' }}>🏺</span>
                  </div>
                </div>

                <div className="kpi-card" style={{ background: '#09152b', border: '1.5px solid #10b981' }}>
                  <span style={{ fontSize: '11px', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 800 }}>Premios Ganados (≥10 Sellos)</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <b style={{ fontSize: '26px', color: '#34d399' }}>
                      {socios.filter((s) => (s.sellos || 0) >= 10).length}
                    </b>
                    <span style={{ fontSize: '22px' }}>🎁</span>
                  </div>
                </div>

                <div className="kpi-card" style={{ background: '#09152b', border: '1.5px solid #8b5cf6' }}>
                  <span style={{ fontSize: '11px', color: '#ddd6fe', textTransform: 'uppercase', fontWeight: 800 }}>Visitas Totales Acumuladas</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <b style={{ fontSize: '26px', color: '#c084fc' }}>
                      {socios.reduce((acc, s) => acc + (s.totalVisitas || 0), 0)}
                    </b>
                    <span style={{ fontSize: '22px' }}>📍</span>
                  </div>
                </div>
              </div>

              {/* Búsqueda Rápida de Socio por DNI y Ficha Interactiva */}
              <div className="card" style={{ borderColor: 'var(--chuspa-gold-border)', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <strong style={{ color: '#fbbf24', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-id-card"></i> Búsqueda de Ficha de Socio por DNI:
                  </strong>
                  {socioConsultado && (
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                      onClick={() => setSocioConsultado(null)}
                    >
                      ✕ Cerrar Ficha
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="tel"
                    id="inputBuscarDniSocio"
                    placeholder="Ingresa DNI del cliente (ej. 45892147)..."
                    style={{ fontSize: '14px', fontWeight: 800, flex: 1 }}
                    maxLength={10}
                    value={inputBuscarDni}
                    onChange={(e) => setInputBuscarDni(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const s = storage.getSocioByDni(inputBuscarDni.trim());
                        if (s) setSocioConsultado(s);
                        else alert(`No se encontró socio registrado con el DNI ${inputBuscarDni}. Puedes registrarlo con el botón "+ Registrar Nuevo Socio".`);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-save"
                    onClick={() => {
                      const clean = inputBuscarDni.trim();
                      if (!clean) {
                        alert('Ingresa un DNI para consultar.');
                        return;
                      }
                      const s = storage.getSocioByDni(clean);
                      if (s) setSocioConsultado(s);
                      else alert(`No se encontró socio registrado con el DNI ${clean}. Puedes registrarlo con el botón "+ Registrar Nuevo Socio".`);
                    }}
                  >
                    <i className="fa-solid fa-magnifying-glass"></i> Consultar
                  </button>
                </div>

                {socioConsultado && (
                  <div
                    id="resultadoSocioBox"
                    style={{
                      background: 'linear-gradient(145deg, #09152b, #060e1d)',
                      border: '2px solid var(--chuspa-gold)',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      marginTop: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.05em' }}>
                          Ficha del Socio
                        </span>
                        <h3 style={{ color: '#fff', fontSize: '19px', fontWeight: 900, margin: '2px 0' }}>
                          {socioConsultado.nombre}
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
                          <span>DNI: <b style={{ color: '#fbbf24' }}>{socioConsultado.dni}</b></span>
                          {socioConsultado.telefono && (
                            <span>Teléfono: <b style={{ color: '#38bdf8' }}>{socioConsultado.telefono}</b></span>
                          )}
                          <span>Total Visitas: <b style={{ color: '#fff' }}>{socioConsultado.totalVisitas}</b></span>
                        </div>
                      </div>

                      {socioConsultado.sellos >= 10 ? (
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 900,
                            padding: '6px 14px',
                            borderRadius: '20px',
                            boxShadow: '0 0 15px rgba(16,185,129,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>🎁</span> ¡TIENE REGALITO GANADO!
                        </div>
                      ) : (
                        <div
                          style={{
                            background: 'rgba(245,158,11,0.15)',
                            color: '#fbbf24',
                            border: '1px solid #f59e0b',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: '16px',
                          }}
                        >
                          Faltan {10 - (socioConsultado.sellos % 10)} sellos para su regalito
                        </div>
                      )}
                    </div>

                    {/* Grilla visual interactiva de los 10 Sellos */}
                    <div style={{ background: '#040b17', padding: '14px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                          Tarjeta de 10 Sellos del Cliente
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                          <span style={{ color: '#fbbf24', fontSize: '15px' }}>{socioConsultado.sellos % 10}</span> de 10 Sellos
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
                          const countInCycle = socioConsultado.sellos % 10;
                          const isStamped = socioConsultado.sellos >= 10 ? true : slot <= countInCycle;
                          const isPremioSlot = slot === 10;

                          return (
                            <div
                              key={slot}
                              style={{
                                aspectRatio: '1',
                                borderRadius: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 900,
                                border: isStamped
                                  ? isPremioSlot
                                    ? '2px solid #fef08a'
                                    : '1.5px solid #f59e0b'
                                  : isPremioSlot
                                  ? '1.5px dashed #f59e0b'
                                  : '1px solid #334155',
                                background: isStamped
                                  ? isPremioSlot
                                    ? 'linear-gradient(135deg, #f59e0b, #eab308)'
                                    : 'linear-gradient(135deg, #d97706, #b45309)'
                                  : isPremioSlot
                                  ? 'rgba(245,158,11,0.1)'
                                  : '#0f172a',
                                color: isStamped ? '#000' : isPremioSlot ? '#fbbf24' : '#64748b',
                                transition: 'all 0.2s',
                              }}
                              title={isPremioSlot ? 'Regalito de la Casa al completar 10 sellos' : `Sello ${slot}`}
                            >
                              <span style={{ fontSize: '14px', lineHeight: 1 }}>
                                {isStamped ? (isPremioSlot ? '🎁' : '🏺') : isPremioSlot ? '🎁' : slot}
                              </span>
                              <span style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', marginTop: '2px' }}>
                                {isPremioSlot ? 'Regalo' : `S${slot}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botones de acción para el socio consultado */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-save"
                        style={{ flex: 1, minWidth: '160px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                        onClick={() => {
                          const updated = storage.addSelloSocio(socioConsultado.dni);
                          if (updated) {
                            setSocioConsultado({ ...updated });
                            setSocios(storage.getSocios());
                          }
                          alert(`✔ Sello agregado correctamente a ${socioConsultado.nombre}.`);
                        }}
                      >
                        <i className="fa-solid fa-plus"></i> +1 Sello de Consumo
                      </button>

                      {socioConsultado.sellos >= 10 && (
                        <button
                          type="button"
                          className="btn btn-save"
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            boxShadow: '0 0 15px rgba(16,185,129,0.4)',
                          }}
                          onClick={() => {
                            if (window.confirm(`¿Confirmas canjear el regalito para ${socioConsultado.nombre}? Esto reiniciará su ciclo de 10 sellos a 0.`)) {
                              const res = storage.canjearRegaloSocio(socioConsultado.dni);
                              if (res.success && res.socio) {
                                setSocioConsultado({ ...res.socio });
                                setSocios(storage.getSocios());
                                alert(res.message);
                              } else {
                                alert(res.message);
                              }
                            }
                          }}
                        >
                          <i className="fa-solid fa-gift"></i> 🎁 Canjear Regalito (Reiniciar 10 Sellos)
                        </button>
                      )}

                      {socioConsultado.telefono && (
                        <a
                          href={`https://wa.me/${socioConsultado.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `¡Hola ${socioConsultado.nombre}! Te saludamos de *${config.nombre}* 🍽️.\n` +
                              `Tu tarjeta virtual de fidelidad cuenta con *${socioConsultado.sellos % 10} / 10 sellos* acumulados.\n` +
                              (socioConsultado.sellos >= 10
                                ? `🎁 ¡Ya completaste los 10 sellos y tienes tu REGALITO DE CORTESÍA listo para reclamar en tu próxima visita!\n`
                                : `¡Te faltan solo ${10 - (socioConsultado.sellos % 10)} consumos para tu próximo regalito!\n`) +
                              `¡Gracias por ser parte de nuestra familia tradicional!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ background: '#25d366', color: '#000', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="fa-brands fa-whatsapp text-sm"></i> WhatsApp Socio
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla de Todos los Socios del Club con Buscador en Vivo */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--gold)', fontSize: '15px' }}>
                    <i className="fa-solid fa-users"></i> Padrón de Socios del Club de Fidelidad ({socios.length}):
                  </strong>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Filtrar por nombre o DNI..."
                      style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px', minWidth: '220px' }}
                      value={socioFiltroTabla}
                      onChange={(e) => setSocioFiltroTabla(e.target.value)}
                    />
                    {socioFiltroTabla && (
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        onClick={() => setSocioFiltroTabla('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>DNI</th>
                      <th>Nombre del Cliente</th>
                      <th>Teléfono WhatsApp</th>
                      <th>Sellos Actuales</th>
                      <th>Estado Regalito</th>
                      <th>Total Visitas</th>
                      <th>Acciones Rápidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socios
                      .filter((s) => {
                        if (!socioFiltroTabla.trim()) return true;
                        const term = socioFiltroTabla.toLowerCase();
                        return s.nombre.toLowerCase().includes(term) || s.dni.includes(term);
                      })
                      .map((s) => {
                        const countInCycle = (s.sellos || 0) % 10;
                        const tienePremio = (s.sellos || 0) >= 10;

                        return (
                          <tr key={s.dni} style={{ background: tienePremio ? 'rgba(16,185,129,0.06)' : undefined }}>
                            <td>
                              <b style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '13px' }}>{s.dni}</b>
                            </td>
                            <td>
                              <b>{s.nombre}</b>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', color: '#93c5fd' }}>{s.telefono || 'Sin teléfono'}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <b style={{ fontSize: '13px', color: tienePremio ? '#10b981' : '#fbbf24' }}>
                                  {countInCycle} / 10
                                </b>
                                <div style={{ width: '60px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${tienePremio ? 100 : (countInCycle / 10) * 100}%`,
                                      height: '100%',
                                      background: tienePremio ? '#10b981' : '#fbbf24',
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              {tienePremio ? (
                                <span
                                  style={{
                                    background: 'rgba(16,185,129,0.2)',
                                    color: '#34d399',
                                    border: '1px solid #10b981',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: 900,
                                  }}
                                >
                                  🎁 ¡REGALITO LISTO!
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  Faltan {10 - countInCycle} sellos
                                </span>
                              )}
                            </td>
                            <td>
                              <b style={{ color: '#fff' }}>{s.totalVisitas || 1}</b>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  className="btn btn-save"
                                  style={{ padding: '4px 8px', fontSize: '11px', background: '#2563eb' }}
                                  title="Sumar 1 sello por consumo"
                                  onClick={() => {
                                    const updated = storage.addSelloSocio(s.dni);
                                    if (updated) {
                                      setSocios(storage.getSocios());
                                      if (socioConsultado?.dni === s.dni) setSocioConsultado({ ...updated });
                                    }
                                  }}
                                >
                                  +1 Sello
                                </button>

                                {tienePremio && (
                                  <button
                                    type="button"
                                    className="btn btn-save"
                                    style={{ padding: '4px 8px', fontSize: '11px', background: '#10b981' }}
                                    title="Canjear Regalito de 10 Sellos"
                                    onClick={() => {
                                      if (window.confirm(`¿Canjear regalito de 10 sellos para ${s.nombre}?`)) {
                                        const res = storage.canjearRegaloSocio(s.dni);
                                        if (res.success) {
                                          setSocios(storage.getSocios());
                                          if (socioConsultado?.dni === s.dni && res.socio) {
                                            setSocioConsultado({ ...res.socio });
                                          }
                                          alert(res.message);
                                        }
                                      }
                                    }}
                                  >
                                    🎁 Canjear
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="btn btn-save"
                                  style={{ padding: '4px 8px', fontSize: '11px', background: '#09152b', border: '1px solid #f59e0b' }}
                                  title="Ver ficha completa"
                                  onClick={() => {
                                    setInputBuscarDni(s.dni);
                                    setSocioConsultado(s);
                                    window.scrollTo({ top: 300, behavior: 'smooth' });
                                  }}
                                >
                                  Ver Ficha
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* MODAL PARA REGISTRAR NUEVO SOCIO */}
              {nuevoSocioModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#09152b] border-2 border-amber-400 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                      <h3 className="text-sm font-black text-amber-400 uppercase font-latina-luxury flex items-center gap-2">
                        <i className="fa-solid fa-user-plus"></i> Registrar Nuevo Socio en el Club
                      </h3>
                      <button
                        type="button"
                        onClick={() => setNuevoSocioModalOpen(false)}
                        className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!nuevoSocioDni.trim() || !nuevoSocioNombre.trim()) {
                          alert('Por favor ingrese DNI y Nombre del cliente.');
                          return;
                        }
                        const socioCreado = storage.addSelloSocio(
                          nuevoSocioDni.trim(),
                          nuevoSocioNombre.trim(),
                          nuevoSocioTel.trim()
                        );
                        if (nuevoSocioSellos > 1) {
                          for (let i = 1; i < nuevoSocioSellos; i++) {
                            storage.addSelloSocio(nuevoSocioDni.trim());
                          }
                        }
                        const finalSocio = storage.getSocioByDni(nuevoSocioDni.trim());
                        setSocios(storage.getSocios());
                        if (finalSocio) setSocioConsultado(finalSocio);
                        setNuevoSocioModalOpen(false);
                        alert(`✔ Socio ${nuevoSocioNombre} registrado exitosamente con ${nuevoSocioSellos} sellos iniciales.`);
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">DNI del Cliente (8 dígitos):</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="Ej. 45892147"
                          value={nuevoSocioDni}
                          onChange={(e) => setNuevoSocioDni(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre Completo:</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Carlos Mendoza"
                          value={nuevoSocioNombre}
                          onChange={(e) => setNuevoSocioNombre(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">WhatsApp / Teléfono:</label>
                        <input
                          type="tel"
                          placeholder="+51 987654321"
                          value={nuevoSocioTel}
                          onChange={(e) => setNuevoSocioTel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Sellos Iniciales a Otorgar:</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={nuevoSocioSellos}
                          onChange={(e) => setNuevoSocioSellos(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow active:scale-95 transition-all"
                        >
                          Guardar y Registrar Socio
                        </button>
                        <button
                          type="button"
                          onClick={() => setNuevoSocioModalOpen(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* D. 3. GESTIÓN DE USUARIOS Y CLAVES DE ACCESO */}
          {currentSection === 'usuarios' && (
            <section id="viewUsuarios" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1>👥 Claves de Acceso y Roles del Sistema</h1>
                  <p>Configura las contraseñas para Panel Admin, Pantalla de Cocina KDS y Desbloqueo de Mozo.</p>
                </div>
              </div>

              {/* Informative Security Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(30,58,138,0.4), rgba(15,23,42,0.8))',
                  border: '1.5px solid #38bdf8',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '26px' }}>🔐</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  <b style={{ color: '#38bdf8', fontSize: '13px', display: 'block' }}>
                    Control de Seguridad Multi-Acceso
                  </b>
                  Cada módulo del restaurante está protegido con su contraseña exclusiva. Puedes modificar las claves aquí; los cambios se aplican de inmediato en la pantalla de Cocina KDS, en el Panel Admin y en el desbloqueo de mesas del Menú Digital.
                </div>
              </div>

              {/* Add or Edit Operator Form */}
              <div className="card">
                <strong style={{ color: 'var(--gold)', fontSize: '14px' }}>
                  <i className="fa-solid fa-user-plus"></i> Registrar / Asignar Clave de Rol
                </strong>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!nuevoUsuarioClave.trim()) {
                      alert('Por favor especifica una clave o PIN.');
                      return;
                    }
                    const nuevoUser: UsuarioSistema = {
                      id: 'usr-' + Date.now(),
                      usuario: nuevoUsuarioRol,
                      nombre: nuevoUsuarioNombre.trim() || `Operador ${nuevoUsuarioRol.toUpperCase()}`,
                      rol: nuevoUsuarioRol,
                      clave: nuevoUsuarioClave.trim(),
                      activo: true,
                    };
                    storage.saveUsuarioSistema(nuevoUser);
                    setNuevoUsuarioNombre('');
                    setNuevoUsuarioClave('');
                    alert(`✔ Clave para el rol "${nuevoUsuarioRol.toUpperCase()}" guardada exitosamente.`);
                  }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}
                >
                  <div>
                    <label>Nombre del Operador / Estación:</label>
                    <input
                      type="text"
                      placeholder="Ej: Chef Principal / Mozo Turno"
                      value={nuevoUsuarioNombre}
                      onChange={(e) => setNuevoUsuarioNombre(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Rol del Sistema:</label>
                    <select
                      value={nuevoUsuarioRol}
                      onChange={(e) => setNuevoUsuarioRol(e.target.value as 'admin' | 'cocina' | 'mozo' | 'cajero')}
                    >
                      <option value="admin">Administrador (Panel Admin - admin123)</option>
                      <option value="cocina">Cocina KDS (Pantalla Cocina - cocina123)</option>
                      <option value="mozo">Mozo / Salón (Desbloqueo Mesa - mozo123)</option>
                      <option value="cajero">Cajero (Caja & Cobros)</option>
                    </select>
                  </div>
                  <div>
                    <label>Nueva Contraseña / PIN:</label>
                    <input
                      type="text"
                      placeholder="Ej: cocina123, mozo123"
                      value={nuevoUsuarioClave}
                      onChange={(e) => setNuevoUsuarioClave(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <button type="submit" className="btn btn-save" style={{ flex: 1, height: '42px' }}>
                      <i className="fa-solid fa-floppy-disk"></i> Guardar Clave
                    </button>
                  </div>
                </form>
              </div>

              {/* System Roles and Password Table */}
              <div className="card">
                <strong style={{ color: 'var(--gold)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                  Credenciales Activas de Estaciones y Personal ({usuariosSistema.length}):
                </strong>
                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Estación / Nombre</th>
                        <th>Rol Asignado</th>
                        <th>Contraseña Actual</th>
                        <th>Cambio Rápido</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosSistema.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <b>{u.nombre}</b>
                            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>
                              User: {u.usuario}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                background:
                                  u.rol === 'admin'
                                    ? '#dc2626'
                                    : u.rol === 'cocina'
                                    ? '#f59e0b'
                                    : u.rol === 'mozo'
                                    ? '#10b981'
                                    : '#0056d2',
                                color: '#fff',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                              }}
                            >
                              {u.rol}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', color: '#fbbf24', fontWeight: 'bold' }}>
                            {u.clave}
                          </td>
                          <td>
                            <input
                              type="text"
                              defaultValue={u.clave}
                              id={`input_clave_${u.id}`}
                              style={{
                                width: '110px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                background: '#061021',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                color: '#fff',
                              }}
                            />
                          </td>
                          <td>
                            <span style={{ color: u.activo ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                              {u.activo ? '● Activo' : '○ Inactivo'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-save"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                              onClick={() => {
                                const inputEl = document.getElementById(`input_clave_${u.id}`) as HTMLInputElement | null;
                                if (inputEl && inputEl.value.trim()) {
                                  const updated = { ...u, clave: inputEl.value.trim() };
                                  storage.saveUsuarioSistema(updated);
                                  alert(`✔ Contraseña actualizada para ${u.nombre}: "${inputEl.value.trim()}"`);
                                }
                              }}
                            >
                              <i className="fa-solid fa-check"></i> Actualizar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* E. 4. CATÁLOGO DE PLATOS */}
          {currentSection === 'platos' && (
            <section id="viewPlatos" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1>🍽️ Catálogo Visual de la Carta</h1>
                  <p>Edita nombres, precios, fotos y videos sincronizados en la nube.</p>
                </div>
                <button
                  className="btn btn-add"
                  onClick={() => {
                    setPlatoEditandoId(null);
                    setDishForm({
                      nombre: '',
                      descripcion: '',
                      precio: 35.0,
                      categoria: 'mains',
                      imagenUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
                      videoUrl: '',
                    });
                    setIsDishModalOpen(true);
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Nuevo Plato
                </button>
              </div>

              <div className="dishes-grid" id="dishesVisualGrid">
                {productos.map((dish) => {
                  const es = dish.i18n?.es || { name: (dish as any).nombre || 'Plato', desc: (dish as any).descripcion || '' };
                  const disp = dish.disponible !== false;
                  const precioFinal = dish.precioPEN || dish.precio || 0;
                  return (
                    <div key={dish.id} className={`dish-card-visual ${disp ? '' : 'agotado'}`}>
                      <div className="dish-media">
                        <img src={dish.posterUrl} alt={es.name} />
                        <span className="badge-media-type">
                          <i className="fa-solid fa-video"></i> Video Reels
                        </span>
                      </div>
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <strong style={{ fontSize: '16px' }}>{es.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{es.desc}</span>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24', marginTop: '4px' }}>
                          S/ {precioFinal.toFixed(2)}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)', padding: '6px 10px', borderRadius: '6px', marginTop: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: disp ? '#10b981' : '#dc2626' }}>
                            {disp ? '🟢 Disponible' : '🔴 Agotado'}
                          </span>
                          <button
                            className={`switch-btn ${disp ? 'btn-to-off' : 'btn-to-on'}`}
                            onClick={() => {
                              dish.disponible = !disp;
                              storage.saveProducto(dish);
                            }}
                          >
                            {disp ? 'Agotar' : 'Activar'}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn btn-save"
                          style={{ marginTop: '8px', padding: '7px', fontSize: '12px' }}
                          onClick={() => {
                            setPlatoEditandoId(dish.id);
                            setDishForm({
                              nombre: es.name,
                              descripcion: es.desc,
                              precio: dish.precioPEN,
                              categoria: dish.category,
                              imagenUrl: dish.posterUrl,
                              videoUrl: dish.videoUrl,
                            });
                            setIsDishModalOpen(true);
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i> ✏️ Editar Plato
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* F. 5. GENERACIÓN DE RESERVAS */}
          {currentSection === 'reservas' && (
            <section id="viewReservas" style={{ display: 'block' }}>
              <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📅</span> Generación & Control de Reservas
                  </h1>
                  <p>Sincronización en tiempo real con Menú Digital, QR y Salón de Mesas.</p>
                </div>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `¡Hola! Te compartimos el enlace oficial para reservar tu mesa en *${config.nombre}* 🍽️🍷✨\n\n` +
                    `👉 Entra con este link directo a la sección de reservas:\n` +
                    `${window.location.origin}${window.location.pathname}?view=reservas\n\n` +
                    `¡Acomoda tu mesa, escoge tus platos favoritos y asegura tu lugar!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-save"
                  style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                  title="Compartir link directo a clientes por WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: '16px' }}></i>
                  <span>Compartir Link de Reservas por WhatsApp</span>
                </a>
              </div>

              {/* Formulario de Nueva Reserva */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <i className="fa-solid fa-plus-circle"></i> Registrar / Acomodar Nueva Reserva:
                </strong>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!resAdminForm.titular.trim() || !resAdminForm.telefono.trim()) {
                      alert('Por favor complete titular y teléfono.');
                      return;
                    }
                    const totalEst = resAdminForm.totalEstimado || resAdminForm.itemsPedidos.reduce((acc, it) => acc + it.cantidad * it.precio, 0);
                    const adelanto = resAdminForm.pagoConfirmado ? Number(resAdminForm.montoAdelanto) : 0;
                    const saldo = Math.max(0, totalEst - adelanto);
                    const n: Reserva = {
                      id: `RES-${Date.now().toString().slice(-6)}`,
                      cliente: resAdminForm.titular.trim(),
                      telefono: resAdminForm.telefono.trim(),
                      fechaReserva: resAdminForm.fecha,
                      horaReserva: resAdminForm.hora,
                      personas: resAdminForm.personas,
                      mesaAsignada: resAdminForm.mesa,
                      estado: resAdminForm.estado,
                      platosPreseleccionados: resAdminForm.platosPreseleccionados,
                      itemsPedidos: resAdminForm.itemsPedidos,
                      totalEstimado: totalEst,
                      saldoRestante: saldo,
                      pagoLiquidado: resAdminForm.pagoConfirmado && adelanto >= totalEst && totalEst > 0,
                      pagoConfirmado: resAdminForm.pagoConfirmado,
                      montoAdelanto: adelanto,
                      metodoPagoAdelanto: resAdminForm.pagoConfirmado ? resAdminForm.metodoPagoAdelanto : undefined,
                      notas: resAdminForm.notas.trim() || 'Sin notas especiales',
                      fechaCreacion: new Date().toLocaleDateString('es-PE'),
                    };
                    const ok = await storage.saveReserva(n);
                    if (!ok) {
                      alert(storage.getFirebaseState().lastError || 'No se pudo registrar la reserva en Firebase.');
                      return;
                    }
                    alert(`✔ Reserva guardada en Firebase en estado ${n.estado}. ${n.pagoConfirmado ? '🔒 Mesa bloqueada solo para la fecha de reserva (' + n.fechaReserva + ').' : 'Mesa libre hasta confirmar pago.'}`);
                    setResAdminForm({
                      ...resAdminForm,
                      titular: '',
                      telefono: '',
                      notas: '',
                      platosPreseleccionados: [],
                      itemsPedidos: [],
                      totalEstimado: 0,
                      pagoConfirmado: false,
                    });
                  }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}
                >
                  <div>
                    <label>Titular de la Reserva:</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo"
                      value={resAdminForm.titular}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, titular: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Teléfono WhatsApp:</label>
                    <input
                      type="tel"
                      required
                      placeholder="+51 984..."
                      value={resAdminForm.telefono}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Fecha de la Reserva:</label>
                    <input
                      type="date"
                      required
                      value={resAdminForm.fecha}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, fecha: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Hora:</label>
                    <input
                      type="time"
                      required
                      value={resAdminForm.hora}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, hora: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Comensales (Personas):</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={resAdminForm.personas}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, personas: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  {/* Acomodar la mesa para el día de su reserva */}
                  <div>
                    <label>Acomodar Mesa Asignada:</label>
                    <select
                      value={resAdminForm.mesa}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, mesa: e.target.value })}
                    >
                      {mesas.map((m) => (
                        <option key={m.id} value={m.nombre}>
                          {m.nombre} ({m.capacidad || 4} pax) - {m.zona || 'Salón'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estado de la Reserva */}
                  <div>
                    <label>Estado de la Reserva:</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {(['Confirmada', 'Por confirmar', 'Cancelada'] as const).map((est) => (
                        <button
                          key={est}
                          type="button"
                          onClick={() => setResAdminForm({ ...resAdminForm, estado: est })}
                          style={{
                            flex: 1,
                            padding: '6px 4px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: '1px solid',
                            cursor: 'pointer',
                            borderColor: resAdminForm.estado === est ? 'var(--gold)' : '#334155',
                            background: resAdminForm.estado === est
                              ? est === 'Confirmada' ? '#065f46' : est === 'Por confirmar' ? '#92400e' : '#991b1b'
                              : 'var(--input-bg)',
                            color: '#fff',
                          }}
                        >
                          {est === 'Confirmada' && '✓ '}
                          {est === 'Por confirmar' && '⏳ '}
                          {est === 'Cancelada' && '✕ '}
                          {est}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Escoger tipos de platos a pedir con Catálogo Digital */}
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(15, 23, 42, 0.75)', padding: '14px', borderRadius: '12px', border: '1.5px solid rgba(245, 158, 11, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--gold)' }}>
                        <i className="fa-solid fa-utensils"></i> Platos y Pedidos de la Reserva:
                      </strong>
                      <button
                        type="button"
                        onClick={() => {
                          setPickerTargetReserva(null);
                          setIsCatalogPickerOpen(true);
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#020617',
                          fontWeight: 900,
                          fontSize: '11px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)'
                        }}
                      >
                        <i className="fa-solid fa-book-open"></i> 📖 Abrir Catálogo Digital de Platos
                      </button>
                    </div>

                    {/* Resumen de items pedidos seleccionados */}
                    {resAdminForm.itemsPedidos && resAdminForm.itemsPedidos.length > 0 ? (
                      <div style={{ background: '#020617', padding: '10px', borderRadius: '10px', border: '1px solid #0284c7', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8' }}>
                            🛒 Pedido Armado ({resAdminForm.itemsPedidos.reduce((acc, it) => acc + it.cantidad, 0)} unidades seleccionadas):
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24' }}>
                            Total: S/ {(resAdminForm.totalEstimado || 0).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {resAdminForm.itemsPedidos.map((it, idx) => (
                            <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#e2e8f0', display: 'flex', gap: '6px' }}>
                              <b style={{ color: '#38bdf8' }}>{it.cantidad}x</b>
                              <span>{it.nombre}</span>
                              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>S/ {(it.cantidad * it.precio).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                        No hay platos seleccionados aún. Pulsa el botón de arriba para abrir el catálogo con fotos, precios y cantidades.
                      </div>
                    )}

                    {/* Selección rápida opcional de platos */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '90px', overflowY: 'auto' }}>
                      {productos.map((prod) => {
                        const nombrePlato = prod.nombre || prod.i18n?.es?.name || prod.id;
                        const precioPlato = prod.precioPEN || prod.precio || 0;
                        const isChecked = resAdminForm.platosPreseleccionados.includes(nombrePlato);
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              const nuevo = isChecked
                                ? resAdminForm.platosPreseleccionados.filter((p) => p !== nombrePlato)
                                : [...resAdminForm.platosPreseleccionados, nombrePlato];
                              setResAdminForm({ ...resAdminForm, platosPreseleccionados: nuevo });
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              border: isChecked ? '1.5px solid var(--gold)' : '1px solid #334155',
                              background: isChecked ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                              color: isChecked ? '#fbbf24' : '#cbd5e1',
                            }}
                          >
                            {isChecked ? '✓ ' : '+ '}
                            {nombrePlato} (S/ {precioPlato.toFixed(2)})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pago previo confirmación */}
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(88, 28, 135, 0.25)', padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(168, 85, 247, 0.5)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 'bold', color: '#e9d5ff' }}>
                      <input
                        type="checkbox"
                        checked={resAdminForm.pagoConfirmado}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const total = resAdminForm.totalEstimado || 0;
                          const sugerido = total > 0 ? Number((total * 0.5).toFixed(2)) : 50;
                          setResAdminForm({
                            ...resAdminForm,
                            pagoConfirmado: checked,
                            montoAdelanto: checked ? (resAdminForm.montoAdelanto || sugerido) : 0,
                          });
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#a855f7', cursor: 'pointer' }}
                      />
                      <span>🔒 Confirmar Pago Previo de Adelanto (50%) • Bloquea la mesa en el salón el día de la reserva</span>
                    </label>

                    {resAdminForm.pagoConfirmado && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#d8b4fe' }}>
                            Monto Adelanto 50% (S/): {resAdminForm.totalEstimado > 0 && `(Total: S/ ${resAdminForm.totalEstimado.toFixed(2)})`}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={resAdminForm.montoAdelanto}
                            onChange={(e) => setResAdminForm({ ...resAdminForm, montoAdelanto: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#d8b4fe' }}>Método de Pago:</label>
                          <select
                            value={resAdminForm.metodoPagoAdelanto}
                            onChange={(e) => setResAdminForm({ ...resAdminForm, metodoPagoAdelanto: e.target.value })}
                          >
                            <option value="Yape">Yape</option>
                            <option value="Plin">Plin</option>
                            <option value="Transferencia BCP">Transferencia BCP</option>
                            <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                            <option value="Efectivo">Efectivo en Caja</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Notas del Evento:</label>
                    <input
                      type="text"
                      placeholder="Cumpleaños, flores, vista al valle, alergias..."
                      value={resAdminForm.notas}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, notas: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-save" style={{ gridColumn: '1 / -1', padding: '10px', fontWeight: 'bold' }}>
                    <i className="fa-solid fa-calendar-plus"></i> Guardar y Sincronizar Reserva
                  </button>
                </form>
              </div>

              {/* Listado de Reservas con Sincronización Completa */}
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>
                  📋 Reservas Registradas ({reservas.length}):
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Las mesas con pago confirmado se bloquean automáticamente en Salón.
                </span>
              </div>

              <div id="contenedorReservasAdminList" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
                {reservas.map((r) => {
                  const esHoy = getEsHoy(r.fechaReserva);
                  return (
                    <div
                      key={r.id}
                      style={{
                        background: 'var(--card-bg)',
                        border: r.pagoConfirmado ? '2px solid #a855f7' : esHoy ? '2px solid #f59e0b' : '1.5px solid var(--card-border)',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: r.pagoConfirmado ? '0 0 14px rgba(168, 85, 247, 0.25)' : 'none',
                      }}
                    >
                      {/* Cabecera de la Reserva */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>{r.cliente}</strong>
                          {esHoy && (
                            <span style={{ marginLeft: '6px', background: '#dc2626', color: '#fff', fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                              HOY
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            background: r.estado === 'Confirmada' ? '#065f46' : r.estado === 'Por confirmar' ? '#92400e' : '#991b1b',
                            color: '#fff',
                          }}
                        >
                          {r.estado}
                        </span>
                      </div>

                      {/* Estado de Bloqueo por Pago Previo */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: r.pagoConfirmado ? 'rgba(88, 28, 135, 0.3)' : 'rgba(15, 23, 42, 0.6)', padding: '6px 10px', borderRadius: '8px', border: r.pagoConfirmado ? '1px solid #c084fc' : '1px solid #334155' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: r.pagoConfirmado ? '#e9d5ff' : '#94a3b8' }}>
                          {r.pagoConfirmado ? (
                            <>🔒 Pago Previo Confirmado (S/ {Number(r.montoAdelanto || 0).toFixed(2)}) • <b>Mesa Bloqueada</b></>
                          ) : (
                            <>⚠️ Sin pago previo • Mesa libre</>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const act = {
                              ...r,
                              pagoConfirmado: !r.pagoConfirmado,
                              montoAdelanto: !r.pagoConfirmado ? (r.montoAdelanto || 50) : 0,
                              metodoPagoAdelanto: !r.pagoConfirmado ? (r.metodoPagoAdelanto || 'Yape') : undefined,
                            };
                            storage.saveReserva(act);
                          }}
                          style={{ fontSize: '10px', fontWeight: 'bold', padding: '3px 7px', borderRadius: '5px', background: r.pagoConfirmado ? '#7e22ce' : '#334155', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          {r.pagoConfirmado ? 'Desbloquear' : 'Confirmar Pago'}
                        </button>
                      </div>

                      <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold' }}>
                        📅 {r.fechaReserva} • ⏰ {r.horaReserva} • 👥 {r.personas} Personas
                      </div>

                      {/* Acomodar la mesa para el día de su reserva */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--input-bg)', padding: '6px 10px', borderRadius: '8px' }}>
                        <label style={{ margin: 0, fontSize: '11px', color: 'var(--gold)', fontWeight: 'bold' }}>
                          🪑 Acomodar Mesa:
                        </label>
                        <select
                          value={r.mesaAsignada}
                          onChange={(e) => {
                            const act = { ...r, mesaAsignada: e.target.value };
                            storage.saveReserva(act);
                          }}
                          style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.9)', color: '#fff', border: '1px solid #475569' }}
                        >
                          {mesas.map((m) => (
                            <option key={m.id} value={m.nombre}>
                              {m.nombre} ({m.capacidad || 4} pax)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Platos y Pedidos del Catálogo Digital */}
                      {r.itemsPedidos && r.itemsPedidos.length > 0 ? (
                        <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '10px', border: '1px solid #0284c7' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 900 }}>
                              🛒 Pedido de Catálogo ({r.itemsPedidos.reduce((acc, it) => acc + it.cantidad, 0)} platos):
                            </span>
                            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 900 }}>
                              Total: S/ {(r.totalEstimado || 0).toFixed(2)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                            {r.itemsPedidos.map((it, idx) => (
                              <span key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '5px', padding: '2px 6px', fontSize: '10px', color: '#e2e8f0' }}>
                                <b style={{ color: '#38bdf8' }}>{it.cantidad}x</b> {it.nombre} <span style={{ color: '#fbbf24' }}>S/ {(it.cantidad * it.precio).toFixed(2)}</span>
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', paddingTop: '4px', borderTop: '1px dashed #334155' }}>
                            <span style={{ color: '#94a3b8' }}>
                              Adelanto: <b style={{ color: '#a855f7' }}>S/ {Number(r.montoAdelanto || 0).toFixed(2)}</b> • Saldo: <b style={{ color: '#f59e0b' }}>S/ {Math.max(0, (r.totalEstimado || 0) - (r.montoAdelanto || 0)).toFixed(2)}</b>
                            </span>
                            {r.pagoLiquidado ? (
                              <span style={{ color: '#10b981', fontWeight: 900 }}>✓ 100% Liquidado</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const act = { ...r, pagoLiquidado: true, saldoRestante: 0 };
                                  storage.saveReserva(act);
                                  alert('✔ Saldo restante del 50% completado y liquidado con éxito.');
                                }}
                                style={{
                                  background: '#047857',
                                  color: '#fff',
                                  fontSize: '10px',
                                  fontWeight: 900,
                                  padding: '3px 7px',
                                  borderRadius: '5px',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                💳 Completar Pago 50%
                              </button>
                            )}
                          </div>
                        </div>
                      ) : r.platosPreseleccionados && r.platosPreseleccionados.length > 0 ? (
                        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '6px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                          <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                            🍲 Platos Preseleccionados ({r.platosPreseleccionados.length}):
                          </span>
                          <span style={{ fontSize: '11px', color: '#e2e8f0' }}>
                            {r.platosPreseleccionados.join(', ')}
                          </span>
                        </div>
                      ) : null}

                      {/* Botón para Abrir/Modificar Catálogo de Platos de esta Reserva */}
                      <button
                        type="button"
                        onClick={() => {
                          setPickerTargetReserva(r);
                          setIsCatalogPickerOpen(true);
                        }}
                        style={{
                          background: 'rgba(30, 58, 138, 0.4)',
                          border: '1px solid #3b82f6',
                          color: '#93c5fd',
                          padding: '5px 8px',
                          borderRadius: '7px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fa-solid fa-book-open"></i> {r.itemsPedidos && r.itemsPedidos.length > 0 ? 'Modificar Platos del Catálogo' : 'Elegir Platos del Catálogo Digital'}
                      </button>

                      {r.notas && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          📝 Notas: {r.notas}
                        </div>
                      )}

                      {/* Cambiar Estado 1-Click: Confirmada, Por confirmar, Cancelada */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        {(['Confirmada', 'Por confirmar', 'Cancelada'] as const).map((est) => (
                          <button
                            key={est}
                            type="button"
                            onClick={() => {
                              const act = { ...r, estado: est };
                              storage.saveReserva(act);
                            }}
                            style={{
                              flex: 1,
                              padding: '5px 4px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              border: r.estado === est ? '1.5px solid var(--gold)' : '1px solid #334155',
                              background: r.estado === est
                                ? est === 'Confirmada' ? '#065f46' : est === 'Por confirmar' ? '#92400e' : '#991b1b'
                                : 'var(--input-bg)',
                              color: '#fff',
                            }}
                          >
                            {est === 'Confirmada' && '✓ '}
                            {est === 'Por confirmar' && '⏳ '}
                            {est === 'Cancelada' && '✕ '}
                            {est}
                          </button>
                        ))}
                      </div>

                      {/* Botones de acción WhatsApp Recordatorio, WhatsApp Agradecimiento/Google & Eliminar */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px', marginTop: '4px' }}>
                        {/* 1. Botón de Recordatorio por WhatsApp */}
                        <a
                          href={`https://wa.me/${r.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `¡Hola ${r.cliente}! Te saludamos cordialmente de *${config.nombre}* 🍽️🍷✨\n\n` +
                            `Te recordamos tu reserva agendada para el día *${r.fechaReserva}* a las *${r.horaReserva}* en la *${r.mesaAsignada}* para *${r.personas} comensales*.\n` +
                            (r.itemsPedidos && r.itemsPedidos.length > 0 ? `🍲 *Platos Seleccionados del Menú:*\n${r.itemsPedidos.map(it => `• ${it.cantidad}x ${it.nombre} (S/ ${(it.cantidad * it.precio).toFixed(2)})`).join('\n')}\n` : '') +
                            (r.pagoConfirmado ? `🔒 Adelanto confirmado: S/ ${Number(r.montoAdelanto || 0).toFixed(2)}\n` : '') +
                            (r.saldoRestante && r.saldoRestante > 0 ? `💳 Saldo restante: S/ ${Number(r.saldoRestante).toFixed(2)}\n` : '') +
                            `\n¡Te esperamos con la más fina gastronomía cusqueña!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 8px',
                            borderRadius: '8px',
                            background: '#10b981',
                            color: '#fff',
                            textDecoration: 'none',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                          title="Enviar Recordatorio por WhatsApp"
                        >
                          <i className="fa-brands fa-whatsapp"></i>
                          <span>Recordatorio</span>
                        </a>

                        {/* 2. Botón de Agradecimiento con Enlace a Reseñas de Google */}
                        <a
                          href={`https://wa.me/${r.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `¡Muchas gracias por reservar y visitarnos en *${config.nombre}*, estimado(a) ${r.cliente}! 🍽️✨\n\n` +
                            `Ha sido un honor brindarte nuestra experiencia culinaria cusqueña.\n` +
                            `Tu opinión es de gran valor para nuestro equipo y nos ayuda a seguir mejorando cada día.\n\n` +
                            `⭐ *¿Nos dejarías tu reseña y calificación en Google Business?* Puedes hacerlo rápidamente pulsando aquí:\n` +
                            `${config.googleBusinessUrl || 'https://search.google.com/local/writereview?placeid=ChIJlachuspatech-cusco'}\n\n` +
                            `¡Gracias por tu preferencia y esperamos recibirte pronto de nuevo!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 8px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #d97706, #b45309)',
                            color: '#fff',
                            textDecoration: 'none',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                          title="Enviar Agradecimiento y Link de Reseña de Google"
                        >
                          <i className="fa-brands fa-google"></i>
                          <span>Agradecer & Google</span>
                        </a>

                        {/* 3. Eliminar Reserva */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar la reserva de ${r.cliente}?`)) {
                              storage.deleteReserva(r.id);
                            }
                          }}
                          className="btn btn-del"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          title="Eliminar Reserva"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* G. 6. IDENTIDAD, SUNAT Y REDES SOCIALES */}
          {currentSection === 'identidad' && (
            <section id="viewIdentidad" style={{ display: 'block' }}>
              <div className="view-header">
                <h1>🏪 Identidad del Negocio & Parámetros Fiscales</h1>
              </div>
              <div className="card">
                {/* LOGO DEL NEGOCIO (SUBIR IMAGEN O EMOJI / SINCRONIZACIÓN EN TIEMPO REAL) */}
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1.5px solid rgba(245, 158, 11, 0.4)', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-image"></i> Logo del Negocio (Sincronizado en Menú Digital, Cocina, Club, Reservas e Inicio de Sesión):
                    </label>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                      ⚡ Sincronización Automática
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Preview box */}
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        border: '3px solid #f59e0b',
                        background: '#09152b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 0 15px rgba(245,158,11,0.3)',
                        flexShrink: 0,
                      }}
                    >
                      {identidadForm.logo && (identidadForm.logo.startsWith('data:') || identidadForm.logo.startsWith('http') || identidadForm.logo.startsWith('/')) ? (
                        <img
                          src={identidadForm.logo}
                          alt="Logo del negocio"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '36px' }}>{identidadForm.logo || '🍽️'}</span>
                      )}
                    </div>

                    {/* Controls */}
                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px', display: 'block' }}>
                          Subir archivo de imagen (PNG, JPG, SVG, WebP):
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ fontSize: '12px', padding: '6px', background: '#020617', border: '1px solid #334155', borderRadius: '8px', width: '100%', color: '#94a3b8' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const base64 = ev.target?.result as string;
                                setIdentidadForm((prev) => ({ ...prev, logo: base64 }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            placeholder="O ingresa URL / Icono (ej: 🍽️ o https://...)"
                            value={identidadForm.logo}
                            onChange={(e) => setIdentidadForm({ ...identidadForm, logo: e.target.value })}
                            style={{ fontSize: '12px', padding: '8px 10px' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '8px 12px', fontSize: '11px', background: '#334155', color: '#fff', whiteSpace: 'nowrap' }}
                          onClick={() => setIdentidadForm((prev) => ({ ...prev, logo: '🍽️' }))}
                        >
                          Restablecer 🍽️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>Nombre del Restaurante:</label>
                    <input
                      type="text"
                      value={identidadForm.nombre}
                      onChange={(e) => setIdentidadForm({ ...identidadForm, nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>RUC (SUNAT):</label>
                    <input
                      type="text"
                      value={identidadForm.ruc}
                      onChange={(e) => setIdentidadForm({ ...identidadForm, ruc: e.target.value })}
                    />
                  </div>
                </div>

                <label>Dirección Fiscal:</label>
                <input
                  type="text"
                  value={identidadForm.direccion}
                  onChange={(e) => setIdentidadForm({ ...identidadForm, direccion: e.target.value })}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>Tasa IGV (%):</label>
                    <input type="number" value={18} readOnly />
                  </div>
                  <div>
                    <label>Eslogan o Subtítulo:</label>
                    <input
                      type="text"
                      value={identidadForm.eslogan}
                      onChange={(e) => setIdentidadForm({ ...identidadForm, eslogan: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: '14px', paddingTop: '10px' }}>
                  <strong style={{ color: 'var(--gold)', fontSize: '13px' }}>
                    <i className="fa-solid fa-share-nodes"></i> Redes Sociales & Canales Oficiales:
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                    <div>
                      <label>WhatsApp Oficial:</label>
                      <input
                        type="text"
                        placeholder="Ej: 51969773064"
                        value={identidadForm.whatsapp}
                        onChange={(e) => setIdentidadForm({ ...identidadForm, whatsapp: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Teléfono Yape / Plin:</label>
                      <input
                        type="text"
                        placeholder="Ej: 987 654 321"
                        value={identidadForm.yapePhone}
                        onChange={(e) => setIdentidadForm({ ...identidadForm, yapePhone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-brands fa-facebook text-blue-500"></i> Facebook:
                      </label>
                      <input
                        type="text"
                        placeholder="https://facebook.com/tupagina"
                        value={identidadForm.facebook || ''}
                        onChange={(e) => setIdentidadForm({ ...identidadForm, facebook: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-brands fa-instagram text-pink-500"></i> Instagram:
                      </label>
                      <input
                        type="text"
                        placeholder="https://instagram.com/tuperfil"
                        value={identidadForm.instagram || ''}
                        onChange={(e) => setIdentidadForm({ ...identidadForm, instagram: e.target.value })}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-brands fa-tiktok text-slate-200"></i> TikTok:
                      </label>
                      <input
                        type="text"
                        placeholder="https://tiktok.com/@tucuenta"
                        value={identidadForm.tiktok || ''}
                        onChange={(e) => setIdentidadForm({ ...identidadForm, tiktok: e.target.value })}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1', background: 'rgba(245, 158, 11, 0.08)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 900 }}>
                        <i className="fa-brands fa-google text-amber-400"></i> ⭐ Dirección de Reseñas del Negocio en Google Business:
                      </label>
                      <input
                        type="url"
                        placeholder="Ej: https://search.google.com/local/writereview?placeid=... o https://g.page/r/..."
                        value={identidadForm.googleBusinessUrl || ''}
                        onChange={(e) => setIdentidadForm({ ...identidadForm, googleBusinessUrl: e.target.value })}
                        style={{ marginTop: '4px' }}
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                        * Este enlace se enviará automáticamente en los mensajes de WhatsApp de agradecimiento al cliente y se abrirá en segundo plano en la pantalla de agradecimiento del Menú Digital para captar reseñas positivas.
                      </span>
                    </div>

                    <div style={{ gridColumn: '1 / -1', background: 'rgba(14, 165, 233, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
                      <strong style={{ color: '#38bdf8', fontSize: '12.5px', display: 'block', marginBottom: '8px' }}>
                        <i className="fa-solid fa-file-invoice"></i> Documentos de Clientes (DNI / RUC) en Menú Digital & Caja:
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={identidadForm.habilitarComprobantesFiscales !== false}
                            onChange={(e) => setIdentidadForm({ ...identidadForm, habilitarComprobantesFiscales: e.target.checked })}
                          />
                          <span>Habilitar Boleta / Factura (desactívalo para solo Nota/Ticket)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={identidadForm.habilitarDniCliente !== false}
                            onChange={(e) => setIdentidadForm({ ...identidadForm, habilitarDniCliente: e.target.checked })}
                          />
                          <span>Mostrar campo DNI en Menú Digital</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={identidadForm.habilitarRucCliente !== false}
                            onChange={(e) => setIdentidadForm({ ...identidadForm, habilitarRucCliente: e.target.checked })}
                          />
                          <span>Mostrar campo RUC en Menú Digital</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={identidadForm.exigirValidacionReniecSunat !== false}
                            onChange={(e) => setIdentidadForm({ ...identidadForm, exigirValidacionReniecSunat: e.target.checked })}
                          />
                          <span>Exigir validación real RENIEC/SUNAT antes de imprimir</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                  <button
                    className="btn btn-save"
                    onClick={() => {
                      storage.saveConfig(identidadForm);
                      alert('✔ Identidad del restaurante, redes y enlace de Google Business guardados con éxito.');
                    }}
                  >
                    <i className="fa-solid fa-floppy-disk"></i> Guardar Identidad & Redes
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.5)',
                      color: '#fbbf24',
                      fontWeight: 800,
                      fontSize: '12px',
                    }}
                    onClick={() => {
                      if (window.confirm('¿Deseas restablecer la identidad oficial de La Chuspa Tech (WhatsApp: 969773064 y logo oficial)?')) {
                        const def = storage.resetConfigToDefaults();
                        setIdentidadForm(def);
                        alert('✔ Configuración restablecida a La Chuspa Tech (WhatsApp: 969773064).');
                      }
                    }}
                  >
                    <i className="fa-solid fa-rotate-left"></i> Restablecer a La Chuspa Tech
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* H. 7. REPORTE CONTABLE SUNAT */}
          {currentSection === 'reporte_contable' && (
            <section id="viewReportes" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1>📊 Reporte Contable & Auditoría SUNAT</h1>
                  <p>Historial y registro auditable de comprobantes emitidos.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-add" onClick={() => setVentas(storage.getVentas())}>
                    <i className="fa-solid fa-rotate"></i> Actualizar Ventas
                  </button>
                  <button className="btn btn-print no-print" onClick={() => window.print()}>
                    <i className="fa-solid fa-print"></i> Imprimir Reporte Formal
                  </button>
                </div>
              </div>

              <div className="card" id="areaImpresionReporte">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', fontWeight: 900 }}>
                  <span>Total Ventas Cobradas: <b style={{ color: '#10b981' }}>S/ {ventas.reduce((s, v) => s + v.totalPEN, 0).toFixed(2)}</b></span>
                  <span>Total Comprobantes: <b style={{ color: '#fbbf24' }}>{ventas.length}</b></span>
                </div>

                <table className="custom-table" id="tablaContableReport">
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Mesa / Cliente</th>
                      <th>Operador</th>
                      <th>Platos Consumidos</th>
                      <th>Pago</th>
                      <th>Base Imp.</th>
                      <th>IGV (18%)</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((v) => (
                      <tr key={v.id}>
                        <td>{v.fecha}</td>
                        <td><b>{v.mesa}</b> ({v.razonSocialCliente || v.cliente})</td>
                        <td>{v.cajero}</td>
                        <td style={{ color: '#fbbf24' }}>{v.productos}</td>
                        <td>{v.pago}</td>
                        <td>S/ {v.baseImponible.toFixed(2)}</td>
                        <td>S/ {v.igv.toFixed(2)}</td>
                        <td style={{ fontWeight: 900, color: '#10b981' }}>S/ {v.totalPEN.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* I. 8. CÓDIGOS QR & TOKENS DINÁMICOS */}
          {currentSection === 'mesas' && (
            <section id="viewMesas" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1>🏷️ Códigos QR & Tokens Dinámicos por Mesa</h1>
                  <p>Genera la tarjeta protegida y prueba el enlace con el token activo vigente.</p>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <div>
                    <label>Selecciona Mesa Registrada:</label>
                    <select
                      value={qrMesaSeleccionada}
                      onChange={(e) => setQrMesaSeleccionada(e.target.value)}
                    >
                      {mesas.map((m) => (
                        <option key={m.id} value={m.nombre}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Teléfono para Pedidos / WhatsApp:</label>
                    <input
                      type="text"
                      value={qrTelefono}
                      onChange={(e) => setQrTelefono(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-save"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const mesaObj = mesas.find((m) => m.nombre === qrMesaSeleccionada);
                      const tk = mesaObj ? mesaObj.token : 'TK-CUSQ-DEFAULT';
                      window.open(`${window.location.origin}/?mesa=${encodeURIComponent(qrMesaSeleccionada)}&token=${encodeURIComponent(tk)}`, '_blank');
                    }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Probar Menú con Token Activo
                  </button>
                  <button
                    type="button"
                    className="btn btn-add"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const mesaObj = mesas.find((m) => m.nombre === qrMesaSeleccionada);
                      const tk = mesaObj ? mesaObj.token : 'TK-CUSQ-DEFAULT';
                      const url = `${window.location.origin}/?mesa=${encodeURIComponent(qrMesaSeleccionada)}&token=${encodeURIComponent(tk)}`;
                      navigator.clipboard.writeText(url);
                      alert(`✔ Enlace copiado al portapapeles:\n${url}`);
                    }}
                  >
                    <i className="fa-solid fa-copy"></i> Copiar Enlace Válido
                  </button>
                </div>

                {/* Printable Card Preview */}
                <div
                  id="tarjetaQRImpresionCentrada"
                  style={{
                    border: '2px dashed var(--chuspa-gold)',
                    borderRadius: '18px',
                    maxWidth: '320px',
                    margin: '20px auto',
                    padding: '24px 18px',
                    background: '#fff',
                    color: '#000',
                    textAlign: 'center',
                  }}
                >
                  <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.5px', marginBottom: '2px', color: '#0f172a' }}>
                    {config.nombre.toUpperCase()}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    {config.eslogan || 'Cusco • Gourmet'}
                  </p>

                  {qrImgDataUrl && <img src={qrImgDataUrl} alt="QR" style={{ width: '210px', height: '210px', margin: '0 auto', display: 'block' }} />}

                  <h1 style={{ fontSize: '26px', fontWeight: 900, marginTop: '12px', marginBottom: '4px', color: '#0056d2' }}>
                    {qrMesaSeleccionada.toUpperCase()}
                  </h1>
                  <p style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                    Escanea con tu celular para ver la carta y pedir
                  </p>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                    Pedidos: {qrTelefono}
                  </p>
                </div>

                <button
                  className="btn btn-add"
                  style={{ width: '100%', fontSize: '15px' }}
                  onClick={imprimirQrTarjeta}
                >
                  <i className="fa-solid fa-print"></i> Imprimir QR de esta Mesa
                </button>
              </div>
            </section>
          )}

          {/* J. 9. RESEÑAS */}
          {currentSection === 'resenas' && (
            <section id="viewResenas" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1>⭐ Reseñas & Comentarios por Plato</h1>
                  <p>Opiniones y calificaciones de los clientes para fidelización.</p>
                </div>
              </div>

              <div className="card" id="contenedorResenasAdmin">
                {resenas.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--card-bg)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#fbbf24' }}>
                        {r.cliente} ({'⭐'.repeat(r.calificacion || 5)})
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.fecha}</span>
                    </div>
                    {r.mesa && <div style={{ fontSize: '11.5px', color: '#10b981', marginTop: '2px' }}><b>Mesa:</b> {r.mesa}</div>}
                    <p style={{ fontSize: '12.5px', color: 'var(--text-main)', marginTop: '4px' }}>
                      "{r.comentario}"
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* K. 10. TICKET / BOLETA SUNAT (DENTRO DEL PANEL ADMIN) */}
          {(currentSection === 'factura' || currentSection === 'ticket') && (
            <section id="viewFacturaTicket" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1>🧾 Emisión & Consulta de Ticket / Boleta Electrónica</h1>
                  <p>Visualización en formato térmico 80mm con código QR SUNAT e impresión rápida para caja.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-save"
                  onClick={() => handleNavClick('comandas')}
                >
                  <i className="fa-solid fa-arrow-left"></i> Volver a Salón
                </button>
              </div>
              <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '16px', background: '#050d1a' }}>
                <FacturaTicket
                  config={config}
                  onBack={() => handleNavClick('comandas')}
                />
              </div>
            </section>
          )}

          {/* L. CONSOLA DE DESARROLLADOR & RESETEO GENERAL PARA ENTREGA / ALQUILER */}
          {currentSection === 'dev_console' && (
            <section id="viewDevConsole" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c084fc' }}>
                    <i className="fa-solid fa-code"></i> Consola de Desarrollador & Entrega de Restaurante
                  </h1>
                  <p>
                    Administración técnica avanzada: Gestión de tokens, reseteos de mantenimiento y puesta a cero para entrega o alquiler a nuevos clientes.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {devConsoleUnlocked && (
                    <button
                      type="button"
                      className="btn"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                      onClick={() => setDevConsoleUnlocked(false)}
                    >
                      <i className="fa-solid fa-lock"></i> Bloquear Consola
                    </button>
                  )}
                  <button className="btn btn-save" onClick={() => handleNavClick('comandas')}>
                    <i className="fa-solid fa-arrow-left"></i> Volver a Salón
                  </button>
                </div>
              </div>

              {!devConsoleUnlocked ? (
                /* BLOQUEO DE SEGURIDAD PARA ACCESO DEVELOPER */
                <div className="card" style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center', padding: '32px 24px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(192, 132, 252, 0.15)', border: '2px solid rgba(192, 132, 252, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px', color: '#d8b4fe' }}>
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', marginBottom: '8px' }}>
                    Acceso Restringido a Desarrollador
                  </h2>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.4 }}>
                    Este módulo contiene herramientas críticas de reseteo general y tokens de sistema. Ingresa tu clave maestra de desarrollador para desbloquear.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const pin = devPinInput.trim();
                      if (pin === PASSWORD_MAESTRA || pin === 'admin123' || pin === 'regocijo123') {
                        setDevConsoleUnlocked(true);
                        setDevPinError('');
                        setDevPinInput('');
                      } else {
                        setDevPinError('⛔ Clave maestra incorrecta. Inténtalo nuevamente.');
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}
                  >
                    <div>
                      <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold' }}>Clave Maestra Developer:</label>
                      <input
                        type="password"
                        placeholder="Ingresa tu clave maestra o PIN"
                        value={devPinInput}
                        onChange={(e) => {
                          setDevPinInput(e.target.value);
                          setDevPinError('');
                        }}
                        autoFocus
                        style={{ marginTop: '4px', width: '100%', fontSize: '14px', letterSpacing: '2px' }}
                      />
                    </div>

                    {devPinError && (
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {devPinError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
                        color: '#fff',
                        fontWeight: 900,
                        padding: '10px',
                        borderRadius: '10px',
                        marginTop: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <i className="fa-solid fa-unlock"></i> Desbloquear Consola Developer
                    </button>
                  </form>
                </div>
              ) : (
                /* PANELES DE LA CONSOLA DESBLOQUEADA */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* 1. MÓDULO PRINCIPAL: RESETEO GENERAL PARA ENTREGA / ALQUILER EN CERO */}
                  <div
                    className="card"
                    style={{
                      border: '2px solid rgba(239, 68, 68, 0.5)',
                      background: 'radial-gradient(circle at top left, rgba(239, 68, 68, 0.08), transparent 70%), var(--card-bg)',
                      boxShadow: '0 0 30px rgba(239, 68, 68, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#f87171' }}>
                        <i className="fa-solid fa-rocket"></i>
                      </div>
                      <div>
                        <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#fca5a5' }}>
                          Puesta en Cero de Plataforma para Entrega / Alquiler a Cliente
                        </h2>
                        <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
                          Deja el sistema completamente limpio en cero valores para iniciar operaciones comerciales desde cero con un nuevo restaurante.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 900, display: 'block', marginBottom: '6px' }}>
                          🧹 Elementos que se pondrán en Cero:
                        </span>
                        <ul style={{ fontSize: '11.5px', color: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '16px' }}>
                          <li><b>0 Comandas activas</b> (salón, KDS y mozo limpios).</li>
                          <li><b>Todas las Mesas en estado "Libre"</b> (sin ocupaciones).</li>
                          <li><b>0 Ventas contables</b> acumuladas en historial.</li>
                          <li><b>Caja limpia</b> (0 movimientos de dinero y 0 cierres).</li>
                          <li><b>0 Reservas</b> y alertas pendientes eliminadas.</li>
                          <li><b>0 Socios de prueba</b> en el Club de Fidelidad.</li>
                          <li><b>0 Reseñas</b> acumuladas de clientes.</li>
                          <li><b>Correlativos SUNAT reiniciados</b> a 0 (primera venta: B001-000001).</li>
                        </ul>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 900, display: 'block' }}>
                          ⚙️ Parámetros para el Nuevo Restaurante:
                        </span>

                        <div>
                          <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Nombre del Negocio a Entregar:</label>
                          <input
                            type="text"
                            value={entregaForm.nombreNegocio}
                            onChange={(e) => setEntregaForm({ ...entregaForm, nombreNegocio: e.target.value })}
                            placeholder="Ej: La Chuspa Tech o Nombre del Cliente"
                            style={{ width: '100%', marginTop: '3px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#cbd5e1' }}>WhatsApp Oficial del Cliente:</label>
                          <input
                            type="text"
                            value={entregaForm.whatsapp}
                            onChange={(e) => setEntregaForm({ ...entregaForm, whatsapp: e.target.value })}
                            placeholder="Ej: 969773064"
                            style={{ width: '100%', marginTop: '3px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Caja Inicial con la que arranca (S/):</label>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={entregaForm.montoCajaInicial}
                            onChange={(e) => setEntregaForm({ ...entregaForm, montoCajaInicial: Number(e.target.value) || 0 })}
                            style={{ width: '100%', marginTop: '3px' }}
                          />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#f8fafc', cursor: 'pointer', marginTop: '4px' }}>
                          <input
                            type="checkbox"
                            checked={entregaForm.conservarCartaBase}
                            onChange={(e) => setEntregaForm({ ...entregaForm, conservarCartaBase: e.target.checked })}
                          />
                          <span>Conservar catálogo base de platos gastronómicos (Recomendado)</span>
                        </label>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px', padding: '8px', background: 'rgba(15,23,42,0.7)', borderRadius: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#cbd5e1', cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={entregaForm.habilitarComprobantesFiscales}
                              onChange={(e) => setEntregaForm({ ...entregaForm, habilitarComprobantesFiscales: e.target.checked })}
                            />
                            <span>Usar Boleta/Factura</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#cbd5e1', cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={entregaForm.habilitarDniCliente}
                              onChange={(e) => setEntregaForm({ ...entregaForm, habilitarDniCliente: e.target.checked })}
                            />
                            <span>Pedir DNI en Carta</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#cbd5e1', cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={entregaForm.habilitarRucCliente}
                              onChange={(e) => setEntregaForm({ ...entregaForm, habilitarRucCliente: e.target.checked })}
                            />
                            <span>Pedir RUC en Carta</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn"
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '14px',
                        letterSpacing: '0.5px',
                        borderRadius: '12px',
                        border: '1px solid #f87171',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                      onClick={() => {
                        const confirm1 = window.confirm(
                          '🚨 ATENCIÓN DESARROLLADOR:\n\n' +
                          '¿Estás seguro de que deseas ejecutar la PUESTA EN CERO TOTAL?\n' +
                          'Esto borrará todas las comandas, historial de ventas, movimientos de caja, reservas y sellos para dejar el sistema como nuevo para el nuevo cliente.'
                        );
                        if (!confirm1) return;

                        const confirm2 = window.confirm(
                          `¿Confirmas poner en cero para entregar a "${entregaForm.nombreNegocio}" (WhatsApp: ${entregaForm.whatsapp}) con caja inicial de S/ ${entregaForm.montoCajaInicial.toFixed(2)}?`
                        );
                        if (!confirm2) return;

                        storage.resetGeneralParaEntrega({
                          conservarCartaBase: entregaForm.conservarCartaBase,
                          nombreNegocio: entregaForm.nombreNegocio,
                          whatsapp: entregaForm.whatsapp,
                          montoCajaInicial: entregaForm.montoCajaInicial,
                          resetearUsuarios: entregaForm.resetearUsuarios,
                          habilitarDniCliente: entregaForm.habilitarDniCliente,
                          habilitarRucCliente: entregaForm.habilitarRucCliente,
                          habilitarComprobantesFiscales: entregaForm.habilitarComprobantesFiscales,
                        });

                        // Sincronizar estados locales inmediatamente
                        setComandas([]);
                        setMesas(storage.getMesas());
                        setVentas([]);
                        setReservas([]);
                        setSocios([]);
                        setResenas([]);
                        setCajaChica(Number(entregaForm.montoCajaInicial) || 0);
                        const newCfg = storage.getConfig();
                        setIdentidadForm(newCfg);

                        alert(
                          '✔ ¡SISTEMA EN CERO VALORES EXITOSO!\n\n' +
                          'La plataforma ha sido reseteada y configurada limpiamente para el cliente.\n' +
                          'Comandas: 0 | Mesas: Todas Libres | Ventas: S/ 0.00 | Caja: S/ ' + Number(entregaForm.montoCajaInicial).toFixed(2)
                        );
                        handleNavClick('comandas');
                      }}
                    >
                      <i className="fa-solid fa-triangle-exclamation"></i>
                      <span>🚀 Ejecutar Puesta en Cero & Preparar para Entrega de Restaurante</span>
                    </button>
                  </div>

                  {/* 2. MÓDULO: RESETEOS PARCIALES DE MANTENIMIENTO */}
                  <div className="card">
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-screwdriver-wrench text-amber-400"></i> Reseteos Parciales de Mantenimiento
                    </h3>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                      Acciones rápidas para purgar módulos individuales sin afectar el resto de la base de datos:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <strong style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                          <i className="fa-solid fa-broom text-amber-400"></i> Comandas & Mesas
                        </strong>
                        <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px' }}>
                          Elimina órdenes del día y libera todas las mesas a 'Libre'. No borra ventas contables.
                        </p>
                        <button
                          type="button"
                          className="btn btn-del"
                          style={{ width: '100%', fontSize: '11px', padding: '6px' }}
                          onClick={() => {
                            if (window.confirm('¿Deseas purgar todas las comandas de hoy para dejar el salón limpio?')) {
                              storage.purgeComandasHoy();
                              setComandas([]);
                              setMesas(storage.getMesas());
                              alert('✔ Comandas purgadas y mesas liberadas.');
                            }
                          }}
                        >
                          Purgar Comandas de Hoy
                        </button>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <strong style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                          <i className="fa-solid fa-file-invoice-dollar text-emerald-400"></i> Historial Contable
                        </strong>
                        <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px' }}>
                          Vacía el registro acumulado de comprobantes y ventas cobradas.
                        </p>
                        <button
                          type="button"
                          className="btn btn-del"
                          style={{ width: '100%', fontSize: '11px', padding: '6px' }}
                          onClick={() => {
                            if (window.confirm('¿Deseas eliminar todo el historial contable acumulado de ventas?')) {
                              storage.purgeVentas();
                              setVentas([]);
                              alert('✔ Historial contable de ventas vaciado.');
                            }
                          }}
                        >
                          Vaciar Ventas Contables
                        </button>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <strong style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                          <i className="fa-solid fa-calendar-xmark text-sky-400"></i> Reservas
                        </strong>
                        <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px' }}>
                          Limpia el registro de reservas programadas y alertas de nuevas citas.
                        </p>
                        <button
                          type="button"
                          className="btn"
                          style={{ width: '100%', fontSize: '11px', padding: '6px', background: 'rgba(14, 165, 233, 0.2)', color: '#7dd3fc', border: '1px solid rgba(14, 165, 233, 0.4)' }}
                          onClick={() => {
                            if (window.confirm('¿Deseas purgar todas las reservas registradas?')) {
                              storage.purgeReservas();
                              setReservas([]);
                              alert('✔ Historial de reservas purgado.');
                            }
                          }}
                        >
                          Vaciar Reservas
                        </button>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <strong style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                          <i className="fa-solid fa-gift text-pink-400"></i> Club de Fidelidad
                        </strong>
                        <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px' }}>
                          Vacía los clientes registrados con sellos para iniciar nueva campaña.
                        </p>
                        <button
                          type="button"
                          className="btn"
                          style={{ width: '100%', fontSize: '11px', padding: '6px', background: 'rgba(244, 114, 182, 0.2)', color: '#f472b6', border: '1px solid rgba(244, 114, 182, 0.4)' }}
                          onClick={() => {
                            if (window.confirm('¿Deseas vaciar la lista de socios del Club de Fidelidad?')) {
                              storage.purgeSocios();
                              setSocios([]);
                              alert('✔ Socios de fidelidad vaciados.');
                            }
                          }}
                        >
                          Vaciar Socios del Club
                        </button>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <strong style={{ fontSize: '12px', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                          <i className="fa-solid fa-hashtag text-purple-400"></i> Correlativos SUNAT
                        </strong>
                        <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px' }}>
                          Reinicia los números correlativos de Boletas y Facturas a 000001.
                        </p>
                        <button
                          type="button"
                          className="btn"
                          style={{ width: '100%', fontSize: '11px', padding: '6px', background: 'rgba(192, 132, 252, 0.2)', color: '#d8b4fe', border: '1px solid rgba(192, 132, 252, 0.4)' }}
                          onClick={() => {
                            if (window.confirm('¿Deseas reiniciar los correlativos a B001-000001 y F001-000001?')) {
                              storage.resetCorrelativos();
                              alert('✔ Correlativos reiniciados a 000001.');
                            }
                          }}
                        >
                          Reiniciar Correlativos a 1
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. MÓDULO: API SUNAT / RENIEC (APISPERÚ BETA / PRODUCCIÓN) & PRUEBA EN VIVO */}
                  <div className="card" style={{ border: '1.5px solid rgba(56, 189, 248, 0.45)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-plug-circle-check text-sky-400"></i> API SUNAT / RENIEC (ApisPerú Beta & Producción)
                    </h3>
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      background: devApiSyncedCloud ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.14)',
                      border: `1px solid ${devApiSyncedCloud ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.5)'}`,
                      color: devApiSyncedCloud ? '#34d399' : '#fca5a5',
                    }}>
                      {devApiSyncedCloud
                        ? '☁️ Sincronizado en Firebase RTDB (/dev_api): El Menú Digital (index) en celulares ya puede validar DNI y RUC en tiempo real.'
                        : '⚠️ Este token aún NO está guardado en Firebase RTDB (/dev_api). Pulsa "Guardar Configuración API SUNAT/RENIEC" para que el Menú Digital (index) pueda validar DNI y RUC.'}
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontSize: '11px', color: '#fde68a', lineHeight: 1.5 }}>
                      <b>⚠️ Importante sobre Tokens de ApisPerú:</b><br />
                      • <b>Token API Consultas (DNI / RUC):</b> Se obtiene en el menú izquierdo de ApisPerú → <i>"API Consultas DNI/RUC"</i> (endpoint <code>dniruc.apisperu.com</code>).<br />
                      • <b>Token de Empresa (Facturación Beta / Prod):</b> Se obtiene en <i>"API Facturación Electrónica"</i> (endpoint <code>facturacion.apisperu.com</code>) y sirve únicamente para enviar Boletas/Facturas a SUNAT, <b>no valida DNI/RUC</b> si lo pegas en Consultas.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Entorno SUNAT (ApisPerú):</label>
                        <select
                          value={devApiForm.entorno}
                          onChange={(e) => setDevApiForm({ ...devApiForm, entorno: e.target.value as 'beta' | 'produccion' })}
                          style={{ width: '100%', marginTop: '3px' }}
                        >
                          <option value="beta">🧪 Entorno BETA (Pruebas SUNAT)</option>
                          <option value="produccion">🚀 Entorno PRODUCCIÓN (Real SUNAT)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Proveedor Consultas DNI / RUC:</label>
                        <select
                          value={devApiForm.proveedorConsultas}
                          onChange={(e) => setDevApiForm({ ...devApiForm, proveedorConsultas: e.target.value as 'auto' | 'apisperu' | 'apisnetpe' })}
                          style={{ width: '100%', marginTop: '3px' }}
                        >
                          <option value="apisperu">ApisPerú (dniruc.apisperu.com)</option>
                          <option value="apisnetpe">Apis.net.pe (api.apis.net.pe)</option>
                          <option value="auto">Automático (ApisPerú + respaldo Apis.net.pe)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#cbd5e1' }}>RUC Emisor (Empresa Facturación):</label>
                        <input
                          type="text"
                          maxLength={11}
                          placeholder="Ej: 10424235496"
                          value={devApiForm.rucEmisor}
                          onChange={(e) => setDevApiForm({ ...devApiForm, rucEmisor: e.target.value.replace(/\D/g, '') })}
                          style={{ width: '100%', marginTop: '3px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Token API Consultas DNI / RUC (para validar RENIEC y SUNAT):</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                          <input
                            type={showDniToken ? 'text' : 'password'}
                            placeholder="Pega aquí el token de API Consultas DNI/RUC (eyJ0eXAi...)"
                            value={devApiForm.tokenConsultasDniRuc}
                            onChange={(e) => {
                              devApiTouchedRef.current = true;
                              setDevApiForm({ ...devApiForm, tokenConsultasDniRuc: e.target.value });
                            }}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '0 12px' }}
                            onClick={() => setShowDniToken(!showDniToken)}
                          >
                            <i className={`fa-solid ${showDniToken ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Token de Empresa Facturación Electrónica (Beta / Producción):</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                          <input
                            type={showFactToken ? 'text' : 'password'}
                            placeholder="Pega aquí el Token de Empresa de Facturación Electrónica (eyJ0eXAi...)"
                            value={devApiForm.tokenFacturacion}
                            onChange={(e) => {
                              devApiTouchedRef.current = true;
                              setDevApiForm({ ...devApiForm, tokenFacturacion: e.target.value });
                            }}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '0 12px' }}
                            onClick={() => setShowFactToken(!showFactToken)}
                          >
                            <i className={`fa-solid ${showFactToken ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-save"
                        style={{ fontSize: '11.5px', padding: '8px 14px' }}
                        onClick={async () => {
                          devApiTouchedRef.current = true;
                          const ok = await saveDevApiConfig(devApiForm);
                          setDevApiForm({ ...devApiForm });
                          if (!ok) {
                            alert(storage.getFirebaseState().lastError || '⚠️ Guardado en este dispositivo, pero Firebase rechazó escribir /dev_api. Verifica las reglas de Firebase Realtime Database.');
                          } else {
                            alert('✔ Tokens y entorno SUNAT/RENIEC guardados en Firebase RTDB (sincronizados en vivo con Carta Digital index y Caja).');
                          }
                        }}
                      >
                        <i className="fa-solid fa-floppy-disk"></i> Guardar Configuración API SUNAT/RENIEC
                      </button>

                      <button
                        type="button"
                        className="btn"
                        disabled={isTestingTokens}
                        style={{
                          fontSize: '11.5px',
                          padding: '8px 14px',
                          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                          color: '#fff',
                          border: 'none',
                        }}
                        onClick={async () => {
                          devApiTouchedRef.current = true;
                          await saveDevApiConfig(devApiForm);
                          setIsTestingTokens(true);
                          try {
                            const diag = await probarConexionTokens(
                              devApiForm.tokenConsultasDniRuc,
                              devApiForm.tokenFacturacion,
                              devApiForm.entorno
                            );
                            setDiagnosticoTokens(diag);
                          } finally {
                            setIsTestingTokens(false);
                          }
                        }}
                      >
                        <i className="fa-solid fa-stethoscope"></i>{' '}
                        {isTestingTokens ? 'Verificando conexión real...' : '🔌 Probar Validación Token en Vivo'}
                      </button>
                    </div>

                    {diagnosticoTokens && (
                      <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: '#020617', border: '1px solid #334155', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ color: diagnosticoTokens.dniOk ? '#34d399' : '#f87171', fontWeight: 700 }}>
                          {diagnosticoTokens.dniOk ? '✔' : '✖'} Consulta DNI (RENIEC): {diagnosticoTokens.dniDetalle}
                        </div>
                        <div style={{ color: diagnosticoTokens.rucOk ? '#34d399' : '#f87171', fontWeight: 700 }}>
                          {diagnosticoTokens.rucOk ? '✔' : '✖'} Consulta RUC (SUNAT): {diagnosticoTokens.rucDetalle}
                        </div>
                        <div style={{ color: '#fbbf24' }}>
                          • Token Facturación ({devApiForm.entorno.toUpperCase()}): {diagnosticoTokens.facturacionTokenInfo}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. CONTROLES DE DNI / RUC EN MENÚ CLIENTE & PERSONALIZADOR DE COLORES AL ALQUILAR */}
                  <div className="card" style={{ border: '1.5px solid rgba(16, 185, 129, 0.4)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-palette text-emerald-400"></i> Reglas Fiscales del Cliente (`index`) & Paleta de Colores por Negocio
                    </h3>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
                      Activa o desactiva la solicitud de DNI / RUC / Comprobantes en la carta del cliente según el giro del negocio alquilado, y adapta los colores al instante:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '14px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#f8fafc', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={identidadForm.habilitarComprobantesFiscales !== false}
                          onChange={(e) => {
                            const updated = { ...identidadForm, habilitarComprobantesFiscales: e.target.checked };
                            setIdentidadForm(updated);
                            storage.saveConfig(updated);
                          }}
                        />
                        <span>Emitir Boleta / Factura</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#f8fafc', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={identidadForm.habilitarDniCliente !== false}
                          onChange={(e) => {
                            const updated = { ...identidadForm, habilitarDniCliente: e.target.checked };
                            setIdentidadForm(updated);
                            storage.saveConfig(updated);
                          }}
                        />
                        <span>Mostrar DNI en `index` cliente</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#f8fafc', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={identidadForm.habilitarRucCliente !== false}
                          onChange={(e) => {
                            const updated = { ...identidadForm, habilitarRucCliente: e.target.checked };
                            setIdentidadForm(updated);
                            storage.saveConfig(updated);
                          }}
                        />
                        <span>Mostrar RUC en `index` cliente</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#f8fafc', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={identidadForm.exigirValidacionReniecSunat !== false}
                          onChange={(e) => {
                            const updated = { ...identidadForm, exigirValidacionReniecSunat: e.target.checked };
                            setIdentidadForm(updated);
                            storage.saveConfig(updated);
                          }}
                        />
                        <span>Exigir validación RENIEC/SUNAT</span>
                      </label>
                    </div>

                    <strong style={{ fontSize: '12px', color: '#fbbf24', display: 'block', marginBottom: '8px' }}>
                      🎨 Paletas Predefinidas o Colores Personalizados:
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {(
                        [
                          { label: 'Chuspa Tech (Azul & Oro)', colors: { primary: '#0056D2', accent: '#E11D48', gold: '#F59E0B', bgDark: '#050D1A', cardBg: '#09152B' } },
                          { label: 'Parrillas & Brasas (Rojo & Carbón)', colors: { primary: '#DC2626', accent: '#F97316', gold: '#FBBF24', bgDark: '#120807', cardBg: '#1E1110' } },
                          { label: 'Cevichería Costa (Turquesa & Lima)', colors: { primary: '#0284C7', accent: '#10B981', gold: '#38BDF8', bgDark: '#041621', cardBg: '#082436' } },
                          { label: 'Café & Bistro (Esmeralda & Crema)', colors: { primary: '#059669', accent: '#D97706', gold: '#FDE68A', bgDark: '#061A13', cardBg: '#0A291F' } },
                          { label: 'Morado Comercial & Oro', colors: { primary: '#7C3AED', accent: '#EC4899', gold: '#FBBF24', bgDark: '#120826', cardBg: '#1E0F3D' } },
                        ] as { label: string; colors: ThemeColorsConfig }[]
                      ).map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          className="btn"
                          style={{
                            fontSize: '11px',
                            padding: '6px 10px',
                            background: preset.colors.primary,
                            color: '#fff',
                            border: `1px solid ${preset.colors.gold}`,
                          }}
                          onClick={() => {
                            const updated = { ...identidadForm, themeColors: preset.colors };
                            setIdentidadForm(updated);
                            storage.saveConfig(updated);
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                      {(
                        [
                          { key: 'primary', label: 'Color Principal' },
                          { key: 'accent', label: 'Acento / Botones' },
                          { key: 'gold', label: 'Dorado / Marca' },
                          { key: 'bgDark', label: 'Fondo Principal' },
                          { key: 'cardBg', label: 'Fondo Tarjetas' },
                        ] as { key: keyof ThemeColorsConfig; label: string }[]
                      ).map((item) => {
                        const val = identidadForm.themeColors?.[item.key] || '#0056D2';
                        return (
                          <div key={item.key} style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span style={{ fontSize: '10.5px', color: '#cbd5e1' }}>{item.label}</span>
                            <input
                              type="color"
                              value={val}
                              onChange={(e) => {
                                const nextColors: ThemeColorsConfig = {
                                  primary: identidadForm.themeColors?.primary || '#0056D2',
                                  accent: identidadForm.themeColors?.accent || '#E11D48',
                                  gold: identidadForm.themeColors?.gold || '#F59E0B',
                                  bgDark: identidadForm.themeColors?.bgDark || '#050D1A',
                                  cardBg: identidadForm.themeColors?.cardBg || '#09152B',
                                  [item.key]: e.target.value,
                                };
                                setIdentidadForm({ ...identidadForm, themeColors: nextColors });
                              }}
                              style={{ width: '32px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="btn btn-save"
                      style={{ fontSize: '11.5px', padding: '8px 14px' }}
                      onClick={() => {
                        storage.saveConfig(identidadForm);
                        alert('✔ Colores del sistema aplicados en tiempo real.');
                      }}
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i> Aplicar Colores al Sistema
                    </button>
                  </div>

                  {/* 5. MÓDULO: GESTIÓN DE TOKENS Y CREDENCIALES DE DESPLIEGUE */}
                  <div className="card">
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-key text-sky-400"></i> Token de Despliegue (GitHub)
                    </h3>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                      Configura el token de GitHub para automatización de despliegues y PWA Builder sin que sea visible para meseros o cajeros:
                    </p>

                    <div style={{ maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        GitHub Personal Access Token (ghp_...):
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type={showGhToken ? 'text' : 'password'}
                          placeholder="Pega aquí tu token ghp_..."
                          value={ghToken}
                          onChange={(e) => setGhToken(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn"
                          style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '0 12px' }}
                          onClick={() => setShowGhToken(!showGhToken)}
                          title={showGhToken ? 'Ocultar' : 'Mostrar'}
                        >
                          <i className={`fa-solid ${showGhToken ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-save"
                          style={{ fontSize: '11.5px', padding: '7px 14px' }}
                          onClick={() => {
                            localStorage.setItem('inkabistro_vault_secret_token', ghToken);
                            alert('✔ Token de GitHub guardado de forma segura en la consola de desarrollador.');
                          }}
                        >
                          <i className="fa-solid fa-floppy-disk"></i> Guardar Token
                        </button>
                        <button
                          type="button"
                          className="btn btn-del"
                          style={{ fontSize: '11.5px', padding: '7px 14px' }}
                          onClick={() => {
                            setGhToken('');
                            localStorage.removeItem('inkabistro_vault_secret_token');
                            alert('✔ Token de GitHub eliminado.');
                          }}
                        >
                          <i className="fa-solid fa-trash"></i> Eliminar Token
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 6. MÓDULO: BASE DE DATOS EN TIEMPO REAL FIREBASE (RTDB) */}
                  <div className="card" style={{ border: '1.5px solid rgba(245, 158, 11, 0.45)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-fire text-amber-400"></i> Base de Datos Firebase Realtime Database (Sin Sincronización Local)
                    </h3>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
                      Toda la plataforma (Carta Digital `index`, Panel `admin`, Cocina KDS y Portal de `reservas`) sincroniza sus comandas, reservas, mesas, caja y catálogo directamente con Firebase RTDB:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#cbd5e1' }}>URL de Firebase Realtime Database:</label>
                        <input
                          type="url"
                          placeholder="https://restaurante1-695f7-default-rtdb.firebaseio.com"
                          value={firebaseUrlInput}
                          onChange={(e) => setFirebaseUrlInput(e.target.value)}
                          style={{ width: '100%', marginTop: '3px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-save"
                          style={{ fontSize: '11.5px', padding: '8px 14px' }}
                          onClick={async () => {
                            await storage.reconnectFirebase(firebaseUrlInput);
                            const res = await storage.testFirebaseConnection(firebaseUrlInput);
                            setFirebaseTestResult(res);
                            setFirebaseState(storage.getFirebaseState());
                            alert(res.ok ? `✔ Conectado a Firebase: ${res.message}` : `⚠️ ${res.message}`);
                          }}
                        >
                          <i className="fa-solid fa-link"></i> Guardar URL & Reconectar
                        </button>

                        <button
                          type="button"
                          className="btn"
                          disabled={isTestingFirebase}
                          style={{ fontSize: '11.5px', padding: '8px 14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', fontWeight: 900, border: 'none' }}
                          onClick={async () => {
                            setIsTestingFirebase(true);
                            try {
                              const res = await storage.testFirebaseConnection(firebaseUrlInput);
                              setFirebaseTestResult(res);
                              setFirebaseState(storage.getFirebaseState());
                            } finally {
                              setIsTestingFirebase(false);
                            }
                          }}
                        >
                          <i className="fa-solid fa-stethoscope"></i>{' '}
                          {isTestingFirebase ? 'Probando Firebase...' : '🔥 Probar Conexión y Reglas Firebase'}
                        </button>

                        <button
                          type="button"
                          className="btn"
                          disabled={isSeedingFirebase}
                          style={{ fontSize: '11.5px', padding: '8px 14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 900, border: 'none' }}
                          onClick={async () => {
                            if (!window.confirm('¿Deseas inicializar / subir la estructura base (configuración La Chuspa Tech, carta de platos y mesas) hacia Firebase RTDB?')) return;
                            setIsSeedingFirebase(true);
                            try {
                              const ok = await storage.seedFirebaseDefaults(true);
                              setFirebaseState(storage.getFirebaseState());
                              alert(ok
                                ? '✔ Estructura base, carta de platos y mesas guardadas en Firebase Realtime Database.'
                                : (storage.getFirebaseState().lastError || '✖ Firebase rechazó la escritura. Revisa las reglas ".write" en Firebase Console.'));
                            } finally {
                              setIsSeedingFirebase(false);
                            }
                          }}
                        >
                          <i className="fa-solid fa-cloud-arrow-up"></i>{' '}
                          {isSeedingFirebase ? 'Subiendo...' : '📤 Inicializar Datos Base en Firebase'}
                        </button>
                      </div>

                      {firebaseTestResult && (
                        <div style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: '#020617',
                          border: `1px solid ${firebaseTestResult.ok ? '#10b981' : '#ef4444'}`,
                          color: firebaseTestResult.ok ? '#34d399' : '#f87171',
                          fontSize: '11.5px',
                          fontWeight: 700,
                        }}>
                          {firebaseTestResult.ok ? '✔' : '✖'} {firebaseTestResult.message}
                        </div>
                      )}

                      {firebaseState.status === 'permission_denied' && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.45)', borderRadius: '10px', padding: '10px 12px', fontSize: '11px', color: '#fecaca', lineHeight: 1.5 }}>
                          <b>🔒 Reglas de Firebase RTDB bloqueadas (`Permission denied`):</b><br />
                          Entra a <b>Firebase Console → Realtime Database → Reglas</b> del proyecto <code>restaurante1-695f7</code> y habilita lectura/escritura para los nodos del restaurante antes de operar pedidos reales.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* MODAL COBRO FLOTANTE */}
      {comandaCobrando && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (isProcesandoCobro) return;
            activeComandaCobrandoIdRef.current = null;
            setComandaCobrando(null);
          }}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fbbf24' }}>Cobro de {comandaCobrando.mesa}</h3>
              <button
                type="button"
                disabled={isProcesandoCobro}
                style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => {
                  if (isProcesandoCobro) return;
                  activeComandaCobrandoIdRef.current = null;
                  setComandaCobrando(null);
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: '#061122', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--chuspa-gold-border)', margin: '6px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Mesa / Cliente:</span>
                <b>{comandaCobrando.cliente || comandaCobrando.mesa}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>
                <span>Total Acumulado a Pagar:</span>
                <span>S/ {(comandaCobrando.totalPEN || comandaCobrando.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label>Tipo Comprobante:</label>
                <select
                  value={cobroTipo}
                  onChange={(e) => {
                    const nextTipo = e.target.value as 'Boleta' | 'Factura' | 'Nota de Venta';
                    setCobroTipo(nextTipo);
                    setDocCobroValidado(false);
                    setCobroErrorMsg('');
                    if (nextTipo === 'Nota de Venta') {
                      setCobroRazon(comandaCobrando.cliente || 'Cliente General');
                    } else if (identidadForm.exigirValidacionReniecSunat !== false) {
                      setCobroRazon('');
                    }
                  }}
                >
                  {identidadForm.habilitarComprobantesFiscales !== false && (
                    <>
                      <option value="Boleta">🧾 Boleta de Venta (DNI RENIEC)</option>
                      <option value="Factura">🏢 Factura Electrónica (RUC SUNAT)</option>
                    </>
                  )}
                  <option value="Nota de Venta">📄 Nota de Venta / Ticket Interno</option>
                </select>
              </div>
              <div>
                <label>Método de Pago:</label>
                <select value={cobroMetodo} onChange={(e) => setCobroMetodo(e.target.value)}>
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Yape">🟣 Yape</option>
                  <option value="Plin">🔵 Plin</option>
                  <option value="Yape / Plin">📱 Yape / Plin</option>
                  <option value="Tarjeta POS">💳 Tarjeta POS</option>
                </select>
              </div>
            </div>

            {cobroTipo !== 'Nota de Venta' ? (
              <div style={{ background: '#061122', padding: '10px', borderRadius: '8px', border: '1px dashed #334155', marginTop: '8px' }}>
                <label style={{ marginTop: 0 }}>
                  {cobroTipo === 'Factura' ? 'RUC del Cliente (11 dígitos):' : 'DNI del Cliente (8 dígitos):'}
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    maxLength={cobroTipo === 'Factura' ? 11 : 8}
                    placeholder={cobroTipo === 'Factura' ? '20...' : '45...'}
                    value={cobroRuc}
                    onChange={(e) => {
                      setCobroRuc(e.target.value.replace(/\D/g, ''));
                      setDocCobroValidado(false);
                      setCobroErrorMsg('');
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-save"
                    disabled={isConsultandoCobro}
                    style={{ fontSize: '11px', padding: '6px 10px', whiteSpace: 'nowrap' }}
                    onClick={async () => {
                      const doc = cobroRuc.trim();
                      setCobroErrorMsg('');
                      setDocCobroValidado(false);
                      setIsConsultandoCobro(true);
                      try {
                        if (cobroTipo === 'Factura') {
                          const res = await consultarRUC(doc);
                          if (res.success && res.razon_social) {
                            setCobroRazon(res.razon_social);
                            setDocCobroValidado(true);
                          } else {
                            setCobroErrorMsg(res.message || 'No se pudo validar el RUC en SUNAT.');
                          }
                        } else {
                          const res = await consultarDNI(doc);
                          if (res.success && res.nombres_completos) {
                            setCobroRazon(res.nombres_completos);
                            setDocCobroValidado(true);
                          } else {
                            setCobroErrorMsg(res.message || 'No se pudo validar el DNI en RENIEC.');
                          }
                        }
                      } finally {
                        setIsConsultandoCobro(false);
                      }
                    }}
                  >
                    {isConsultandoCobro ? 'Consultando...' : cobroTipo === 'Factura' ? 'Consultar SUNAT' : 'Consultar RENIEC'}
                  </button>
                </div>

                {docCobroValidado && (
                  <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, marginTop: '6px' }}>
                    ✔ Titular validado ante {cobroTipo === 'Factura' ? 'SUNAT' : 'RENIEC'}
                  </div>
                )}
                {cobroErrorMsg && (
                  <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, marginTop: '6px', background: 'rgba(239,68,68,0.1)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>
                    ⚠️ {cobroErrorMsg}
                  </div>
                )}

                <label style={{ marginTop: '8px', display: 'block' }}>Razón Social / Nombre Titular:</label>
                <input
                  type="text"
                  readOnly={identidadForm.exigirValidacionReniecSunat !== false}
                  placeholder={identidadForm.exigirValidacionReniecSunat !== false ? 'Se completa tras validar en RENIEC/SUNAT' : 'Nombre o Empresa S.A.C.'}
                  value={cobroRazon}
                  onChange={(e) => setCobroRazon(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ background: '#061122', padding: '10px', borderRadius: '8px', border: '1px dashed #334155', marginTop: '8px' }}>
                <label style={{ marginTop: 0 }}>Cliente / Referencia (Ticket Interno):</label>
                <input
                  type="text"
                  placeholder="Nombre o referencia del cliente"
                  value={cobroRazon}
                  onChange={(e) => setCobroRazon(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-del"
                disabled={isProcesandoCobro}
                onClick={() => {
                  activeComandaCobrandoIdRef.current = null;
                  setComandaCobrando(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-save"
                disabled={isProcesandoCobro}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '100%', border: 'none', opacity: isProcesandoCobro ? 0.7 : 1 }}
                onClick={handleConfirmarCobro}
              >
                <i className="fa-solid fa-print"></i>{' '}
                {isProcesandoCobro
                  ? 'Procesando cobro...'
                  : cobroTipo === 'Nota de Venta'
                  ? 'Cobrar e Imprimir Nota de Venta'
                  : `Cobrar e Imprimir ${cobroTipo}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLATOS FLOTANTE */}
      {isDishModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDishModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fbbf24' }}>
                {platoEditandoId ? 'Editar Plato de la Carta' : 'Nuevo Plato'}
              </h3>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => setIsDishModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <label>Nombre del Plato:</label>
            <input
              type="text"
              placeholder="Ej: Lomo Saltado Criollo"
              value={dishForm.nombre}
              onChange={(e) => setDishForm({ ...dishForm, nombre: e.target.value })}
            />

            <label>Descripción / Receta:</label>
            <textarea
              rows={2}
              placeholder="Ingredientes y preparación..."
              value={dishForm.descripcion}
              onChange={(e) => setDishForm({ ...dishForm, descripcion: e.target.value })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label>Precio (PEN):</label>
                <input
                  type="number"
                  step="0.5"
                  value={dishForm.precio}
                  onChange={(e) => setDishForm({ ...dishForm, precio: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label>Categoría:</label>
                <select
                  value={dishForm.categoria}
                  onChange={(e) => setDishForm({ ...dishForm, categoria: e.target.value })}
                >
                  <option value="mains">Platos Fuertes</option>
                  <option value="entradas">Entradas</option>
                  <option value="drinks">Bebidas & Cocteles</option>
                  <option value="postres">Postres</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#061122', padding: '10px', borderRadius: '8px', border: '1px dashed #334155', marginTop: '6px' }}>
              <label style={{ marginTop: 0 }}>Foto / Portada del Plato:</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={dishForm.imagenUrl}
                onChange={(e) => setDishForm({ ...dishForm, imagenUrl: e.target.value })}
              />
            </div>

            <div style={{ background: '#061122', padding: '10px', borderRadius: '8px', border: '1px dashed #334155', marginTop: '8px' }}>
              <label style={{ fontWeight: 'bold', color: '#fff', marginTop: 0 }}>Video Reels MP4 (Opcional):</label>
              <input
                type="url"
                placeholder="https://commondatastorage.googleapis.com/..."
                value={dishForm.videoUrl}
                onChange={(e) => setDishForm({ ...dishForm, videoUrl: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" className="btn btn-del" onClick={() => setIsDishModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-save"
                onClick={() => {
                  const p: Producto = {
                    id: platoEditandoId || `dish-${Date.now()}`,
                    category: dishForm.categoria,
                    precioPEN: dishForm.precio,
                    videoUrl: dishForm.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    posterUrl: dishForm.imagenUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
                    disponible: true,
                    i18n: {
                      es: { name: dishForm.nombre, desc: dishForm.descripcion },
                      en: { name: dishForm.nombre, desc: dishForm.descripcion },
                      fr: { name: dishForm.nombre, desc: dishForm.descripcion },
                      pt: { name: dishForm.nombre, desc: dishForm.descripcion },
                    },
                  };
                  storage.saveProducto(p);
                  setIsDishModalOpen(false);
                  alert('✔ Plato guardado exitosamente.');
                }}
              >
                <i className="fa-solid fa-floppy-disk"></i> Guardar Plato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA CENTRADO */}
      {alertOverlay.show && (
        <div className="alerta-centro-overlay" onClick={() => setAlertOverlay({ ...alertOverlay, show: false })}>
          <div className="alerta-centro-card" onClick={(e) => e.stopPropagation()}>
            <div className="alerta-icono-wrap" style={{ borderColor: alertOverlay.iconColor, color: alertOverlay.iconColor }}>
              <i className={`fa-solid ${alertOverlay.icon}`}></i>
            </div>
            <h2 style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>
              {alertOverlay.title}
            </h2>
            <p style={{ fontSize: '14px', color: '#f8fafc', lineHeight: 1.45, marginBottom: '10px' }}>
              {alertOverlay.message}
            </p>
            <div style={{ background: '#051022', border: '1px dashed var(--chuspa-gold)', borderRadius: '10px', padding: '10px', fontSize: '13px', color: '#fbbf24' }}>
              {alertOverlay.detail}
            </div>
            <button
              type="button"
              className="btn-alerta-entendido"
              onClick={() => setAlertOverlay({ ...alertOverlay, show: false })}
            >
              <i className="fa-solid fa-check"></i> Entendido / Cerrar Aviso
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN CENTRADA RESPLANDECIENTE DANDO VUELTAS ALREDEDOR DE LAS LÍNEAS - SOLICITUD DE PAGO */}
      {solicitudPagoModal && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative p-[4px] rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.85)] max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* Resplandor giratorio dando vueltas alrededor de las líneas del cuadro */}
            <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,#f59e0b_0deg,#ef4444_90deg,#10b981_180deg,#3b82f6_270deg,#f59e0b_360deg)] animate-[spin_3s_linear_infinite]" />

            {/* Contenido interior de la notificación */}
            <div className="relative bg-[#071224] rounded-[22px] p-6 sm:p-7 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-3 animate-bounce">
                🔔
              </div>

              <span className="px-3 py-1 rounded-full bg-red-600/90 text-white font-black text-[11px] uppercase tracking-wider mb-2 border border-amber-400 animate-pulse">
                ¡Solicitud de Pago en Caja!
              </span>

              <h2 className="text-2xl font-black text-amber-400 font-latina-luxury tracking-wide">
                El cliente viene a pagar su cuenta
              </h2>

              <div className="my-4 w-full bg-slate-900/90 border border-amber-400/40 rounded-2xl p-4 text-left space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400 uppercase font-bold">Mesa del Salón:</span>
                  <span className="text-lg font-black text-white bg-blue-600/60 border border-sky-400 px-3 py-0.5 rounded-lg">
                    {solicitudPagoModal.mesa}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Cliente:</span>
                  <span className="font-extrabold text-white">{solicitudPagoModal.cliente || 'Comensal Salón'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Comanda:</span>
                  <span className="font-mono text-amber-300 font-bold">{solicitudPagoModal.numero || solicitudPagoModal.comandaId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Método Previsto:</span>
                  <span className="font-extrabold text-emerald-400">{solicitudPagoModal.metodo || 'Efectivo'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-sm font-black text-amber-400">Total a Cobrar:</span>
                  <span className="text-xl font-black text-emerald-400">
                    S/ {(solicitudPagoModal.totalPEN || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleAceptarYCobrarSolicitud(solicitudPagoModal)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] border-2 border-emerald-300 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-cash-register text-base"></i>
                  <span>Aceptar y Cobrar Cuenta de {solicitudPagoModal.mesa}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    dismissedBillComandaIdsRef.current.add(solicitudPagoModal.comandaId);
                    storage.clearSolicitudPago(solicitudPagoModal.comandaId);
                    setSolicitudPagoModal(null);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Posponer / Cerrar Aviso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN CENTRADA RESPLANDECIENTE DANDO VUELTAS ALREDEDOR DE LAS LÍNEAS - NUEVA RESERVA RECIBIDA */}
      {alertaNuevaReservaModal && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative p-[4px] rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.85)] max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* Resplandor giratorio dando vueltas alrededor de las líneas del cuadro */}
            <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,#3b82f6_0deg,#f59e0b_90deg,#10b981_180deg,#8b5cf6_270deg,#3b82f6_360deg)] animate-[spin_3s_linear_infinite]" />

            {/* Contenido interior de la alerta */}
            <div className="relative bg-[#071224] rounded-[22px] p-6 sm:p-7 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-sky-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(59,130,246,0.5)] mb-3 animate-bounce">
                📅
              </div>

              <span className="px-3.5 py-1 rounded-full bg-blue-600/90 text-white font-black text-[11px] uppercase tracking-wider mb-2 border border-sky-400 animate-pulse">
                🔔 ¡Nueva Reserva Recibida en Tiempo Real!
              </span>

              <h2 className="text-2xl font-black text-amber-400 font-latina-luxury tracking-wide">
                {alertaNuevaReservaModal.reserva.cliente}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Ha generado una nueva reserva en el sistema
              </p>

              <div className="my-4 w-full bg-slate-900/90 border border-sky-400/40 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 uppercase font-bold">Código Reserva:</span>
                  <span className="font-mono text-amber-300 font-extrabold">{alertaNuevaReservaModal.reserva.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Fecha & Hora:</span>
                  <span className="font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {alertaNuevaReservaModal.reserva.fechaReserva} • {alertaNuevaReservaModal.reserva.horaReserva}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Mesa Asignada:</span>
                  <span className="font-extrabold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/40">
                    {alertaNuevaReservaModal.reserva.mesaAsignada} ({alertaNuevaReservaModal.reserva.personas} personas)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">WhatsApp / Teléfono:</span>
                  <span className="font-bold text-slate-200">{alertaNuevaReservaModal.reserva.telefono}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Estado:</span>
                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${alertaNuevaReservaModal.reserva.pagoConfirmado ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-amber-950 text-amber-300 border border-amber-500/50'}`}>
                    {alertaNuevaReservaModal.reserva.estado} {alertaNuevaReservaModal.reserva.pagoConfirmado ? `(Adelanto S/ ${alertaNuevaReservaModal.reserva.montoAdelanto?.toFixed(2)} ${alertaNuevaReservaModal.reserva.metodoPagoAdelanto || ''})` : '(Por Confirmar)'}
                  </span>
                </div>
                {alertaNuevaReservaModal.reserva.itemsPedidos && alertaNuevaReservaModal.reserva.itemsPedidos.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                      Platos Seleccionados ({alertaNuevaReservaModal.reserva.itemsPedidos.length}):
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {alertaNuevaReservaModal.reserva.itemsPedidos.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                          <span>{it.cantidad}x {it.nombre}</span>
                          <span className="font-mono text-amber-300 font-bold">S/ {(it.cantidad * it.precio).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {alertaNuevaReservaModal.reserva.notas && (
                  <div className="pt-1 text-[11px] text-slate-400 italic">
                    "{alertaNuevaReservaModal.reserva.notas}"
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    storage.clearAlertaNuevaReserva();
                    setAlertaNuevaReservaModal(null);
                    setCurrentSection('reservas');
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 hover:to-sky-400 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(59,130,246,0.5)] border-2 border-sky-300 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-calendar-check text-sm"></i>
                  <span>Ver en Módulo de Reservas</span>
                </button>

                {alertaNuevaReservaModal.reserva.telefono && (
                  <a
                    href={`https://wa.me/${alertaNuevaReservaModal.reserva.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `¡Hola ${alertaNuevaReservaModal.reserva.cliente}! Te saludamos de *${config.nombre}* 🍽️. Confirmamos la recepción de tu reserva para el ${alertaNuevaReservaModal.reserva.fechaReserva} a las ${alertaNuevaReservaModal.reserva.horaReserva} en ${alertaNuevaReservaModal.reserva.mesaAsignada}. ¡Te esperamos con mucho gusto!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow active:scale-98 transition-all"
                  >
                    <i className="fa-brands fa-whatsapp text-sm"></i>
                    <span>Contactar Cliente por WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    storage.clearAlertaNuevaReserva();
                    setAlertaNuevaReservaModal(null);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Entendido / Cerrar Aviso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP PARA AGREGAR / ELEGIR PLATOS DEL CATÁLOGO DIGITAL */}
      {isCatalogPickerOpen && (
        <DishCatalogPickerModal
          initialItems={
            pickerTargetReserva
              ? (pickerTargetReserva.itemsPedidos || [])
              : (resAdminForm.itemsPedidos || [])
          }
          onConfirm={(items, total) => {
            if (pickerTargetReserva) {
              const platosNombres = items.map((it) => `${it.cantidad}x ${it.nombre}`);
              const adelanto = pickerTargetReserva.montoAdelanto || 0;
              const saldo = Math.max(0, total - adelanto);
              const updated: Reserva = {
                ...pickerTargetReserva,
                itemsPedidos: items,
                totalEstimado: total,
                saldoRestante: saldo,
                platosPreseleccionados: platosNombres,
              };
              storage.saveReserva(updated);
              setPickerTargetReserva(null);
              setIsCatalogPickerOpen(false);
              alert(`✔ Pedido del catálogo actualizado para ${pickerTargetReserva.cliente} (Total: S/ ${total.toFixed(2)}).`);
            } else {
              const platosNombres = items.map((it) => `${it.cantidad}x ${it.nombre}`);
              const adelantoSugerido = total > 0 ? Number((total * 0.5).toFixed(2)) : resAdminForm.montoAdelanto;
              setResAdminForm((prev) => ({
                ...prev,
                itemsPedidos: items,
                totalEstimado: total,
                platosPreseleccionados: platosNombres,
                montoAdelanto: prev.pagoConfirmado ? adelantoSugerido : prev.montoAdelanto,
              }));
              setIsCatalogPickerOpen(false);
            }
          }}
          onClose={() => {
            setIsCatalogPickerOpen(false);
            setPickerTargetReserva(null);
          }}
        />
      )}
    </div>
  );
};
