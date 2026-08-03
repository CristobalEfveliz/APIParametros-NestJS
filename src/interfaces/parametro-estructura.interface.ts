/**
 * Estructura (layout de componentes) de un parámetro compuesto.
 * Espejo de `V2.SDTParametroEstructura_SDTParametroEstructuraItem`
 * (YAML ObtencionParametros → GetDefinicionEstructuras).
 *
 * Usada por `obtenerValorxIndice`: el sufijo de un `ParametroId` (base_sufijo)
 * referencia un componente cuyo `Orden` indica la posición dentro del valor
 * partido por el `Separador` de la definición.
 */
export interface ParametroEstructuraComponente {
  ParametroEstructuraComponenteId?: string;
  ParametroEstructuraComponenteRegExp?: string;
  ParametroEstructuraComponenteEtiqueta?: string;
  ParametroEstructuraComponenteObligatorio?: boolean;
  ParametroEstructuraComponenteDefecto?: string;
  /** Posición (1-based en GeneXus) del componente dentro del valor compuesto. */
  ParametroEstructuraComponenteOrden?: number;
}

export interface ParametroEstructura {
  ParametroEstructuraId?: string;
  ParametroEstructuraVersion?: string;
  ParametroEstructuraDescripcion?: string;
  ParametroEstructuraEstado?: string;
  ParametroEstructuraCreacion?: string;
  Componente?: ParametroEstructuraComponente[];
}
