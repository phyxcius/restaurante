export type Language = 'es' | 'en' | 'fr' | 'pt';

export type UserRole = 'admin' | 'cajero' | 'mozo' | 'cocina';

export type OrderStatus = 'iniciado' | 'cocina' | 'servido' | 'finalizado' | 'anulado';

export type DishCategory = 'entradas' | 'mains' | 'guarniciones' | 'bebidas' | 'postres';

export interface DishTranslation {
  name: string;
  desc: string;
}

export interface Producto {
  id: string;
  category: DishCategory | string;
  precioPEN: number;
  precioUSD?: number;
  precio?: number;
  videoUrl: string;
  posterUrl: string;
  disponible: boolean;
  i18n: {
    es: DishTranslation;
    en: DishTranslation;
    fr: DishTranslation;
    pt: DishTranslation;
  };
  tiempoPrep?: number; // minutos
  stock?: number;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
  notas?: string;
}

export interface OrderItem {
  id?: string;
  nombre: string;
  cantidad: number;
  precio: number;
  notas?: string;
}

export interface Comanda {
  id: string;
  numero?: string;
  mesa: string;
  cliente: string;
  dni?: string;
  productos: string;
  items: OrderItem[];
  totalPEN: number;
  totalUSD?: number;
  total?: number;
  estado: OrderStatus;
  pago: string;
  tipoComprobante: 'Boleta' | 'Factura' | 'Nota de Venta';
  fecha: string;
  hora: string;
  timestamp: number;
  mozo?: string;
  notas?: string;
  pideCuenta?: boolean;
  llamaMozo?: boolean;
  agradecimientoFinal?: boolean;
  serie?: string;
  despachadoCocina?: boolean;
  horaDespachoCocina?: string;
}

export interface Venta {
  id: string;
  numero: string;
  serie: string;
  fecha: string;
  mesa: string;
  cliente: string;
  productos: string;
  items: OrderItem[];
  baseImponible: number;
  igv: number;
  totalPEN: number;
  pago: string;
  tipoComprobante: string;
  rucCliente?: string;
  razonSocialCliente?: string;
  cajero: string;
  enlacePdf?: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  costo: number;
  stockMin: number;
  stockActual?: number;
}

export interface Receta {
  id: string;
  plato: string;
  insumo: string;
  cant: number;
}

export interface MovimientoAlmacen {
  id: string;
  fecha: string;
  tipo: 'ingreso' | 'salida' | 'tin' | 'tout';
  almacen: string;
  insumo: string;
  cant: number;
  costo: number;
  doc?: string;
  motivo?: string;
}

export interface Compra {
  id: string;
  fecha: string;
  proveedor: string;
  comprobante: string;
  almacen: string;
  insumo: string;
  cant: number;
  costo: number;
  total: number;
}

export interface Proveedor {
  id: string;
  ruc: string;
  nombre: string;
  telefono?: string;
  correo?: string;
}

export interface Personal {
  id: string;
  nombre: string;
  dni: string;
  cargo: string;
  sueldo: number;
  telefono?: string;
  ingreso: string;
}

export interface MovimientoCaja {
  id: string;
  fecha: string;
  tipo: 'Ingreso' | 'Salida' | 'Fondo externo' | 'Propina';
  concepto: string;
  medio: string;
  monto: number;
}

export interface CierreCaja {
  id: string;
  fecha: string;
  montoInicial: number;
  ventasEfectivo: number;
  ventasOtros: number;
  ingresos: number;
  salidas: number;
  efectivoEsperado: number;
  total: number;
  comprobantes: number;
  operador?: string;
}

export interface Socio {
  dni: string;
  nombre: string;
  telefono?: string;
  email?: string;
  sellos: number;
  totalVisitas: number;
  fechaRegistro: string;
}

export interface Reserva {
  id: string;
  cliente: string;
  telefono: string;
  fechaReserva: string;
  horaReserva: string;
  personas: number;
  mesaAsignada: string;
  notas: string;
  fechaCreacion: string;
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada';
}

export interface Resena {
  id: string;
  cliente: string;
  mesa: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

export interface ConfigRestaurante {
  nombre: string;
  eslogan: string;
  logo: string;
  whatsapp: string;
  yapePhone: string;
  titular: string;
  ruc: string;
  direccion: string;
  exchangeRateUSD: number;
}

export interface MesaStatus {
  id: string;
  nombre: string;
  estado: 'libre' | 'ocupada' | 'bloqueada';
  token: string;
  comandaActivaId?: string;
  mozo?: string;
  montoActual?: number;
  tiempoTranscurrido?: string;
  seccion?: 'salon' | 'delivery' | 'llevar';
}

// Usqay ERP Submodule Entities
export interface Almacen {
  id: string;
  nombre: string;
  ubicacion?: string;
}

export interface UnidadMedida {
  id: string;
  nombre: string;
  abrev: string;
}

export interface TipoInsumo {
  id: string;
  nombre: string;
}

export interface GuiaIngreso {
  id: string;
  fecha: string;
  almacen: string;
  insumo: string;
  cant: number;
  costo: number;
  doc?: string;
}

export interface GuiaSalida {
  id: string;
  fecha: string;
  almacen: string;
  insumo: string;
  cant: number;
  motivo: 'Consumo cocina' | 'Merma' | 'Obsequio' | 'Ajuste';
}

export interface TransferenciaAlmacen {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  insumo: string;
  cant: number;
}

export interface TipoPlato {
  id: string;
  nombre: string;
}

export interface StockManualPlato {
  id: string;
  plato: string;
  stock: number;
}

export interface TipoMenu {
  id: string;
  nombre: string;
  precio: number;
}

export interface EstructuraMenu {
  id: string;
  menu: string;
  seccion: 'Entrada' | 'Fondo' | 'Postre';
  plato: string;
}

export interface ArmaMenu {
  id: string;
  nombre: string;
  entrada: string;
  fondo: string;
  postre?: string;
  precio: number;
}

export interface PlatoAmarrado {
  id: string;
  plato: string;
  amarrado: string;
  cant: number;
}

export interface ImpresionConfig {
  id: string;
  doc: string;
  formato: string;
  copias: number;
}

export interface CuentaPendiente {
  id: string;
  fecha: string;
  cliente: string;
  mesa?: string;
  total: number;
  estado: 'Pendiente' | 'Pagado';
}

export interface FacturacionPersonalizada {
  id: string;
  fecha: string;
  tipo: 'Factura' | 'Boleta';
  ruc: string;
  razon: string;
  concepto: string;
  total: number;
}

export interface NotaElectronica {
  id: string;
  fecha: string;
  tipo: 'Nota de Crédito' | 'Nota de Débito';
  docRef: string;
  motivo: string;
  total: number;
}

export interface SerieCorrelativo {
  id: string;
  tipo: 'Boleta' | 'Factura' | 'Nota de Crédito' | 'Nota de Débito';
  serie: string;
  correlativo: number;
}

export interface MetodoPago {
  id: string;
  nombre: string;
  comision?: number;
}

