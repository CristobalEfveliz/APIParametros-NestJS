/**
 * Definición de un parámetro a nivel aplicación.
 * Espejo de `ParmApp.Api.ParametrosItemDefinitionApp_Parametro`
 * (YAML ObtencionParametros → GetParametroDefinicion).
 *
 * Campos clave para `GetParametro`:
 *  - `TipoDefinicionId`: resuelve el alcance ("Neg" = negocio, "Disp" = dispositivo).
 *  - `ParametroMaxAlcance`: nivel de la clave de contexto ("1" global, "2" empresa, "3" empresa+alcance).
 *  - `Separador` / `TipoParametroSeparadorInicioFin`: partición de valores compuestos.
 */
export interface ParametroValorPosible {
  Descripcion?: string;
  Valor?: string;
}

export interface ParametroDependencia {
  ParametroID?: string;
  ParametroIDValor?: number;
  ParametroDescripcion?: string;
}

export interface ParametroDefinicion {
  ParametroId: string;
  ParametroDescripcion?: string;
  Persistencia?: string;
  ClasificacionID?: string;
  ClasificacionGrupoID?: string;
  /** "1" global · "2" por empresa · "3" por empresa+alcance. */
  ParametroMaxAlcance?: string;
  ParametroMinAlcance?: string;
  TipoParametroID?: string;
  ParametroDocumentacion?: string;
  ValorJerarquia?: string;
  TipoRegExp?: string;
  TipoDominio?: string;
  TipoListaRecupera?: string;
  /** Separador para valores compuestos. */
  Separador?: string;
  /** Si el separador se concatena también al inicio y al final. */
  TipoParametroSeparadorInicioFin?: boolean;
  /** "Neg" (negocio) · "Disp" (dispositivo). */
  TipoDefinicionId?: string;
  ValoresPosibles?: ParametroValorPosible[];
  Dependencia?: ParametroDependencia[];
}
