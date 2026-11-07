import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Every business route lives under /api/v1/...  (versioning lets us change
  // the API later without breaking old clients). Health stays at /health/...
  app.setGlobalPrefix('api/v1', { exclude: ['health/live', 'health/ready'] });

  // On Ctrl+C / container stop, let modules close DB and Kafka connections cleanly.
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  Logger.log(`PulseOps API running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Health: http://localhost:${port}/health/ready`, 'Bootstrap');
}

void bootstrap();
