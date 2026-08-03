/**
 * Ítem de valor de un parámetro.
 * Espejo de `ParmApp.Api.ParametrosValuesApp.ParametroValueArray_ParametroValueItem`
 * (YAML ObtencionParametros → GetParametrosValues).
 *
 * `ValorParametroIni` / `ValorParametroFin` llegan como string date-time (ISO).
 * Definen la ventana de vigencia `[Ini, Fin)` del valor.
 */
export interface ParametroValueItem {
  ParametroId: string;
  /** Inicio de vigencia (ISO date-time). Vacío/omitido = sin límite inferior. */
  ValorParametroIni?: string;
  /** Fin de vigencia (ISO date-time). Vacío/omitido = sin límite superior. */
  ValorParametroFin?: string;
  /** Valor efectivo del parámetro (puede ser compuesto, ver `Separador` de la definición). */
  ValorParametroValor?: string;
  /** Política de memorización/persistencia. */
  Persistencia?: string;
  ValorJerarquia?: string;
  ParametroJerarquia?: string;
  ValorInstanciado?: boolean;
}
