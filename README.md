# La Cusqueñita | Menú Digital & TPV ERP Enterprise

Aplicación web integral para gastronomía y restaurantes, reescrita en **React 19**, **TypeScript** y **Tailwind CSS**, conservando la totalidad de la lógica de negocio, arquitectura visual de lujo y módulos operativos de la solución original.

## Módulos y Funcionalidades

### 1. Menú Digital & Reels (Experiencia Comensal)
- **Modo Video Reels**: Visualización vertical tipo TikTok / Instagram con videos de preparación de platos, sonido activable y navegación fluida.
- **Modo Cuadrícula / Catálogo**: Exploración por categorías (Entradas, Platos de Fondo, Guarniciones, Bebidas & Tragos, Postres).
- **Multilingüe**: Traducción en tiempo real de nombres y descripciones a Español (ES), Inglés (EN), Francés (FR) y Portugués (PT).
- **Comanda Digital**: Selección de mesa, notas de preparación, cálculo en Soles (PEN) y Dólares (USD).
- **Calculadora de Pagos**: Efectivo con cálculo de vuelto automático, Yape, Plin y Tarjeta POS.
- **Acciones Rápidas**: Enviar comanda a cocina, pedir la cuenta y llamar al mozo.

### 2. Pantalla KDS Cocina en Vivo (Chef & Cocineros)
- **Monitoreo en Tiempo Real**: Recepción de comandas con alerta auditiva de campana.
- **Semáforo de Tiempos**: Medidor de minutos transcurridos con alertas por demora (<10m A tiempo, 10-20m Atención, >20m Alerta urgente).
- **Flujo Operativo**: Pasaje de estado: *Iniciado* ➔ *En Cocina* ➔ *Listo para Servir* ➔ *Despachado / Archivar*.
- **Filtros Avanzados**: Por estado y por número de mesa.

### 3. Panel de Control TPV & ERP (Administración & Cobranzas)
- **Autenticación con Roles**: Administrador, Cajero, Mozo y Cocinero con apertura de caja chica y turnos.
- **Mapa de Mesas en Salón**: Mesas libres vs ocupadas con generación de códigos QR de mesa con tokens dinámicos.
- **TPV & Facturación SUNAT**: Emisión de Boletas de Venta y Facturas Electrónicas, consulta automática de DNI (RENIEC) y RUC (SUNAT), cálculo de Base Imponible e IGV (18%).
- **Almacén & Kardex**: Control de insumos, costo unitario, stock mínimo y alertas de reposición.
- **Estructura de Recetas**: Costeo teórico por plato y cálculo de margen de ganancia.
- **Gestión de Personal**: Nómina de colaboradores, sueldos base y cargos.
- **Caja & Cierre Diario**: Arqueo de caja, ventas por medio de pago y registro de cierre.
- **Reportes Contables**: Historial de comprobantes emitidos con exportación e impresión.

### 4. Club de Socios & Fidelidad
- Tarjeta de 10 sellos con recompensas intermedias (postre/trago gratis al 5to sello) y plato de fondo gratis al 10mo sello.
- Generador de tarjeta con código QR personal para cada socio.

### 5. Agenda de Reservas
- Solicitud de reservas online con confirmación directa por WhatsApp.

### 6. Comprobante Térmico (Ticket 80mm)
- Formato imprimible estándar con código QR de validación SUNAT y desglose fiscal.
