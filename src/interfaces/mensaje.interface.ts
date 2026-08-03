/**
 * Mensaje devuelto por el backend (GeneXus.Common.Messages_Message en los YAML).
 */
export interface Mensaje {
  Id?: string;
  /** Tipo GeneXus (0 = error, 1 = warning, etc.). */
  Type?: number;
  Description?: string;
}
