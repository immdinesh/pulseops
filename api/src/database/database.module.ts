import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Env } from '../config/env.validation';

/**
 * Opens the PostgreSQL connection pool for the whole app.
 *
 * forRootAsync (not forRoot) because the settings come from ConfigService,
 * which is only available after ConfigModule has loaded and validated .env.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: config.get('DB_HOST', { infer: true }),
        port: config.get('DB_PORT', { infer: true }),
        username: config.get('DB_USER', { infer: true }),
        password: config.get('DB_PASSWORD', { infer: true }),
        database: config.get('DB_NAME', { infer: true }),

        // Entities registered via TypeOrmModule.forFeature([...]) in each
        // feature module are picked up automatically.
        autoLoadEntities: true,

        // NEVER true: it silently alters tables to match entities and can drop data.
        // We'll use migrations when we add our first table (Step 3).
        synchronize: false,

        // If Postgres isn't up yet, retry a few times before giving up.
        retryAttempts: 5,
        retryDelay: 2000,
      }),
    }),
  ],
})
export class DatabaseModule {}
