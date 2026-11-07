import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

/**
 * The root module: the top of the dependency tree.
 * Nest starts here and builds every module listed in `imports`.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // inject ConfigService anywhere without re-importing
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false }, // report ALL bad vars at once
    }),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
