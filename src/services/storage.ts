import {
  Producto,
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
  Resena,
  ConfigRestaurante,
  MesaStatus,
} from '../types';

const STORAGE_KEYS = {
  CONFIG: 'cusq_config',
  PRODUCTOS: 'cusq_productos',
  COMANDAS: 'cusq_comandas',
  VENTAS: 'cusq_ventas',
  INSUMOS: 'cusq_insumos',
  RECETAS: 'cusq_recetas',
  MOVS: 'cusq_movs_almacen',
  COMPRAS: 'cusq_compras',
  PERSONAL: 'cusq_personal',
  CAJA_MOVS: 'cusq_caja_movs',
  CIERRES: 'cusq_cierres',
  SOCIOS: 'cusq_socios',
  RESERVAS: 'cusq_reservas',
  RESENAS: 'cusq_resenas',
  MESAS: 'cusq_mesas',
  SERIES: 'cusq_series',
  CAJA_INICIAL: 'cusq_caja_inicial',
  FACTURA_ACTUAL: 'factura_actual',
  USUARIOS: 'cusq_usuarios_sistema',
};

export interface UsuarioSistema {
  id: string;
  usuario: string;
  nombre: string;
  rol: 'admin' | 'cocina' | 'mozo' | 'cajero';
  clave: string;
  activo: boolean;
}

export const DEFAULT_USUARIOS_SISTEMA: UsuarioSistema[] = [
  { id: 'usr-admin', usuario: 'admin', nombre: 'Administrador General', rol: 'admin', clave: 'admin123', activo: true },
  { id: 'usr-cocina', usuario: 'cocina', nombre: 'Chef / Cocina KDS', rol: 'cocina', clave: 'cocina123', activo: true },
  { id: 'usr-mozo', usuario: 'mozo', nombre: 'Mozo / Salón', rol: 'mozo', clave: 'mozo123', activo: true },
];

export const DEFAULT_CONFIG: ConfigRestaurante = {
  nombre: 'La Cusqueñita',
  eslogan: 'Tradición Andina • Cusco Gourmet',
  logo: '🍽️',
  whatsapp: '51969773064',
  yapePhone: '+51 987 654 321',
  titular: 'INKA BISTRO CUSCO E.I.R.L.',
  ruc: '20601234567',
  direccion: 'Calle Pumapaccha 290, San Blas, Cusco',
  exchangeRateUSD: 3.75,
};

export const DEFAULT_PRODUCTOS: Producto[] = [
  {
    id: 'dish-1791769983964',
    category: 'mains',
    precioPEN: 38,
    precioUSD: 10,
    precio: 38,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    disponible: true,
    tiempoPrep: 12,
    i18n: {
      es: {
        name: 'Lomo Saltado Criollo',
        desc: 'Jugosos trozos de lomo fino salteados al wok con cebolla, tomate, papas fritas nativas crocantes y arroz con choclo.',
      },
      en: {
        name: 'Stir-fried Beef Lomo Saltado',
        desc: 'Juicy tenderloin strips sautéed in wok with red onions, tomatoes, crispy native potatoes and corn rice.',
      },
      fr: {
        name: 'Lomo Saltado au Boeuf',
        desc: 'Émincé de filet de boeuf sauté au wok avec oignons, tomates, frites péruviennes et riz blanc.',
      },
      pt: {
        name: 'Lomo Saltado Especial',
        desc: 'Tiras suculentas de filé mignon salteadas na wok com cebola roxa, tomates e batatas fritas artesanais.',
      },
    },
  },
  {
    id: 'dish-1791770040831',
    category: 'mains',
    precioPEN: 35,
    precioUSD: 9.5,
    precio: 35,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    disponible: true,
    tiempoPrep: 10,
    i18n: {
      es: {
        name: 'Ají de Gallina Tradicional',
        desc: 'Pechuga de gallina deshilachada en crema de ají amarillo, pecanas, queso andino, papa amarilla y aceituna botija.',
      },
      en: {
        name: 'Traditional Aji de Gallina',
        desc: 'Shredded chicken in a mild creamy yellow pepper sauce with pecans, Andean cheese, egg and olive.',
      },
      fr: {
        name: 'Poulet à la Crème de Piment Jaune',
        desc: 'Poulet effiloché dans une sauce veloutée au piment doux péruvien, noix de pécan et pommes de terre dorées.',
      },
      pt: {
        name: 'Ají de Galinha Suave',
        desc: 'Frango desfiado em creme aveludado de pimenta amarela suave, queijo andino e batatas douradas.',
      },
    },
  },
  {
    id: 'dish-1791820779638',
    category: 'mains',
    precioPEN: 55,
    precioUSD: 14.5,
    precio: 55,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    disponible: true,
    tiempoPrep: 25,
    i18n: {
      es: {
        name: 'Cuy Chactado al Horno',
        desc: 'Cuy cusqueño adobado con hierbas andinas (huacatay y muña), horneado a la perfección con rocoto relleno y pastel de papa.',
      },
      en: {
        name: 'Roasted Andean Guinea Pig (Cuy)',
        desc: 'Crispy roasted cuy marinated in native herbs with stuffed spicy pepper and potato gratin.',
      },
      fr: {
        name: 'Cochon d’Inde Grillé Andin',
        desc: 'Spécialité cusquénienne rôtie aux herbes indigènes, servie avec gratin de pommes de terre.',
      },
      pt: {
        name: 'Cuy Assado com Ervas Andinas',
        desc: 'Prato emblemático de Cusco assado com ervas nativas, rocoto recheado e pastel de batata.',
      },
    },
  },
  {
    id: 'dish-ceviche-001',
    category: 'entradas',
    precioPEN: 39,
    precioUSD: 10.5,
    precio: 39,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800',
    disponible: true,
    tiempoPrep: 8,
    i18n: {
      es: {
        name: 'Ceviche Clásico con Trucha Andina',
        desc: 'Fresca trucha del Valle Sagrado curada al momento en leche de tigre al ají limo, camote glaseado y choclo gigante de Urubamba.',
      },
      en: {
        name: 'Andean Trout Ceviche',
        desc: 'Fresh trout from the Sacred Valley cured with lime juice and chili, sweet potato and giant Urubamba corn.',
      },
      fr: {
        name: 'Ceviche de Truite Andine',
        desc: 'Truite fraîche de la Vallée Sacrée marinée au citron vert, patate douce glacée et maïs géant.',
      },
      pt: {
        name: 'Ceviche de Truta Andina',
        desc: 'Truta fresca do Vale Sagrado marinada em leite de tigre, batata doce glaceada e milho gigante.',
      },
    },
  },
  {
    id: 'dish-chicharron-002',
    category: 'mains',
    precioPEN: 42,
    precioUSD: 11,
    precio: 42,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    disponible: true,
    tiempoPrep: 15,
    i18n: {
      es: {
        name: 'Chicharrón Cusqueño con Mote',
        desc: 'Costillar de cerdo crujiente dorado en su propia grasa, acompañado de mote tierno, papas doradas y sarsa criolla con hierbabuena.',
      },
      en: {
        name: 'Cusco Style Crispy Pork Ribs',
        desc: 'Golden crispy pork belly cooked to perfection with boiled Andean corn, golden potatoes and onion mint relish.',
      },
      fr: {
        name: 'Chicharrón de Porc Croustillant',
        desc: 'Côtes de porc dorées et croustillantes, maïs géant andin et salade d’oignons frais à la menthe.',
      },
      pt: {
        name: 'Chicharrón de Porco Cusquenho',
        desc: 'Costelinha de porco crocante dourada com milho andino cozido, batatas e vinagrete com hortelã.',
      },
    },
  },
  {
    id: 'dish-rocoto-003',
    category: 'entradas',
    precioPEN: 32,
    precioUSD: 8.5,
    precio: 32,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
    disponible: true,
    tiempoPrep: 10,
    i18n: {
      es: {
        name: 'Rocoto Relleno & Pastel de Papa',
        desc: 'Rocoto desvenado relleno de picadillo de lomo fino, pasas, aceitunas y queso fundido, servido sobre pastel milhojas de papa.',
      },
      en: {
        name: 'Stuffed Spicy Pepper & Potato Gratin',
        desc: 'Baked chili stuffed with minced beef, raisins, olives and melted cheese, served with layered potato bake.',
      },
      fr: {
        name: 'Piment Farsi & Gratin Dauphinois Andin',
        desc: 'Piment doux farci à la viande de boeuf hachée, raisins et fromage fondu, avec millefeuille de pomme de terre.',
      },
      pt: {
        name: 'Rocoto Recheado com Queijo',
        desc: 'Pimenta andina recheada com carne moída selecionada e queijo gratinado sobre lasanha de batatas.',
      },
    },
  },
  {
    id: 'dish-pisco-004',
    category: 'bebidas',
    precioPEN: 25,
    precioUSD: 6.8,
    precio: 25,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
    disponible: true,
    tiempoPrep: 4,
    i18n: {
      es: {
        name: 'Pisco Sour Cusqueño Clásico',
        desc: 'Pisco Quebranta de alta gama, zumo de limón recién exprimido, jarabe de goma, clara de huevo y gotas de amargo de Angostura.',
      },
      en: {
        name: 'Classic Peruvian Pisco Sour',
        desc: 'Premium Quebranta Pisco, freshly squeezed key lime juice, simple syrup, egg white foam and Angostura bitters.',
      },
      fr: {
        name: 'Pisco Sour Traditionnel',
        desc: 'Cocktail national péruvien au Pisco pur, jus de lime fraîchement pressé et blanc d’oeuf onctueux.',
      },
      pt: {
        name: 'Pisco Sour Peruano',
        desc: 'Coquetel nacional à base de Pisco peruano, suco de limão fresco e espuma aromática de Angostura.',
      },
    },
  },
  {
    id: 'dish-chicha-005',
    category: 'bebidas',
    precioPEN: 12,
    precioUSD: 3.2,
    precio: 12,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    disponible: true,
    tiempoPrep: 2,
    i18n: {
      es: {
        name: 'Chicha Morada Artesanal (Jarra 1L)',
        desc: 'Bebida ancestral hervida con maíz morado k’ulli, cáscaras de piña golden, manzana, canela y clavo de olor aromático.',
      },
      en: {
        name: 'Purple Corn Drink (Chicha Morada)',
        desc: 'Traditional drink brewed with purple corn, pineapple rind, green apples, cinnamon and cloves.',
      },
      fr: {
        name: 'Chicha Morada au Maïs Violet',
        desc: 'Boisson rafraîchissante ancestrale aux épices, ananas et maïs violet péruvien.',
      },
      pt: {
        name: 'Chicha Morada Refrescante',
        desc: 'Bebida milenar refrescante cozida com milho roxo andino, abacaxi, maçã e especiarias.',
      },
    },
  },
];

export const DEFAULT_MESAS: MesaStatus[] = [
  { id: 'm-1', nombre: 'Mesa 01', estado: 'ocupada', token: 'TK-M01-CUSQ' },
  { id: 'm-2', nombre: 'Mesa 02', estado: 'ocupada', token: 'TK-M02-CUSQ' },
  { id: 'm-3', nombre: 'Mesa 03', estado: 'ocupada', token: 'TK-M03-CUSQ' },
  { id: 'm-4', nombre: 'Mesa 04', estado: 'ocupada', token: 'TK-M04-CUSQ' },
  { id: 'm-5', nombre: 'Mesa 05', estado: 'ocupada', token: 'TK-M05-CUSQ' },
  { id: 'm-6', nombre: 'Mesa 06', estado: 'libre', token: 'TK-M06-CUSQ' },
  { id: 'm-7', nombre: 'Mesa 07', estado: 'libre', token: 'TK-M07-CUSQ' },
  { id: 'm-8', nombre: 'Mesa 08', estado: 'ocupada', token: 'TK-M08-CUSQ' },
  { id: 'm-9', nombre: 'Mesa 09', estado: 'ocupada', token: 'TK-M09-CUSQ' },
  { id: 'm-10', nombre: 'Mesa 10', estado: 'ocupada', token: 'TK-M10-CUSQ' },
  { id: 'm-11', nombre: 'Mesa 11', estado: 'ocupada', token: 'TK-M11-CUSQ' },
  { id: 'm-12', nombre: 'Mesa 12', estado: 'libre', token: 'TK-M12-CUSQ' },
  { id: 'm-bar', nombre: 'Barra 1', estado: 'libre', token: 'TK-BAR1-CUSQ' },
  { id: 'm-ter1', nombre: 'Terraza 1', estado: 'libre', token: 'TK-TER1-CUSQ' },
  { id: 'm-vip', nombre: 'VIP Salón', estado: 'libre', token: 'TK-VIP-CUSQ' },
  { id: 'm-del1', nombre: 'Delivery 01', estado: 'ocupada', token: 'TK-DEL1-CUSQ' },
  { id: 'm-del2', nombre: 'Delivery 02', estado: 'libre', token: 'TK-DEL2-CUSQ' },
  { id: 'm-rap1', nombre: 'Rappi 01', estado: 'libre', token: 'TK-RAP1-CUSQ' },
  { id: 'm-llev1', nombre: 'Llevar 01', estado: 'ocupada', token: 'TK-LLEV1-CUSQ' },
  { id: 'm-llev2', nombre: 'Llevar 02', estado: 'libre', token: 'TK-LLEV2-CUSQ' },
];

export const DEFAULT_INSUMOS: Insumo[] = [
  { id: 'ins-1', nombre: 'Lomo Fino de Res', tipo: 'Carnes', unidad: 'kg', costo: 42.0, stockMin: 10, stockActual: 24.5 },
  { id: 'ins-2', nombre: 'Pechuga de Pollo / Gallina', tipo: 'Carnes', unidad: 'kg', costo: 18.5, stockMin: 8, stockActual: 15.0 },
  { id: 'ins-3', nombre: 'Cuy Beneficiado', tipo: 'Carnes', unidad: 'und', costo: 28.0, stockMin: 5, stockActual: 12 },
  { id: 'ins-4', nombre: 'Trucha Fresca Evicerada', tipo: 'Pescados', unidad: 'kg', costo: 22.0, stockMin: 6, stockActual: 11.2 },
  { id: 'ins-5', nombre: 'Papa Canchán / Amarilla', tipo: 'Verduras', unidad: 'kg', costo: 3.2, stockMin: 25, stockActual: 45.0 },
  { id: 'ins-6', nombre: 'Ají Amarillo Fresco', tipo: 'Verduras', unidad: 'kg', costo: 6.5, stockMin: 5, stockActual: 8.5 },
  { id: 'ins-7', nombre: 'Cebolla Roja', tipo: 'Verduras', unidad: 'kg', costo: 2.8, stockMin: 10, stockActual: 18.0 },
  { id: 'ins-8', nombre: 'Maíz Morado Canteño', tipo: 'Granos', unidad: 'kg', costo: 7.0, stockMin: 10, stockActual: 20.0 },
  { id: 'ins-9', nombre: 'Pisco Quebranta 42°', tipo: 'Licores', unidad: 'botella 750ml', costo: 38.0, stockMin: 4, stockActual: 14 },
];

export const DEFAULT_RECETAS: Receta[] = [
  { id: 'rc-1', plato: 'Lomo Saltado Criollo', insumo: 'Lomo Fino de Res', cant: 0.25 },
  { id: 'rc-2', plato: 'Lomo Saltado Criollo', insumo: 'Papa Canchán / Amarilla', cant: 0.2 },
  { id: 'rc-3', plato: 'Lomo Saltado Criollo', insumo: 'Cebolla Roja', cant: 0.1 },
  { id: 'rc-4', plato: 'Ají de Gallina Tradicional', insumo: 'Pechuga de Pollo / Gallina', cant: 0.2 },
  { id: 'rc-5', plato: 'Ají de Gallina Tradicional', insumo: 'Ají Amarillo Fresco', cant: 0.08 },
  { id: 'rc-6', plato: 'Cuy Chactado al Horno', insumo: 'Cuy Beneficiado', cant: 1 },
  { id: 'rc-7', plato: 'Ceviche Clásico con Trucha Andina', insumo: 'Trucha Fresca Evicerada', cant: 0.22 },
  { id: 'rc-8', plato: 'Pisco Sour Cusqueño Clásico', insumo: 'Pisco Quebranta 42°', cant: 0.09 },
];

export const DEFAULT_COMANDAS: Comanda[] = [
  {
    id: 'ord-101',
    numero: 'B001-000041',
    mesa: 'Mesa 01',
    cliente: 'Carlos Mendoza',
    dni: '45892147',
    productos: '2x Lomo Saltado Criollo, 1x Chicha Morada',
    items: [
      { nombre: 'Lomo Saltado Criollo', cantidad: 2, precio: 38, notas: 'Término medio' },
      { nombre: 'Chicha Morada Artesanal', cantidad: 1, precio: 3 },
    ],
    totalPEN: 79,
    totalUSD: 21.0,
    total: 79,
    estado: 'cocina',
    pago: 'Efectivo',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:10',
    timestamp: Date.now() - 51 * 60 * 1000,
    mozo: 'YOSUKI',
    notas: 'Mesa principal salón',
  },
  {
    id: 'ord-102',
    numero: 'B001-000042',
    mesa: 'Mesa 02',
    cliente: 'Sophie Dupont',
    dni: '78415263',
    productos: '2x Cuy Chactado al Horno, 1x Pisco Sour',
    items: [
      { nombre: 'Cuy Chactado al Horno', cantidad: 2, precio: 55 },
      { nombre: 'Pisco Sour Cusqueño', cantidad: 1, precio: 25 },
    ],
    totalPEN: 135,
    totalUSD: 36.0,
    total: 135,
    estado: 'cocina',
    pago: 'Tarjeta POS',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:32',
    timestamp: Date.now() - 29 * 60 * 1000 - 22 * 1000,
    mozo: 'YOSUKI',
  },
  {
    id: 'ord-103',
    numero: 'B001-000043',
    mesa: 'Mesa 03',
    cliente: 'Juan Ramos',
    dni: '41235678',
    productos: '2x Trucha Andina a la Plancha, 1x Jarra Chicha 1L',
    items: [
      { nombre: 'Trucha Andina a la Plancha', cantidad: 2, precio: 42 },
      { nombre: 'Chicha Morada 1L', cantidad: 1, precio: 12 },
    ],
    totalPEN: 125,
    totalUSD: 33.3,
    total: 125,
    estado: 'cocina',
    pago: 'Yape',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:34',
    timestamp: Date.now() - 27 * 60 * 1000 - 58 * 1000,
    mozo: 'YOSUKI',
  },
  {
    id: 'ord-104',
    numero: 'B001-000044',
    mesa: 'Mesa 04',
    cliente: 'Alejandro Toledo',
    dni: '09876543',
    productos: '3x Lomo Saltado Criollo, 2x Pisco Sour Clásico, 1x Postre',
    items: [
      { nombre: 'Lomo Saltado Criollo', cantidad: 3, precio: 38 },
      { nombre: 'Pisco Sour Clásico', cantidad: 2, precio: 25 },
    ],
    totalPEN: 177,
    totalUSD: 47.2,
    total: 177,
    estado: 'cocina',
    pago: 'Tarjeta POS',
    tipoComprobante: 'Factura',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:22',
    timestamp: Date.now() - 39 * 60 * 1000 - 43 * 1000,
    mozo: 'YOSUKI',
  },
  {
    id: 'ord-105',
    numero: 'B001-000045',
    mesa: 'Mesa 05',
    cliente: 'Luciana Morales',
    dni: '71234567',
    productos: '2x Ají de Gallina Tradicional, 1x Jarra Chicha',
    items: [
      { nombre: 'Ají de Gallina Tradicional', cantidad: 2, precio: 35 },
      { nombre: 'Chicha Morada Artesanal', cantidad: 1, precio: 15 },
    ],
    totalPEN: 85,
    totalUSD: 22.6,
    total: 85,
    estado: 'iniciado',
    pago: 'Efectivo',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:31',
    timestamp: Date.now() - 30 * 60 * 1000 - 59 * 1000,
    mozo: 'YOSUKI',
  },
  {
    id: 'ord-108',
    numero: 'B001-000048',
    mesa: 'Mesa 08',
    cliente: 'Fernando Ruiz',
    dni: '44556677',
    productos: '2x Lomo Saltado, 1x Ceviche Trucha, 1x Cerveza Cusqueña',
    items: [
      { nombre: 'Lomo Saltado Criollo', cantidad: 2, precio: 38 },
      { nombre: 'Ceviche Clásico con Trucha', cantidad: 1, precio: 39 },
      { nombre: 'Cerveza Cusqueña Trigo', cantidad: 1, precio: 17 },
    ],
    totalPEN: 132,
    totalUSD: 35.2,
    total: 132,
    estado: 'cocina',
    pago: 'Tarjeta POS',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:31',
    timestamp: Date.now() - 30 * 60 * 1000 - 34 * 1000,
    mozo: 'CHARLE',
  },
  {
    id: 'ord-109',
    numero: 'B001-000049',
    mesa: 'Mesa 09',
    cliente: 'Gisella Valcárcel',
    dni: '22334455',
    productos: '2x Cuy Chactado al Horno, 1x Gaseosa Inka Kola',
    items: [
      { nombre: 'Cuy Chactado al Horno', cantidad: 2, precio: 55 },
      { nombre: 'Inka Kola 1.5L', cantidad: 1, precio: 10 },
    ],
    totalPEN: 120,
    totalUSD: 32.0,
    total: 120,
    estado: 'cocina',
    pago: 'Plin',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:35',
    timestamp: Date.now() - 27 * 60 * 1000,
    mozo: 'CHARLE',
  },
  {
    id: 'ord-110',
    numero: 'B001-000050',
    mesa: 'Mesa 10',
    cliente: 'Mario Vargas',
    dni: '11223344',
    productos: '2x Ají de Gallina Tradicional, 1x Chicha 500ml',
    items: [
      { nombre: 'Ají de Gallina Tradicional', cantidad: 2, precio: 35 },
      { nombre: 'Chicha Morada vaso', cantidad: 1, precio: 5 },
    ],
    totalPEN: 75,
    totalUSD: 20.0,
    total: 75,
    estado: 'cocina',
    pago: 'Efectivo',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:36',
    timestamp: Date.now() - 26 * 60 * 1000 - 25 * 1000,
    mozo: 'CHARLE',
  },
  {
    id: 'ord-111',
    numero: 'B001-000051',
    mesa: 'Mesa 11',
    cliente: 'Renzo Costa',
    dni: '33445566',
    productos: '2x Lomo Saltado Criollo, 1x Cerveza Cusqueña',
    items: [
      { nombre: 'Lomo Saltado Criollo', cantidad: 2, precio: 38 },
      { nombre: 'Cerveza Cusqueña', cantidad: 1, precio: 19 },
    ],
    totalPEN: 95,
    totalUSD: 25.3,
    total: 95,
    estado: 'cocina',
    pago: 'Tarjeta POS',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:33',
    timestamp: Date.now() - 28 * 60 * 1000 - 40 * 1000,
    mozo: 'SEBASTIAN',
  },
  {
    id: 'ord-del-1',
    numero: 'B001-000052',
    mesa: 'Delivery 01',
    cliente: 'Karina Calmet',
    dni: '55667788',
    productos: '1x Lomo Saltado, 1x Ají de Gallina',
    items: [
      { nombre: 'Lomo Saltado Criollo', cantidad: 1, precio: 38 },
      { nombre: 'Ají de Gallina Tradicional', cantidad: 1, precio: 35 },
    ],
    totalPEN: 73,
    totalUSD: 19.4,
    total: 73,
    estado: 'cocina',
    pago: 'Yape',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:40',
    timestamp: Date.now() - 15 * 60 * 1000,
    mozo: 'DELIVERY MOTORIZADO',
  },
  {
    id: 'ord-llev-1',
    numero: 'B001-000053',
    mesa: 'Llevar 01',
    cliente: 'Jaime Bayly',
    dni: '66778899',
    productos: '1x Ceviche Trucha Andina, 1x Chicha 1L',
    items: [
      { nombre: 'Ceviche Clásico con Trucha Andina', cantidad: 1, precio: 39 },
      { nombre: 'Chicha Morada Artesanal 1L', cantidad: 1, precio: 12 },
    ],
    totalPEN: 51,
    totalUSD: 13.6,
    total: 51,
    estado: 'iniciado',
    pago: 'Efectivo',
    tipoComprobante: 'Boleta',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '14:45',
    timestamp: Date.now() - 10 * 60 * 1000,
    mozo: 'LLEVAR / CAJA',
  },
];

export const DEFAULT_PERSONAL: Personal[] = [
  { id: 'p-1', nombre: 'Edwin Oblitas (Gerente)', dni: '10424235', cargo: 'Administrador', sueldo: 3500, telefono: '+51 984 123 456', ingreso: '2023-01-15' },
  { id: 'p-2', nombre: 'María Elena Ramos', dni: '45879632', cargo: 'Cajero', sueldo: 1800, telefono: '+51 984 654 321', ingreso: '2023-06-01' },
  { id: 'p-3', nombre: 'Ramiro Quispe (Chef)', dni: '23987415', cargo: 'Cocinero', sueldo: 2600, telefono: '+51 984 789 123', ingreso: '2023-03-10' },
  { id: 'p-4', nombre: 'Juan Manuel Torres', dni: '74125896', cargo: 'Mozo', sueldo: 1500, telefono: '+51 984 321 654', ingreso: '2023-09-01' },
];

export const DEFAULT_SOCIOS: Socio[] = [
  { dni: '45892147', nombre: 'Carlos Mendoza', telefono: '+51 987 111 222', email: 'carlos.m@gmail.com', sellos: 6, totalVisitas: 8, fechaRegistro: '2024-02-10' },
  { dni: '10424235', nombre: 'Edwin Oblitas Ubalde', telefono: '+51 969 773 064', email: 'edwinoblitasubalde@gmail.com', sellos: 9, totalVisitas: 15, fechaRegistro: '2023-11-05' },
  { dni: '78415263', nombre: 'Sophie Dupont', telefono: '+51 984 333 444', email: 'sophie.d@outlook.com', sellos: 3, totalVisitas: 3, fechaRegistro: '2024-05-12' },
];

export const DEFAULT_RESERVAS: Reserva[] = [
  {
    id: 'RES-01',
    cliente: 'Gonzalo Fernández',
    telefono: '+51 984 555 666',
    fechaReserva: new Date().toISOString().slice(0, 10),
    horaReserva: '19:30',
    personas: 4,
    mesaAsignada: 'Mesa 05',
    notas: 'Aniversario de bodas, preparar mesa con velas',
    fechaCreacion: '2024-10-26',
    estado: 'Confirmada',
  },
  {
    id: 'RES-02',
    cliente: 'Patricia Valdivia',
    telefono: '+51 984 777 888',
    fechaReserva: new Date().toISOString().slice(0, 10),
    horaReserva: '20:15',
    personas: 6,
    mesaAsignada: 'VIP Salón',
    notas: 'Cena de negocios ejecutiva',
    fechaCreacion: '2024-10-27',
    estado: 'Pendiente',
  },
];

class StorageService {
  private listeners: (() => void)[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private lastStorageHash: string = '';

  constructor() {
    this.initDefaults();
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    if (typeof window === 'undefined') return;

    // 1. High-speed BroadcastChannel across all tabs & windows (0-5ms latency)
    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('la_cusquenita_realtime_bus');
        this.broadcastChannel.onmessage = (event) => {
          if (event && event.data && event.data.type === 'CUSQ_SYNC') {
            this.dispatchLocalListeners();
          }
        };
      }
    } catch {
      // Fallback if BroadcastChannel unavailable
    }

    // 2. Storage event listener when other windows or tabs write to localStorage
    try {
      window.addEventListener('storage', (e) => {
        if (e.key && (e.key.startsWith('cusq_') || e.key === 'factura_actual')) {
          this.dispatchLocalListeners();
        }
      });
    } catch {}

    // 3. Ultra-fast safeguard heartbeat (every 500ms) ensuring zero-delay auto sync
    try {
      this.lastStorageHash = this.computeStateHash();
      setInterval(() => {
        const currentHash = this.computeStateHash();
        if (currentHash !== this.lastStorageHash) {
          this.lastStorageHash = currentHash;
          this.dispatchLocalListeners();
        }
      }, 500);
    } catch {}
  }

  private computeStateHash(): string {
    try {
      return (
        (localStorage.getItem(STORAGE_KEYS.COMANDAS) || '').length +
        '_' +
        (localStorage.getItem(STORAGE_KEYS.VENTAS) || '').length +
        '_' +
        (localStorage.getItem('cusq_realtime_ping') || '')
      );
    } catch {
      return '';
    }
  }

  private dispatchLocalListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in storage listener:', err);
      }
    });
  }

  private initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTOS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(DEFAULT_PRODUCTOS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMANDAS)) {
      localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(DEFAULT_COMANDAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESAS)) {
      localStorage.setItem(STORAGE_KEYS.MESAS, JSON.stringify(DEFAULT_MESAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSUMOS)) {
      localStorage.setItem(STORAGE_KEYS.INSUMOS, JSON.stringify(DEFAULT_INSUMOS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECETAS)) {
      localStorage.setItem(STORAGE_KEYS.RECETAS, JSON.stringify(DEFAULT_RECETAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERSONAL)) {
      localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(DEFAULT_PERSONAL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SOCIOS)) {
      localStorage.setItem(STORAGE_KEYS.SOCIOS, JSON.stringify(DEFAULT_SOCIOS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESERVAS)) {
      localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(DEFAULT_RESERVAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERIES)) {
      localStorage.setItem(
        STORAGE_KEYS.SERIES,
        JSON.stringify({
          boleta: { serie: 'B001', correlativo: 43 },
          factura: { serie: 'F001', correlativo: 18 },
          nota_credito: { serie: 'FC01', correlativo: 3 },
          nota_debito: { serie: 'FD01', correlativo: 1 },
        })
      );
    }
    if (!localStorage.getItem(STORAGE_KEYS.CAJA_INICIAL)) {
      localStorage.setItem(
        STORAGE_KEYS.CAJA_INICIAL,
        JSON.stringify({
          monto: 100.0,
          turno: 'Mañana (07:00 - 15:00)',
          operador: 'Administrador',
          fecha: new Date().toISOString().slice(0, 10),
        })
      );
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notify(action?: string, payload?: any) {
    // 1. Notify listeners in current window
    this.dispatchLocalListeners();

    // 2. Broadcast immediately to all other tabs and windows
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'CUSQ_SYNC',
          action: action || 'DATA_CHANGED',
          payload: payload || null,
          timestamp: Date.now(),
        });
      }
    } catch {}

    // 3. Write realtime ping to localStorage to wake up storage listeners across windows
    try {
      localStorage.setItem('cusq_realtime_ping', String(Date.now()));
    } catch {}
  }

  // --- CONFIG ---
  public getConfig(): ConfigRestaurante {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
  }

  public saveConfig(config: ConfigRestaurante) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    this.notify();
  }

  // --- PRODUCTOS ---
  public getProductos(): Producto[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTOS);
    if (!raw) return DEFAULT_PRODUCTOS;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PRODUCTOS;
      return parsed.map((p: any, idx: number): Producto => {
        const nombreDefault = p?.i18n?.es?.name || p?.nombre || p?.name || `Plato ${idx + 1}`;
        const descDefault = p?.i18n?.es?.desc || p?.descripcion || p?.desc || '';
        const precioVal = Number(p?.precioPEN ?? p?.precio ?? 35) || 35;
        return {
          id: String(p?.id || `dish-${Date.now()}-${idx}`),
          category: String(p?.category || 'mains'),
          precioPEN: precioVal,
          precioUSD: Number(p?.precioUSD || +(precioVal / 3.75).toFixed(2)),
          precio: precioVal,
          videoUrl: String(p?.videoUrl || DEFAULT_PRODUCTOS[0].videoUrl),
          posterUrl: String(p?.posterUrl || DEFAULT_PRODUCTOS[0].posterUrl),
          disponible: p?.disponible !== false,
          i18n: {
            es: { name: nombreDefault, desc: descDefault },
            en: { name: p?.i18n?.en?.name || nombreDefault, desc: p?.i18n?.en?.desc || descDefault },
            fr: { name: p?.i18n?.fr?.name || nombreDefault, desc: p?.i18n?.fr?.desc || descDefault },
            pt: { name: p?.i18n?.pt?.name || nombreDefault, desc: p?.i18n?.pt?.desc || descDefault },
          },
        };
      });
    } catch {
      return DEFAULT_PRODUCTOS;
    }
  }

  public saveProducto(producto: Producto) {
    const list = this.getProductos();
    const idx = list.findIndex((p) => p.id === producto.id);
    if (idx >= 0) {
      list[idx] = producto;
    } else {
      list.push(producto);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(list));
    this.notify();
  }

  public deleteProducto(id: string) {
    const list = this.getProductos().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(list));
    this.notify();
  }

  // --- COMANDAS ---
  public getComandas(): Comanda[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COMANDAS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveComanda(comanda: Comanda) {
    const list = this.getComandas();
    const idx = list.findIndex((c) => c.id === comanda.id);
    if (idx >= 0) {
      list[idx] = comanda;
    } else {
      list.unshift(comanda);
    }
    localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(list));

    // Update mesa status to ocupada
    if (comanda.mesa) {
      this.setMesaEstado(comanda.mesa, 'ocupada', comanda.id);
    }
    this.notify();
  }

  public updateComandaEstado(id: string, estado: Comanda['estado']) {
    const list = this.getComandas();
    const comanda = list.find((c) => c.id === id);
    if (comanda) {
      comanda.estado = estado;
      if (estado === 'finalizado' || estado === 'anulado') {
        this.setMesaEstado(comanda.mesa, 'libre');
      }
      localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(list));
      this.notify();
    }
  }

  public despacharCocina(id: string) {
    const list = this.getComandas();
    const comanda = list.find((c) => c.id === id);
    if (comanda) {
      comanda.despachadoCocina = true;
      comanda.estado = 'servido';
      comanda.horaDespachoCocina = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(list));
      this.notify('COCINA_DESPACHADO', { comandaId: id, mesa: comanda.mesa });
    }
  }

  public requestBill(id: string, metodoPago?: string) {
    const list = this.getComandas();
    const comanda = list.find((c) => c.id === id);
    if (comanda) {
      comanda.pideCuenta = true;
      if (metodoPago) comanda.pago = metodoPago;
      localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(list));

      const payload = {
        comandaId: comanda.id,
        numero: comanda.numero || comanda.id,
        mesa: comanda.mesa,
        cliente: comanda.cliente,
        totalPEN: comanda.totalPEN || comanda.total || 0,
        metodo: comanda.pago || 'Efectivo',
        timestamp: Date.now(),
      };
      localStorage.setItem('cusq_solicitud_pago_activa', JSON.stringify(payload));
      this.notify('PAGO_SOLICITADO', payload);
    }
  }

  public getSolicitudPagoActiva(): any | null {
    try {
      const raw = localStorage.getItem('cusq_solicitud_pago_activa');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public clearSolicitudPago() {
    try {
      localStorage.removeItem('cusq_solicitud_pago_activa');
    } catch {}
    this.notify('PAGO_ATENDIDO');
  }

  public callWaiter(id: string) {
    const list = this.getComandas();
    const comanda = list.find((c) => c.id === id);
    if (comanda) {
      comanda.llamaMozo = true;
      localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(list));
      this.notify('MOZO_LLAMADO', { comandaId: id, mesa: comanda.mesa });
    }
  }

  // --- VENTAS & CORRELATIVOS ---
  public getNextCorrelativo(tipo: 'Boleta' | 'Factura' | 'Nota de Crédito' | 'Nota de Débito'): string {
    const raw = localStorage.getItem(STORAGE_KEYS.SERIES);
    const series = raw ? JSON.parse(raw) : {};
    const key = tipo.toLowerCase().replace(/[^a-z]/g, '') || 'boleta';
    const s = series[key] || {
      serie: tipo === 'Factura' ? 'F001' : tipo.includes('Crédito') ? 'FC01' : tipo.includes('Débito') ? 'FD01' : 'B001',
      correlativo: 1,
    };
    s.correlativo = (Number(s.correlativo) || 0) + 1;
    series[key] = s;
    localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(series));
    return `${s.serie}-${String(s.correlativo).padStart(8, '0')}`;
  }

  public getVentas(): Venta[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VENTAS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveVenta(venta: Venta) {
    const list = this.getVentas();
    list.unshift(venta);
    localStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify(list));
    localStorage.setItem(STORAGE_KEYS.FACTURA_ACTUAL, JSON.stringify(venta));

    // Also close the comanda if matching id
    this.updateComandaEstado(venta.id, 'finalizado');
    this.notify();
  }

  public getUltimaFactura(): Venta | null {
    const raw = localStorage.getItem(STORAGE_KEYS.FACTURA_ACTUAL);
    return raw ? JSON.parse(raw) : null;
  }

  // --- MESAS ---
  public getMesas(): MesaStatus[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MESAS);
    return raw ? JSON.parse(raw) : DEFAULT_MESAS;
  }

  public setMesaEstado(nombreMesa: string, estado: 'libre' | 'ocupada' | 'bloqueada', comandaId?: string) {
    const mesas = this.getMesas();
    const m = mesas.find((item) => item.nombre.toLowerCase().trim() === nombreMesa.toLowerCase().trim());
    if (m) {
      m.estado = estado;
      if (comandaId) m.comandaActivaId = comandaId;
      if (estado === 'libre') m.comandaActivaId = undefined;
      localStorage.setItem(STORAGE_KEYS.MESAS, JSON.stringify(mesas));
      this.notify();
    }
  }

  public regenerateMesaToken(nombreMesa: string): string {
    const mesas = this.getMesas();
    const m = mesas.find((item) => item.nombre.toLowerCase().trim() === nombreMesa.toLowerCase().trim());
    const newToken = `TK-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    if (m) {
      m.token = newToken;
      localStorage.setItem(STORAGE_KEYS.MESAS, JSON.stringify(mesas));
      this.notify();
    }
    return newToken;
  }

  // --- INSUMOS & RECETAS & ALMACEN ---
  public getInsumos(): Insumo[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INSUMOS);
    return raw ? JSON.parse(raw) : DEFAULT_INSUMOS;
  }

  public saveInsumo(insumo: Insumo) {
    const list = this.getInsumos();
    const idx = list.findIndex((i) => i.id === insumo.id);
    if (idx >= 0) list[idx] = insumo;
    else list.push(insumo);
    localStorage.setItem(STORAGE_KEYS.INSUMOS, JSON.stringify(list));
    this.notify();
  }

  public deleteInsumo(id: string) {
    const list = this.getInsumos().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSUMOS, JSON.stringify(list));
    this.notify();
  }

  public getRecetas(): Receta[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECETAS);
    return raw ? JSON.parse(raw) : DEFAULT_RECETAS;
  }

  public saveReceta(receta: Receta) {
    const list = this.getRecetas();
    const idx = list.findIndex((r) => r.id === receta.id);
    if (idx >= 0) list[idx] = receta;
    else list.push(receta);
    localStorage.setItem(STORAGE_KEYS.RECETAS, JSON.stringify(list));
    this.notify();
  }

  public deleteReceta(id: string) {
    const list = this.getRecetas().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECETAS, JSON.stringify(list));
    this.notify();
  }

  public getMovimientosAlmacen(): MovimientoAlmacen[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVS);
    return raw ? JSON.parse(raw) : [];
  }

  public addMovimientoAlmacen(mov: MovimientoAlmacen) {
    const list = this.getMovimientosAlmacen();
    list.unshift(mov);
    localStorage.setItem(STORAGE_KEYS.MOVS, JSON.stringify(list));

    // Update insumo stockActual
    const insumos = this.getInsumos();
    const ins = insumos.find((i) => i.nombre === mov.insumo);
    if (ins) {
      const delta = mov.tipo === 'ingreso' || mov.tipo === 'tin' ? mov.cant : -mov.cant;
      ins.stockActual = Math.max(0, (ins.stockActual || 0) + delta);
      localStorage.setItem(STORAGE_KEYS.INSUMOS, JSON.stringify(insumos));
    }
    this.notify();
  }

  // --- PERSONAL ---
  public getPersonal(): Personal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL);
    return raw ? JSON.parse(raw) : DEFAULT_PERSONAL;
  }

  public savePersonal(persona: Personal) {
    const list = this.getPersonal();
    const idx = list.findIndex((p) => p.id === persona.id);
    if (idx >= 0) list[idx] = persona;
    else list.push(persona);
    localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(list));
    this.notify();
  }

  public deletePersonal(id: string) {
    const list = this.getPersonal().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(list));
    this.notify();
  }

  // --- CAJA & CIERRE ---
  public getCajaMovs(): MovimientoCaja[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CAJA_MOVS);
    return raw ? JSON.parse(raw) : [];
  }

  public addCajaMov(mov: MovimientoCaja) {
    const list = this.getCajaMovs();
    list.unshift(mov);
    localStorage.setItem(STORAGE_KEYS.CAJA_MOVS, JSON.stringify(list));
    this.notify();
  }

  public getCierres(): CierreCaja[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CIERRES);
    return raw ? JSON.parse(raw) : [];
  }

  public saveCierre(cierre: CierreCaja) {
    const list = this.getCierres();
    list.unshift(cierre);
    localStorage.setItem(STORAGE_KEYS.CIERRES, JSON.stringify(list));
    this.notify();
  }

  public getCajaInicial() {
    const raw = localStorage.getItem(STORAGE_KEYS.CAJA_INICIAL);
    return raw ? JSON.parse(raw) : { monto: 100, turno: 'Mañana', operador: 'Admin', fecha: new Date().toISOString().slice(0, 10) };
  }

  public setCajaInicial(data: { monto: number; turno: string; operador: string; fecha: string }) {
    localStorage.setItem(STORAGE_KEYS.CAJA_INICIAL, JSON.stringify(data));
    this.notify();
  }

  // --- SOCIOS & FIDELIDAD ---
  public getSocios(): Socio[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SOCIOS);
    return raw ? JSON.parse(raw) : DEFAULT_SOCIOS;
  }

  public getSocioByDni(dni: string): Socio | undefined {
    return this.getSocios().find((s) => s.dni.trim() === dni.trim());
  }

  public saveSocio(socio: Socio) {
    const list = this.getSocios();
    const idx = list.findIndex((s) => s.dni === socio.dni);
    if (idx >= 0) list[idx] = socio;
    else list.push(socio);
    localStorage.setItem(STORAGE_KEYS.SOCIOS, JSON.stringify(list));
    this.notify();
  }

  public addSelloSocio(dni: string): Socio | null {
    const socio = this.getSocioByDni(dni);
    if (socio) {
      socio.sellos = (socio.sellos || 0) + 1;
      socio.totalVisitas = (socio.totalVisitas || 0) + 1;
      this.saveSocio(socio);
      return socio;
    }
    return null;
  }

  // --- RESERVAS ---
  public getReservas(): Reserva[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RESERVAS);
    return raw ? JSON.parse(raw) : DEFAULT_RESERVAS;
  }

  public saveReserva(reserva: Reserva) {
    const list = this.getReservas();
    const idx = list.findIndex((r) => r.id === reserva.id);
    if (idx >= 0) list[idx] = reserva;
    else list.unshift(reserva);
    localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(list));
    this.notify();
  }

  public deleteReserva(id: string) {
    const list = this.getReservas().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(list));
    this.notify();
  }

  // --- RESEÑAS ---
  public getResenas(): Resena[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RESENAS);
    return raw
      ? JSON.parse(raw)
      : [
          {
            id: 'r-1',
            cliente: 'Carlos Mendoza',
            mesa: 'Mesa 01',
            calificacion: 5,
            comentario: '¡El mejor Lomo Saltado de Cusco! La carne estaba en su punto perfecto y la atención fue muy rápida.',
            fecha: '2024-10-25',
          },
          {
            id: 'r-2',
            cliente: 'Sophie Dupont',
            mesa: 'Mesa 02',
            calificacion: 5,
            comentario: 'Amazing ceviche with Andean trout and the video menu on phone was so futuristic and fun!',
            fecha: '2024-10-26',
          },
        ];
  }

  public addResena(resena: Resena) {
    const list = this.getResenas();
    list.unshift(resena);
    localStorage.setItem(STORAGE_KEYS.RESENAS, JSON.stringify(list));
    this.notify();
  }

  // --- PURGE / RESETS ---
  public purgeComandasHoy() {
    localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify([]));
    // Reset all mesas to libre
    const mesas = this.getMesas().map((m) => ({ ...m, estado: 'libre' as const, comandaActivaId: undefined }));
    localStorage.setItem(STORAGE_KEYS.MESAS, JSON.stringify(mesas));
    this.notify();
  }

  public purgeVentas() {
    localStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify([]));
    this.notify();
  }

  // --- GENERIC ERP CRUD COLLECTIONS ---
  public getGenericList<T>(key: string, defaultData: T[] = []): T[] {
    const raw = localStorage.getItem(`cusq_erp_${key}`);
    if (!raw) {
      localStorage.setItem(`cusq_erp_${key}`, JSON.stringify(defaultData));
      return defaultData;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return defaultData;
    }
  }

  public saveGenericItem<T extends { id: string }>(key: string, item: T) {
    const list = this.getGenericList<T>(key);
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
    localStorage.setItem(`cusq_erp_${key}`, JSON.stringify(list));
    this.notify();
  }

  public deleteGenericItem<T extends { id: string }>(key: string, id: string) {
    const list = this.getGenericList<T>(key).filter((x) => x.id !== id);
    localStorage.setItem(`cusq_erp_${key}`, JSON.stringify(list));
    this.notify();
  }

  // --- USUARIOS Y ROLES DEL SISTEMA (ADMIN, COCINA, MOZO) ---
  public getUsuariosSistema(): UsuarioSistema[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USUARIOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(DEFAULT_USUARIOS_SISTEMA));
      return DEFAULT_USUARIOS_SISTEMA;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USUARIOS_SISTEMA;
    } catch {
      return DEFAULT_USUARIOS_SISTEMA;
    }
  }

  public saveUsuarioSistema(u: UsuarioSistema) {
    const list = this.getUsuariosSistema();
    const idx = list.findIndex((x) => x.id === u.id || x.usuario.toLowerCase() === u.usuario.toLowerCase());
    if (idx >= 0) list[idx] = u;
    else list.push(u);
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(list));
    this.notify();
  }

  public validarClave(rol: 'admin' | 'cocina' | 'mozo' | 'cajero', claveIngresada: string): boolean {
    if (!claveIngresada) return false;
    const pin = claveIngresada.trim();
    // Claves maestras de emergencia
    if (pin === '42423549' || pin === 'regocijo123') return true;

    const users = this.getUsuariosSistema();
    const user = users.find((u) => u.rol === rol && u.activo);
    if (user && user.clave === pin) return true;

    // Si el rol es cocina o mozo, la clave de administrador también desbloquea
    if (rol !== 'admin') {
      const adminUser = users.find((u) => u.rol === 'admin' && u.activo);
      if (adminUser && adminUser.clave === pin) return true;
    }

    // Claves por defecto para acceso inmediato
    if (rol === 'admin' && (pin === 'admin123' || pin === 'admin')) return true;
    if (rol === 'cocina' && (pin === 'cocina123' || pin === 'cocina')) return true;
    if (rol === 'mozo' && (pin === 'mozo123' || pin === 'mozo')) return true;

    return false;
  }
}

export const storage = new StorageService();

