import * as Joi from 'joi';

/**
 * The shape of our environment variables AFTER validation.
 * Joi converts strings like "5432" into numbers, so these types are real.
 */
export interface Env {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;

  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;

  REDIS_HOST: string;
  REDIS_PORT: number;

  KAFKA_BROKERS: string;
}

/**
 * Validated once at startup. If anything is missing or wrong, the app
 * refuses to start and lists every problem ("fail fast"), instead of
 * crashing later with a confusing error deep inside some module.
 */
export const envValidationSchema = Joi.object<Env, true>({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5433),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),

  KAFKA_BROKERS: Joi.string().default('localhost:19092'),
});
