import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DispositivoModule } from '@andestec/api-dispositivos';
import { ConsumoParametrosService } from './services/consumo-parametros.service';
import { ParametrosService } from './services/parametros.service';

/**
 * Módulo de la API Parámetros.
 *
 * Expone `ParametrosService` (las primitivas GetParametro / InicializaParametros*)
 * y `ConsumoParametrosService` (cliente REST). Configura:
 *  - `ConfigModule` (global, lee `.env`).
 *  - `HttpModule` (@nestjs/axios) para el backend REST de parámetros.
 *  - `DispositivoModule`, que aporta `TokenService` + `DispositivoService` y, al
 *    registrar internamente el `PersistenciaModule` (@Global), deja disponible
 *    `PersistenciaService` en toda la app. Por eso NO se re-registra Redis aquí:
 *    la configuración de conexión (REDIS_*) la resuelve api-dispositivos.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    DispositivoModule,
  ],
  providers: [ConsumoParametrosService, ParametrosService],
  exports: [ParametrosService, ConsumoParametrosService],
})
export class ParametrosModule {}
