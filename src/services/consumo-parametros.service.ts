import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@andestec/api-dispositivos';
import { firstValueFrom } from 'rxjs';
import type {
  GetParametrosValuesOutput,
  GetParametroDefinicionOutput,
  GetDefinicionEstructurasOutput,
} from '../interfaces';

/**
 * Cliente del backend REST `ObtencionParametros` (YAML).
 *
 * Autenticación: header `ApiKey` con un token de dispositivo M2406 generado por
 * `TokenService.TokenGen(strControl)`. El `strControl` se construye por operación
 * con EXACTAMENTE los mismos valores (trim + orden) que se envían como query
 * params, porque el backend recomputa el token para validarlo.
 *
 *   GetParametrosValues:   EmpKey + ParametroId + AlcanceId + AmbienteId + Aplicacion_Idl + Modo   (todos .trim())
 *   GetParametroDefinicion: Aplicacion_Idl + Modo                                                   (todos .trim())
 *   GetDefinicionEstructuras: sin strControl  →  TokenGen("")  (confirmar en request real)
 */
@Injectable()
export class ConsumoParametrosService {
  private readonly logger = new Logger(ConsumoParametrosService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly token: TokenService,
  ) {}

  /** Base COMPLETA del servicio, sin barra final. */
  private baseUrl(): string {
    return String(this.config.get('PARAM_API_BASEURL') ?? '').replace(/\/+$/, '');
  }

  private timeoutMs(): number {
    const seg = Number(this.config.get('PARAM_API_TIMEOUT') ?? 30);
    return (Number.isFinite(seg) ? seg : 30) * 1000;
  }

  /** Cabeceras comunes + ApiKey (token del dispositivo para el strControl dado). */
  private headers(strControl: string): Record<string, string> {
    const apiKey = this.token.TokenGen(strControl) ?? '';
    if (!apiKey) {
      this.logger.warn('TokenGen devolvió vacío: revisar DISPOSITIVO_ID / DISPOSITIVO_CLAVE');
    }
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ApiKey: apiKey,
    };
  }

  private q(v: string | number): string {
    return encodeURIComponent(String(v));
  }

  /**
   * GET /GetParametrosValues
   * strControl = EmpKey + ParametroId + AlcanceId + AmbienteId + Aplicacion_Idl + Modo (trim).
   */
  async getParametrosValues(args: {
    empKey: number;
    parametroId: string;
    alcanceId: string;
    ambienteId: string;
    aplicacionIdl: string;
    modo: string;
  }): Promise<GetParametrosValuesOutput> {
    const { empKey, parametroId, alcanceId, ambienteId, aplicacionIdl, modo } = args;

    const strControl =
      String(empKey).trim() +
      parametroId.trim() +
      alcanceId.trim() +
      ambienteId.trim() +
      aplicacionIdl.trim() +
      modo.trim();

    const url =
      `${this.baseUrl()}/GetParametrosValues` +
      `?Empkey=${this.q(empKey)}` +
      `&ParametroId=${this.q(parametroId)}` +
      `&AlcanceId=${this.q(alcanceId)}` +
      `&AmbienteId=${this.q(ambienteId)}` +
      `&Aplicacion_Idl=${this.q(aplicacionIdl)}` +
      `&Modo=${this.q(modo)}`;

    const { data } = await firstValueFrom(
      this.http.get<GetParametrosValuesOutput>(url, {
        timeout: this.timeoutMs(),
        headers: this.headers(strControl),
      }),
    );
    return data;
  }

  /**
   * GET /GetParametroDefinicion
   * strControl = Aplicacion_Idl + Modo (trim).
   */
  async getParametroDefinicion(args: {
    aplicacionIdl: string;
    modo: string;
  }): Promise<GetParametroDefinicionOutput> {
    const { aplicacionIdl, modo } = args;
    const strControl = aplicacionIdl.trim() + modo.trim();

    const url =
      `${this.baseUrl()}/GetParametroDefinicion` +
      `?Aplicacion_Idl=${this.q(aplicacionIdl)}` +
      `&Modo=${this.q(modo)}`;

    const { data } = await firstValueFrom(
      this.http.get<GetParametroDefinicionOutput>(url, {
        timeout: this.timeoutMs(),
        headers: this.headers(strControl),
      }),
    );
    return data;
  }

  /**
   * GET /GetDefinicionEstructuras (sin parámetros).
   * Sin strControl → token con control vacío. Ajustar si el backend exige otro.
   */
  async getDefinicionEstructuras(): Promise<GetDefinicionEstructurasOutput> {
    const url = `${this.baseUrl()}/GetDefinicionEstructuras`;

    const { data } = await firstValueFrom(
      this.http.get<GetDefinicionEstructurasOutput>(url, {
        timeout: this.timeoutMs(),
        headers: this.headers(''),
      }),
    );
    return data;
  }
}
