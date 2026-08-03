/**
 * Constantes compartidas de la API Parámetros.
 */

/** Repositorio lógico de persistencia (prefijo en Redis: `Parametros2410:<llave>`). */
export const REPOSITORIO_PARAMETROS = 'Parametros2410';

/** Vigencia por defecto de los valores cacheados: 5 minutos (override con PARAM_VIGENCIA_MS). */
export const VIGENCIA_VALORES_MS_DEFAULT = 5 * 60 * 1000;

/** Cortacircuitos: segundos offline tras un error de red (KB usa 5). Override PARAM_BREAKER_NET_S. */
export const BREAKER_NET_S_DEFAULT = 300;

/** Throttle de definiciones: segundos entre re-descargas (KB usa 180). Override PARAM_DEF_THROTTLE_S. */
export const DEF_THROTTLE_S_DEFAULT = 180;

/** Separador del sufijo en un `ParametroId` compuesto: `base_sufijo`. */
export const SEPARADOR_SUFIJO = '_';

/** TipoDefinicionId: alcance de negocio (el alcance lo provee el llamador). */
export const TIPO_DEFINICION_NEGOCIO = 'Neg';

/** TipoDefinicionId: alcance de dispositivo (el alcance = id del dispositivo). */
export const TIPO_DEFINICION_DISPOSITIVO = 'Disp';

/** Modo que fuerza refresco de la persistencia. */
export const MODO_WEBAPP = 'WebApp';

// --------------------------- Builders de clave Redis ---------------------------

/** Rellena un número a la izquierda con ceros hasta `ancho` (padl(str(n),ancho,"0")). */
export function zeroPad(n: number, ancho = 6): string {
  return String(n).padStart(ancho, '0');
}

/**
 * Clave de contexto: `AplicacionId + zeroPad(EmpKey,6) + AlcanceId`.
 * Es la `llave` bajo el repositorio "Parametros2410" donde vive el array de valores
 * de todos los parámetros de ese contexto.
 */
export function contextId(aplicacionId: string, empKey: number, alcanceId: string): string {
  return `${aplicacionId}${zeroPad(empKey)}${alcanceId}`;
}

/** Llave Redis de la definición de un parámetro. */
export const tagDefinicion = (parametroId: string): string => `Definicion${parametroId}`;

/** Llave Redis de una estructura de parámetro. */
export const tagEstructura = (estructuraId: string): string => `Estructura${estructuraId}`;

/**
 * Llave Redis del flag de notificación de refresco de un scope
 * (misma convención que el KB: `NotificaActualizacion_{App}_{EmpKey}_{Alcance}`).
 * El EmpKey va sin ceros a la izquierda (str + trim), no como el contextId.
 */
export const tagNotificacion = (aplicacionId: string, empKey: number, alcanceId: string): string =>
  `NotificaActualizacion_${aplicacionId}_${empKey}_${alcanceId}`;

/** Llave Redis del marcador "offline" de un servicio (KB: `{servicio}Offline`). */
export const tagOffline = (servicio: string): string => `Offline_${servicio}`;
