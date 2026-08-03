/**
 * Contexto de resolución de un parámetro, pasado EXPLÍCITAMENTE entre métodos
 * (reemplaza el singleton JVM mutable del KB GeneXus por un valor por-llamada,
 * seguro en concurrencia).
 */
export interface ContextoParametro {
  /** Aplicacion_Idl. Si se omite, se usa PARAM_APLICACION_ID del entorno. */
  aplicacionId: string;
  /** Empresa (EmpKey). */
  empKey: number;
  /**
   * Alcance del parámetro:
   *  - Negocio (`InicializaParametrosNegocio`): id provisto por el llamador.
   *  - Dispositivo (`InicializaParametrosDispositivo`): id del dispositivo.
   */
  alcanceId: string;
  /** AmbienteId. En el cliente original va vacío; se mantiene "" por defecto. */
  ambienteId: string;
  /** Modo ("", "WebApp", "CMD", ...). Participa en el strControl del token. */
  modo: string;
}
