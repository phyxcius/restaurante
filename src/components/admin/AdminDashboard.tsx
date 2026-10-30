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
} from '../../types';
import { storage, UsuarioSistema } from '../../services/storage';
import { consultarDNI, consultarRUC, emitirComprobanteElectronico } from '../../services/sunatApi';
import { ErpSubmodules } from './ErpSubmodules';
import { ClubSocios } from '../club/ClubSocios';
import { FacturaTicket } from '../factura/FacturaTicket';

interface AdminDashboardProps {
  config: ConfigRestaurante;
  onNavigateToFactura?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ config, onNavigateToFactura }) => {
  // Session authentication (no password gate requested)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [operatorName, setOperatorName] = useState<string>('Administrador');
  const [password, setPassword] = useState<string>('');
  const [shift, setShift] = useState<string>('Turno Mañana (07:00 - 15:00)');
  const [cajaChica, setCajaChica] = useState<number>(100.0);

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
  const [vaultTokenOpen, setVaultTokenOpen] = useState<boolean>(false);
  const [vaultResetComandasOpen, setVaultResetComandasOpen] = useState<boolean>(false);
  const [vaultResetReportesOpen, setVaultResetReportesOpen] = useState<boolean>(false);
  const [ghToken, setGhToken] = useState<string>(() => localStorage.getItem('inkabistro_vault_secret_token') || '');

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
  const [cobroTipo, setCobroTipo] = useState<'Boleta' | 'Factura'>('Boleta');
  const [cobroMetodo, setCobroMetodo] = useState<string>('Efectivo');
  const [cobroRuc, setCobroRuc] = useState<string>('');
  const [cobroRazon, setCobroRazon] = useState<string>('');

  // QR Mesas
  const [qrMesaSeleccionada, setQrMesaSeleccionada] = useState<string>('Mesa 01');
  const [qrTelefono, setQrTelefono] = useState<string>('+51969773064');
  const [qrImgDataUrl, setQrImgDataUrl] = useState<string>('');

  // Socios
  const [inputBuscarDni, setInputBuscarDni] = useState<string>('');
  const [socioConsultado, setSocioConsultado] = useState<Socio | null>(null);

  // Reservas Form
  const [resAdminForm, setResAdminForm] = useState<{
    titular: string;
    telefono: string;
    fecha: string;
    hora: string;
    personas: number;
    mesa: string;
    notas: string;
  }>({
    titular: '',
    telefono: '',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '19:30',
    personas: 4,
    mesa: 'Mesa 01',
    notas: '',
  });

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

  const handleAceptarYCobrarSolicitud = (solicitud: { comandaId: string; mesa: string; metodo?: string }) => {
    storage.clearSolicitudPago();
    setSolicitudPagoModal(null);

    const coms = storage.getComandas();
    let target = coms.find((c) => c.id === solicitud.comandaId);
    if (!target) {
      target = coms.find((c) => c.mesa.toLowerCase() === solicitud.mesa.toLowerCase() && c.estado !== 'finalizado');
    }

    if (target) {
      setComandaCobrando(target);
      setCobroRuc(target.dni || '');
      setCobroRazon(target.cliente || '');
      if (solicitud.metodo) setCobroMetodo(solicitud.metodo);
      setCurrentSection('comandas');
    } else {
      alert(`No se encontró comanda pendiente para ${solicitud.mesa}.`);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setComandas(storage.getComandas());
      setVentas(storage.getVentas());
      setMesas(storage.getMesas());
      setSocios(storage.getSocios());
      setReservas(storage.getReservas());
      setProductos(storage.getProductos());
      setPersonal(storage.getPersonal());
      setResenas(storage.getResenas());
      setIdentidadForm(storage.getConfig());
      setUsuariosSistema(storage.getUsuariosSistema());

      // Check for incoming bill request
      const activeReq = storage.getSolicitudPagoActiva();
      if (activeReq) {
        setSolicitudPagoModal(activeReq);
        reproducirCampana();
      } else {
        const coms = storage.getComandas();
        const reqFromComanda = coms.find((c) => c.pideCuenta && c.estado !== 'finalizado');
        if (reqFromComanda) {
          setSolicitudPagoModal({
            comandaId: reqFromComanda.id,
            numero: reqFromComanda.numero || reqFromComanda.id,
            mesa: reqFromComanda.mesa,
            cliente: reqFromComanda.cliente,
            totalPEN: reqFromComanda.totalPEN || reqFromComanda.total || 0,
            metodo: reqFromComanda.pago || 'Efectivo',
            timestamp: Date.now(),
          });
          reproducirCampana();
        }
      }
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

  // Vault verification helper
  const verificarVault = (tipo: 'token' | 'resetComandas' | 'resetReportes') => {
    const inputPass = prompt('🔐 Ingresa la clave maestra del Vault:');
    if (inputPass === PASSWORD_MAESTRA || inputPass === 'regocijo123') {
      if (tipo === 'token') setVaultTokenOpen(!vaultTokenOpen);
      if (tipo === 'resetComandas') setVaultResetComandasOpen(!vaultResetComandasOpen);
      if (tipo === 'resetReportes') setVaultResetReportesOpen(!vaultResetReportesOpen);
    } else if (inputPass !== null) {
      alert('⛔ Contraseña incorrecta.');
    }
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
    setComandaCobrando(cmd);
    setCobroRuc(cmd.dni || '');
    setCobroRazon(cmd.cliente || '');
  };

  const handleConfirmarCobro = async () => {
    if (!comandaCobrando) return;
    try {
      const numero = storage.getNextCorrelativo(cobroTipo);
      const total = comandaCobrando.totalPEN || comandaCobrando.total || 0;
      const base = Number((total / 1.18).toFixed(2));
      const igv = Number((total - base).toFixed(2));

      // Emit electronic invoice
      const resFactura = await emitirComprobanteElectronico({
        tipoComprobante: cobroTipo === 'Factura' ? '1' : '2',
        numero,
        documentoCliente: cobroRuc.trim() || '00000000',
        nombreCliente: cobroRazon.trim() || comandaCobrando.cliente,
        total,
        items: comandaCobrando.items || [],
      });

      const venta: Venta = {
        id: comandaCobrando.id,
        numero,
        serie: numero.split('-')[0],
        fecha: `${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        mesa: comandaCobrando.mesa,
        cliente: cobroRazon.trim() || comandaCobrando.cliente,
        productos: comandaCobrando.productos,
        items: comandaCobrando.items,
        baseImponible: base,
        igv,
        totalPEN: total,
        pago: cobroMetodo,
        tipoComprobante: cobroTipo,
        rucCliente: cobroRuc.trim(),
        razonSocialCliente: cobroRazon.trim(),
        cajero: `${operatorName} (${shift})`,
        enlacePdf: resFactura.enlace_pdf,
      };

      storage.saveVenta(venta);
      storage.regenerateMesaToken(comandaCobrando.mesa);

      // Sincronizar bloqueo y agradecimiento inmediato en Menú Digital
      try {
        const mesaKey = 'cusq_mesa_pagada_' + comandaCobrando.mesa.replace(/\s+/g, '_').toLowerCase();
        localStorage.setItem(mesaKey, JSON.stringify(venta));
      } catch {}

      if (cobroRuc.trim().length >= 8) {
        storage.addSelloSocio(cobroRuc.trim());
      }

      setComandaCobrando(null);
      alert(`✔ Venta cobrada con éxito: ${cobroTipo} N° ${numero}`);
      setCurrentSection('factura');
      if (onNavigateToFactura) onNavigateToFactura();
    } catch {
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



  // Active check if currently in an ERP submodule view
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
            <span style={{ fontSize: '18px' }}>{config.logo || '🍽️'}</span>
            <span className="hidden sm:inline font-black tracking-tight text-white">
              {config.nombre.toUpperCase()}
            </span>
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

          {/* 8. CLUB SOCIOS (DENTRO DEL PANEL ADMIN) */}
          <button
            type="button"
            className={`usqay-menu-trigger ${currentSection === 'socios' ? 'active' : ''}`}
            onClick={() => handleNavClick('socios')}
            title="Club de Socios y Fidelización de Clientes"
          >
            <i className="fa-solid fa-star text-xs text-amber-400"></i>
            <span>CLUB SOCIOS</span>
          </button>

          {/* 9. RESERVAS (DENTRO DEL PANEL ADMIN) */}
          <button
            type="button"
            className={`usqay-menu-trigger ${currentSection === 'reservas' ? 'active' : ''}`}
            onClick={() => handleNavClick('reservas')}
            title="Módulo de Reservas y Bloqueo de Mesas"
          >
            <i className="fa-solid fa-calendar-check text-xs text-sky-400"></i>
            <span>RESERVAS</span>
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

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <b className="text-slate-200">{operatorName}</b>
            <span className="text-slate-400">({userRole.toUpperCase()})</span>
          </div>

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
            className="btn-toggle-global text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            onClick={() => {
              if (window.innerWidth <= 860) setIsMobileMenuOpen(!isMobileMenuOpen);
              else setIsSidebarCollapsed(!isSidebarCollapsed);
            }}
            title="Abrir Panel Lateral (Bóveda & Configuración)"
          >
            <i className="fa-solid fa-bars"></i>
            <span className="hidden sm:inline">Panel</span>
          </button>
        </div>
      </header>

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
              <div className="brand-avatar" id="headerAvatar">
                {config.logo || '🍽️'}
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

          {/* ACORDEONES DEL VAULT */}
          <div className="rol-admin-only" style={{ display: userRole === 'admin' ? 'flex' : 'none', flexDirection: 'column', gap: '2px' }}>
            {/* Vault Token */}
            <div className="vault-box">
              <button className="vault-trigger" type="button" onClick={() => verificarVault('token')}>
                <span><i className="fa-solid fa-key"></i> Token GitHub</span>
                <span id="badgeVaultToken">{vaultTokenOpen ? '🔓 Desbloqueado' : '🔒 Bloqueado'}</span>
              </button>
              {vaultTokenOpen && (
                <div className="vault-content" style={{ display: 'block' }}>
                  <label style={{ marginTop: 0 }}>Personal Token (ghp_...):</label>
                  <input
                    type="password"
                    id="ghTokenInput"
                    placeholder="Pega tu token"
                    value={ghToken}
                    onChange={(e) => setGhToken(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <button
                      className="btn btn-save"
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                      onClick={() => {
                        localStorage.setItem('inkabistro_vault_secret_token', ghToken);
                        alert('✔ Token guardado.');
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      className="btn btn-del"
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                      onClick={() => {
                        setGhToken('');
                        localStorage.removeItem('inkabistro_vault_secret_token');
                        alert('✔ Token eliminado.');
                      }}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Vault Reset Comandas */}
            <div className="vault-box danger-vault">
              <button className="vault-trigger" type="button" onClick={() => verificarVault('resetComandas')}>
                <span><i className="fa-solid fa-broom"></i> Reset Comandas & Mesas</span>
                <span id="badgeVaultResetComandas">{vaultResetComandasOpen ? '🔓 Desbloqueado' : '🔒 Bloqueado'}</span>
              </button>
              {vaultResetComandasOpen && (
                <div className="vault-content" style={{ display: 'block' }}>
                  <p style={{ fontSize: '11px', color: '#fca5a5', lineHeight: 1.3, marginBottom: '8px' }}>
                    Borra todas las órdenes activas y reservas para reiniciar mesas a libre.
                  </p>
                  <button
                    className="btn btn-del"
                    style={{ width: '100%', fontSize: '11.5px', padding: '7px' }}
                    onClick={() => {
                      if (confirm('🚨 ¿Deseas purgar todas las comandas de hoy para reiniciar las mesas a LIBRE?')) {
                        storage.purgeComandasHoy();
                        alert('✔ Comandas purgadas. Tablero KDS y mesas en limpio.');
                      }
                    }}
                  >
                    <i className="fa-solid fa-trash"></i> Purgar Comandas de Hoy
                  </button>
                </div>
              )}
            </div>

            {/* Vault Reset Reportes */}
            <div className="vault-box danger-vault">
              <button className="vault-trigger" type="button" onClick={() => verificarVault('resetReportes')}>
                <span><i className="fa-solid fa-file-invoice-dollar"></i> Reset Historial Ventas</span>
                <span id="badgeVaultResetReportes">{vaultResetReportesOpen ? '🔓 Desbloqueado' : '🔒 Bloqueado'}</span>
              </button>
              {vaultResetReportesOpen && (
                <div className="vault-content" style={{ display: 'block' }}>
                  <p style={{ fontSize: '11px', color: '#fca5a5', lineHeight: 1.3, marginBottom: '8px' }}>
                    Borra el historial contable acumulado de ventas cobradas en SUNAT.
                  </p>
                  <button
                    className="btn btn-del"
                    style={{ width: '100%', fontSize: '11.5px', padding: '7px' }}
                    onClick={() => {
                      if (confirm('🚨 ¿Deseas eliminar definitivamente todo el historial contable de ventas?')) {
                        storage.purgeVentas();
                        alert('✔ Historial contable de ventas reseteado.');
                      }
                    }}
                  >
                    <i className="fa-solid fa-trash-can"></i> Vaciar Ventas Contables
                  </button>
                </div>
              )}
            </div>
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
              <i className="fa-solid fa-star text-amber-400"></i> Club & Socios Frecuentes
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
                        <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i> DISPONIBLE
                        </div>
                        <div className="text-sm font-black text-slate-400 mb-2">S/ 0.00</div>
                        <span className="text-[11px] font-extrabold text-blue-400 bg-blue-950/80 border border-blue-500/40 rounded-full px-3 py-1">
                          + Abrir Mesa
                        </span>
                      </div>
                    );
                  })}
              </div>

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
                              onClick={() => {
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
                                storage.saveComanda(comandaActualizada);
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
                              setComandaCobrando(com);
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
                          onClick={() => {
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

                            storage.saveComanda(nuevaComanda);
                            storage.setMesaEstado(mesaDetalleModal.nombre, 'ocupada');
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

          {/* C. 2. CLUB & SOCIOS FRECUENTES (INTEGRADO EN PANEL ADMIN) */}
          {currentSection === 'socios' && (
            <section id="viewSocios" style={{ display: 'block' }}>
              <div className="view-header">
                <div>
                  <h1>⭐ Club de Recompensas: Socios & Tarjetas Digitales</h1>
                  <p>Módulo de fidelización con sellos virtuales de consumo, premios, consulta por DNI y código QR.</p>
                </div>
              </div>

              {/* Módulo interactivo ClubSocios integrado */}
              <div style={{ marginBottom: '24px' }}>
                <ClubSocios config={config} />
              </div>

              <div className="card" style={{ borderColor: 'var(--chuspa-gold-border)' }}>
                <strong style={{ color: '#fbbf24', fontSize: '14px' }}>
                  <i className="fa-solid fa-id-card"></i> Búsqueda Rápida de Ficha por DNI:
                </strong>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <input
                    type="tel"
                    id="inputBuscarDniSocio"
                    placeholder="Ingresa DNI del cliente..."
                    style={{ fontSize: '15px', fontWeight: 900 }}
                    maxLength={10}
                    value={inputBuscarDni}
                    onChange={(e) => setInputBuscarDni(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-save"
                    onClick={() => {
                      const s = storage.getSocioByDni(inputBuscarDni.trim());
                      if (s) setSocioConsultado(s);
                      else alert('Socio no encontrado.');
                    }}
                  >
                    <i className="fa-solid fa-magnifying-glass"></i> Consultar
                  </button>
                </div>

                {socioConsultado && (
                  <div
                    id="resultadoSocioBox"
                    style={{
                      background: '#09152b',
                      border: '1.5px solid var(--chuspa-gold)',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      marginTop: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 900 }}>
                          {socioConsultado.nombre}
                        </h3>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          DNI: <b style={{ color: '#fbbf24' }}>{socioConsultado.dni}</b>
                        </span>
                      </div>
                      {socioConsultado.sellos >= 10 && (
                        <span
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: '12px',
                          }}
                        >
                          🎁 ¡TIENE PREMIO LISTO!
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        background: '#061021',
                        border: '1px dashed var(--chuspa-gold)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '12px', color: '#cbd5e1', display: 'block' }}>Puntaje Actual:</span>
                        <b style={{ fontSize: '24px', color: '#fbbf24' }}>{socioConsultado.sellos % 10}</b>{' '}
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>de 10 sellos</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Total Visitas:</span>
                        <b style={{ fontSize: '14px', color: '#fff' }}>{socioConsultado.totalVisitas}</b>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-save"
                        style={{ flex: 1 }}
                        onClick={() => {
                          const updated = storage.addSelloSocio(socioConsultado.dni);
                          if (updated) setSocioConsultado({ ...updated });
                          alert('✔ Sello sumado correctamente.');
                        }}
                      >
                        <i className="fa-solid fa-plus"></i> +1 Sello de Consumo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <strong style={{ color: 'var(--gold)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  Historial de Socios Registrados ({socios.length}):
                </strong>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>DNI</th>
                      <th>Nombre del Cliente</th>
                      <th>Sellos Actuales</th>
                      <th>Total Visitas</th>
                      <th>Acción Rápida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socios.map((s) => (
                      <tr key={s.dni}>
                        <td><b style={{ color: '#fbbf24' }}>{s.dni}</b></td>
                        <td>{s.nombre}</td>
                        <td><b>{s.sellos % 10} / 10</b> {s.sellos >= 10 ? '🎁 ¡Premio!' : ''}</td>
                        <td>{s.totalVisitas}</td>
                        <td>
                          <button
                            className="btn btn-save"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => {
                              setInputBuscarDni(s.dni);
                              setSocioConsultado(s);
                            }}
                          >
                            Ver Ficha
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <div className="view-header">
                <div>
                  <h1>📅 Generación & Control de Reservas</h1>
                  <p>Bloqueo dinámico de mesas por turnos y comensales.</p>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--gold)' }}>
                  <i className="fa-solid fa-plus-circle"></i> Registrar Nueva Reserva de Grupo:
                </strong>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n: Reserva = {
                      id: `RES-${Date.now().toString().slice(-6)}`,
                      cliente: resAdminForm.titular.trim(),
                      telefono: resAdminForm.telefono.trim(),
                      fechaReserva: resAdminForm.fecha,
                      horaReserva: resAdminForm.hora,
                      personas: resAdminForm.personas,
                      mesaAsignada: resAdminForm.mesa,
                      notas: resAdminForm.notas.trim() || 'Sin notas especiales',
                      fechaCreacion: new Date().toLocaleDateString('es-PE'),
                      estado: 'Confirmada',
                    };
                    storage.saveReserva(n);
                    alert('✔ Reserva generada y mesa bloqueada.');
                  }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '8px' }}
                >
                  <div>
                    <label>Titular:</label>
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
                      placeholder="984..."
                      value={resAdminForm.telefono}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Fecha:</label>
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
                    <label>Personas:</label>
                    <input
                      type="number"
                      min={1}
                      value={resAdminForm.personas}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, personas: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label>Mesa a Bloquear:</label>
                    <select
                      value={resAdminForm.mesa}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, mesa: e.target.value })}
                    >
                      {mesas.map((m) => (
                        <option key={m.id} value={m.nombre}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Notas del Evento:</label>
                    <input
                      type="text"
                      placeholder="Requerimientos especiales..."
                      value={resAdminForm.notas}
                      onChange={(e) => setResAdminForm({ ...resAdminForm, notas: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-save" style={{ gridColumn: '1 / -1' }}>
                    <i className="fa-solid fa-calendar-plus"></i> Guardar y Bloquear Mesa
                  </button>
                </form>
              </div>

              <div id="contenedorReservasAdminList" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {reservas.map((r) => (
                  <div key={r.id} style={{ background: 'var(--card-bg)', border: '1.5px solid var(--card-border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{r.cliente}</strong>
                      <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '10px', padding: '3px 7px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {r.mesaAsignada}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#fbbf24' }}>
                      📅 {r.fechaReserva} • ⏰ {r.horaReserva} • 👥 {r.personas} Personas
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      📞 {r.telefono} | Notas: {r.notas}
                    </div>
                  </div>
                ))}
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
                    <i className="fa-solid fa-share-nodes"></i> Canales Oficiales & Contacto:
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                    <div>
                      <label>WhatsApp Oficial:</label>
                      <input
                        type="text"
                        value={identidadForm.whatsapp}
                        onChange={(e) => setIdentidadForm({ ...identidadForm, whatsapp: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Teléfono Yape / Plin:</label>
                      <input
                        type="text"
                        value={identidadForm.yapePhone}
                        onChange={(e) => setIdentidadForm({ ...identidadForm, yapePhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-save"
                  style={{ marginTop: '16px', width: '100%' }}
                  onClick={() => {
                    storage.saveConfig(identidadForm);
                    alert('✔ Identidad del restaurante y redes guardadas con éxito.');
                  }}
                >
                  <i className="fa-solid fa-floppy-disk"></i> Guardar Identidad, Logo & Redes
                </button>
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
        </main>
      </div>

      {/* MODAL COBRO FLOTANTE */}
      {comandaCobrando && (
        <div className="modal-overlay" onClick={() => setComandaCobrando(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fbbf24' }}>Cobro de {comandaCobrando.mesa}</h3>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => setComandaCobrando(null)}
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
                <select value={cobroTipo} onChange={(e) => setCobroTipo(e.target.value as any)}>
                  <option value="Boleta">🧾 Boleta de Venta</option>
                  <option value="Factura">🏢 Factura Electrónica</option>
                </select>
              </div>
              <div>
                <label>Método de Pago:</label>
                <select value={cobroMetodo} onChange={(e) => setCobroMetodo(e.target.value)}>
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Yape">🟣 Yape</option>
                  <option value="Plin">🔵 Plin</option>
                  <option value="Tarjeta POS">💳 Tarjeta POS</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#061122', padding: '8px', borderRadius: '8px', border: '1px dashed #334155' }}>
              <label style={{ marginTop: 0 }}>{cobroTipo === 'Factura' ? 'RUC del Cliente:' : 'DNI del Cliente:'}</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder={cobroTipo === 'Factura' ? '20...' : '45...'}
                  value={cobroRuc}
                  onChange={(e) => setCobroRuc(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-save"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                  onClick={async () => {
                    const doc = cobroRuc.trim();
                    if (cobroTipo === 'Factura') {
                      const res = await consultarRUC(doc);
                      if (res.success && res.razon_social) setCobroRazon(res.razon_social);
                    } else {
                      const res = await consultarDNI(doc);
                      if (res.success && res.nombres_completos) setCobroRazon(res.nombres_completos);
                    }
                  }}
                >
                  Consultar
                </button>
              </div>
              <label>Razón Social / Cliente:</label>
              <input
                type="text"
                placeholder="Nombre o Empresa S.A.C."
                value={cobroRazon}
                onChange={(e) => setCobroRazon(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" className="btn btn-del" onClick={() => setComandaCobrando(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-save"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '100%', border: 'none' }}
                onClick={handleConfirmarCobro}
              >
                <i className="fa-solid fa-print"></i> Cobrar e Imprimir Comprobante Fiscal
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
                    storage.clearSolicitudPago();
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
    </div>
  );
};
