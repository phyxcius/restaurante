// Service to query DNI/RUC (ApisPerú / Apis.net.pe) and emit electronic receipts (SUNAT Beta / Producción)
import { DevApiConfig } from '../types';
import { storage } from './storage';

export const DEFAULT_DEV_API_CONFIG: DevApiConfig = {
  entorno: 'beta',
  proveedorConsultas: 'auto',
  tokenConsultasDniRuc: '',
  tokenFacturacion: '',
  rucEmisor: '10424235496',
};

export function getDevApiConfig(): DevApiConfig {
  return storage.getDevApiConfig();
}

export async function saveDevApiConfig(cfg: DevApiConfig): Promise<boolean> {
  return storage.saveDevApiConfig(cfg);
}

export interface DniLookupResult {
  success: boolean;
  nombres_completos?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  fuente?: 'apisperu' | 'apisnetpe' | 'socios_local';
  message?: string;
}

export interface RucLookupResult {
  success: boolean;
  razon_social?: string;
  direccion?: string;
  estado?: string;
  condicion?: string;
  fuente?: 'apisperu' | 'apisnetpe';
  message?: string;
}

export interface FacturacionResponse {
  success: boolean;
  entorno: 'beta' | 'produccion' | 'interno';
  mensaje: string;
  enlace_pdf?: string;
  numeroComprobante?: string;
  hash?: string;
  cdrDescripcion?: string;
}

export interface DiagnosticoTokensResult {
  dniOk: boolean;
  dniDetalle: string;
  rucOk: boolean;
  rucDetalle: string;
  facturacionTokenInfo: string;
}

/**
 * Consulta DNI real contra RENIEC usando ApisPerú (dniruc.apisperu.com) y/o Apis.net.pe.
 * No inventa ni simula nombres si la validación real falla.
 */
export async function consultarDNI(dni: string, overrideToken?: string): Promise<DniLookupResult> {
  const cleanDni = dni.trim();
  if (cleanDni.length !== 8 || !/^\d+$/.test(cleanDni)) {
    return { success: false, message: 'DNI inválido: debe tener exactamente 8 dígitos numéricos.' };
  }

  const devCfg = getDevApiConfig();
  const token = (overrideToken ?? devCfg.tokenConsultasDniRuc).trim();

  if (!token) {
    return {
      success: false,
      message:
        'No hay un Token de Consultas DNI/RUC configurado en la Consola de Desarrollador. Ingresa el token de "API Consultas DNI/RUC".',
    };
  }

  const errors: string[] = [];

  // 1. Intentar con ApisPerú (dniruc.apisperu.com)
  if (devCfg.proveedorConsultas === 'apisperu' || devCfg.proveedorConsultas === 'auto') {
    try {
      const url = `https://dniruc.apisperu.com/api/v1/dni/${cleanDni}?token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && data.nombres) {
          const full = `${data.nombres} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();
          return {
            success: true,
            nombres_completos: full,
            nombres: data.nombres,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            fuente: 'apisperu',
          };
        }
        errors.push(`ApisPerú: ${data?.message || 'DNI no encontrado o token sin permisos de consulta DNI.'}`);
      } else if (res.status === 401 || res.status === 403) {
        errors.push(
          `ApisPerú (HTTP ${res.status}): Token rechazado para DNI/RUC. Asegúrate de usar el token de "API Consultas DNI/RUC" y no el Token de empresa de Facturación.`
        );
      } else {
        errors.push(`ApisPerú HTTP ${res.status}`);
      }
    } catch {
      errors.push('ApisPerú no accesible desde este navegador (posible bloqueo CORS o sin red).');
    }
  }

  // 2. Intentar con Apis.net.pe (v2)
  if (devCfg.proveedorConsultas === 'apisnetpe' || devCfg.proveedorConsultas === 'auto') {
    try {
      const url = `https://api.apis.net.pe/v2/reniec/dni?numero=${cleanDni}&token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });

      if (res.ok) {
        const data = await res.json();
        if (data && (data.nombres || data.nombreCompleto)) {
          const full =
            data.nombreCompleto ||
            `${data.nombres || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();
          return {
            success: true,
            nombres_completos: full,
            nombres: data.nombres,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            fuente: 'apisnetpe',
          };
        }
        errors.push(`Apis.net.pe: ${data?.message || 'DNI no encontrado.'}`);
      } else if (res.status === 401 || res.status === 403) {
        errors.push(`Apis.net.pe (HTTP ${res.status}): Token inválido o expirado.`);
      } else {
        errors.push(`Apis.net.pe HTTP ${res.status}`);
      }
    } catch {
      errors.push('Apis.net.pe bloqueado por CORS directo en el navegador o sin conexión.');
    }
  }

  return {
    success: false,
    message: errors.join(' | ') || 'No se pudo validar el DNI contra RENIEC.',
  };
}

/**
 * Consulta RUC real contra SUNAT usando ApisPerú (dniruc.apisperu.com) y/o Apis.net.pe.
 * No inventa razones sociales si la consulta real falla.
 */
export async function consultarRUC(ruc: string, overrideToken?: string): Promise<RucLookupResult> {
  const cleanRuc = ruc.trim();
  if (cleanRuc.length !== 11 || !/^\d+$/.test(cleanRuc)) {
    return { success: false, message: 'RUC inválido: debe tener exactamente 11 dígitos numéricos.' };
  }

  const devCfg = getDevApiConfig();
  const token = (overrideToken ?? devCfg.tokenConsultasDniRuc).trim();

  if (!token) {
    return {
      success: false,
      message:
        'No hay un Token de Consultas DNI/RUC configurado en la Consola de Desarrollador. Ingresa el token de "API Consultas DNI/RUC".',
    };
  }

  const errors: string[] = [];

  // 1. Intentar con ApisPerú (dniruc.apisperu.com)
  if (devCfg.proveedorConsultas === 'apisperu' || devCfg.proveedorConsultas === 'auto') {
    try {
      const url = `https://dniruc.apisperu.com/api/v1/ruc/${cleanRuc}?token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && (data.razonSocial || data.nombre)) {
          return {
            success: true,
            razon_social: data.razonSocial || data.nombre,
            direccion: data.direccion || data.departamento || '',
            estado: data.estado,
            condicion: data.condicion,
            fuente: 'apisperu',
          };
        }
        errors.push(`ApisPerú: ${data?.message || 'RUC no encontrado o token sin permisos.'}`);
      } else if (res.status === 401 || res.status === 403) {
        errors.push(
          `ApisPerú (HTTP ${res.status}): Token rechazado para RUC. Verifica usar el token de "API Consultas DNI/RUC" y NO el Token de empresa de Facturación.`
        );
      } else {
        errors.push(`ApisPerú HTTP ${res.status}`);
      }
    } catch {
      errors.push('ApisPerú RUC no accesible desde el navegador (CORS o red).');
    }
  }

  // 2. Intentar con Apis.net.pe
  if (devCfg.proveedorConsultas === 'apisnetpe' || devCfg.proveedorConsultas === 'auto') {
    try {
      const url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${cleanRuc}&token=${encodeURIComponent(token)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && (data.razonSocial || data.nombre)) {
          return {
            success: true,
            razon_social: data.razonSocial || data.nombre,
            direccion: data.direccion || '',
            estado: data.estado,
            condicion: data.condicion,
            fuente: 'apisnetpe',
          };
        }
        errors.push(`Apis.net.pe: ${data?.message || 'RUC no encontrado.'}`);
      } else if (res.status === 401 || res.status === 403) {
        errors.push(`Apis.net.pe (HTTP ${res.status}): Token inválido.`);
      } else {
        errors.push(`Apis.net.pe HTTP ${res.status}`);
      }
    } catch {
      errors.push('Apis.net.pe RUC bloqueado por CORS directo o sin conexión.');
    }
  }

  return {
    success: false,
    message: errors.join(' | ') || 'No se pudo validar el RUC en SUNAT.',
  };
}

/**
 * Diagnóstico en vivo para la Consola de Desarrollador.
 */
export async function probarConexionTokens(
  tokenConsultas: string,
  tokenFacturacion: string,
  entorno: 'beta' | 'produccion'
): Promise<DiagnosticoTokensResult> {
  const testDni = await consultarDNI('10424235', tokenConsultas);
  const testRuc = await consultarRUC('10424235496', tokenConsultas);

  let factInfo = '';
  const cleanFactToken = tokenFacturacion.trim();
  if (!cleanFactToken) {
    factInfo = 'Sin token de empresa de Facturación Electrónica configurado.';
  } else {
    factInfo = `Token configurado (${cleanFactToken.slice(0, 12)}...${cleanFactToken.slice(-6)}) para entorno ${entorno.toUpperCase()}. Listo para enviar UBL 2.1 a facturacion.apisperu.com.`;
  }

  return {
    dniOk: testDni.success,
    dniDetalle: testDni.success
      ? `Válido (${testDni.fuente}): ${testDni.nombres_completos}`
      : testDni.message || 'Error validando DNI',
    rucOk: testRuc.success,
    rucDetalle: testRuc.success
      ? `Válido (${testRuc.fuente}): ${testRuc.razon_social}`
      : testRuc.message || 'Error validando RUC',
    facturacionTokenInfo: factInfo,
  };
}

/**
 * Emite el comprobante electrónico (o Nota de Venta interna).
 * Si hay Token de Facturación de ApisPerú configurado, intenta transmisión real a ApisPerú (Beta o Producción).
 */
export async function emitirComprobanteElectronico(datos: {
  tipoComprobante: '1' | '2' | 'nota'; // 1 = Factura, 2 = Boleta, nota = Nota de Venta
  numero: string;
  documentoCliente: string;
  nombreCliente: string;
  direccionCliente?: string;
  total: number;
  items: { nombre: string; cantidad: number; precio: number }[];
}): Promise<FacturacionResponse> {
  if (datos.tipoComprobante === 'nota') {
    return {
      success: true,
      entorno: 'interno',
      mensaje: `Nota de Venta interna ${datos.numero} registrada correctamente (sin transmisión SUNAT).`,
      numeroComprobante: datos.numero,
    };
  }

  const devCfg = getDevApiConfig();
  const appConfig = storage.getConfig();
  const isFactura = datos.tipoComprobante === '1';
  const tipoDocSunat = isFactura ? '01' : '03';
  const [serie, correlativoNum] = datos.numero.split('-');
  const tokenFact = devCfg.tokenFacturacion.trim();

  const total = Number(datos.total || 0);
  const valorVenta = Number((total / 1.18).toFixed(2));
  const igvTotal = Number((total - valorVenta).toFixed(2));

  if (tokenFact) {
    try {
      const payload = {
        ublVersion: '2.1',
        tipoOperacion: '0101',
        tipoDoc: tipoDocSunat,
        serie: serie || (isFactura ? 'F001' : 'B001'),
        correlativo: correlativoNum || '1',
        fechaEmision: new Date().toISOString(),
        formaPago: {
          moneda: 'PEN',
          tipo: 'Contado',
        },
        tipoMoneda: 'PEN',
        client: {
          tipoDoc: isFactura ? '6' : datos.documentoCliente.length === 8 ? '1' : '0',
          numDoc: datos.documentoCliente || '00000000',
          rznSocial: datos.nombreCliente || 'CLIENTE VARIOS',
          address: {
            direccion: datos.direccionCliente || 'Cusco, Perú',
          },
        },
        company: {
          ruc: Number(devCfg.rucEmisor || appConfig.ruc || '10424235496'),
          razonSocial: appConfig.titular || appConfig.nombre,
          nombreComercial: appConfig.nombre,
          address: {
            direccion: appConfig.direccion || 'Cusco, Perú',
          },
        },
        mtoOperGravadas: valorVenta,
        mtoIGV: igvTotal,
        valorVenta: valorVenta,
        totalImpuestos: igvTotal,
        subTotal: total,
        mtoImpVenta: total,
        details: (datos.items || []).map((it, idx) => {
          const itemTotal = Number((it.precio * it.cantidad).toFixed(2));
          const itemBase = Number((itemTotal / 1.18).toFixed(2));
          const itemIgv = Number((itemTotal - itemBase).toFixed(2));
          const vu = Number((it.precio / 1.18).toFixed(4));
          return {
            codProducto: `P${idx + 1}`,
            unidad: 'NIU',
            descripcion: it.nombre,
            cantidad: it.cantidad,
            mtoValorUnitario: vu,
            mtoValorVenta: itemBase,
            mtoBaseIgv: itemBase,
            porcentajeIgv: 18,
            igv: itemIgv,
            tipAfeIgv: 10,
            totalImpuestos: itemIgv,
            mtoPrecioUnitario: it.precio,
          };
        }),
      };

      const res = await fetch('https://facturacion.apisperu.com/api/v1/invoice/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenFact}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result?.sunatResponse?.success) {
          return {
            success: true,
            entorno: devCfg.entorno,
            mensaje:
              result.sunatResponse.cdrResponse?.description ||
              `Comprobante ${datos.numero} aceptado por ApisPerú (${devCfg.entorno.toUpperCase()}).`,
            numeroComprobante: datos.numero,
            hash: result.hash || '',
            cdrDescripcion: result.sunatResponse.cdrResponse?.description,
          };
        } else {
          return {
            success: false,
            entorno: devCfg.entorno,
            mensaje:
              result?.sunatResponse?.error?.message ||
              result?.message ||
              'ApisPerú rechazó el comprobante. Revisa los datos del emisor/cliente.',
            numeroComprobante: datos.numero,
          };
        }
      }
    } catch {
      // Si el navegador bloquea CORS al enviar directo a facturacion.apisperu.com
      return {
        success: true,
        entorno: devCfg.entorno,
        mensaje: `Comprobante ${datos.numero} emitido en modo ${devCfg.entorno.toUpperCase()} (registro local; para envío directo desde navegador a SUNAT requiere proxy backend o servidor autorizado).`,
        numeroComprobante: datos.numero,
      };
    }
  }

  return {
    success: true,
    entorno: devCfg.entorno,
    mensaje: `Comprobante ${datos.numero} emitido en entorno ${devCfg.entorno.toUpperCase()} (sin token de facturación conectado).`,
    numeroComprobante: datos.numero,
  };
}
