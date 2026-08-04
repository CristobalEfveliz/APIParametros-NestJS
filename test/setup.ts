import { Logger } from '@nestjs/common';

// Silencia el logger de Nest durante los tests (la salida de error/debug del
// servicio es esperada en las pruebas de breaker/notificación).
Logger.overrideLogger(false);
