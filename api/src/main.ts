import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Every business route lives under /api/v1/...  (versioning lets us change
  // the API later without breaking old clients). Health stays at /health/...
  app.setGlobalPrefix('api/v1', { exclude: ['health/live', 'health/ready'] });

  // Default JSON body limit is 100 KB, too small for a batch of 500 logs.
  // Anything above 1 MB is rejected with 413 Payload Too Large.
  app.useBodyParser('json', { limit: '1mb' });

  // Validate EVERY request body against its DTO class before the handler runs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip fields that have no decorator in the DTO…
      forbidNonWhitelisted: true, // …or rather, reject the request if any are sent
      transform: true, // turn the plain JSON into real DTO class instances
    }),
  );

  // On Ctrl+C / container stop, let modules close DB and Kafka connections cleanly.
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  Logger.log(`PulseOps API running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Health: http://localhost:${port}/health/ready`, 'Bootstrap');
}

void bootstrap();
