import type { Mensaje } from './mensaje.interface';
import type { ParametroValueItem } from './parametro-value-item.interface';
import type { ParametroDefinicion } from './parametro-definicion.interface';
import type { ParametroEstructura } from './parametro-estructura.interface';

/**
 * Formas de respuesta del backend REST `ObtencionParametros` (según los YAML).
 * Todas comparten `Messages` + `Ok`.
 */

/** GET /GetParametrosValues */
export interface GetParametrosValuesOutput {
  ParametrosValuesApp?: {
    ParametroValueArray?: ParametroValueItem[];
  };
  Messages?: Mensaje[];
  Ok?: boolean;
}

/** GET /GetParametroDefinicion */
export interface GetParametroDefinicionOutput {
  ParametrosDefinitionApp?: {
    ParametrosVersion?: string;
    ParametrosItemDefinitionApp?: ParametroDefinicion[];
  };
  Messages?: Mensaje[];
  Ok?: boolean;
}

/** GET /GetDefinicionEstructuras */
export interface GetDefinicionEstructurasOutput {
  SDTParametroEstructura?: ParametroEstructura[];
  Messages?: Mensaje[];
  Ok?: boolean;
}
