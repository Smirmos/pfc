import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional().default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional().default(''),
  GOOGLE_CALLBACK_URL: Joi.string().allow('').optional().default(''),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
});

export const appConfig = registerAs('app', () => {
  const env = {
    DATABASE_URL: process.env['DATABASE_URL'],
    JWT_PRIVATE_KEY: process.env['JWT_PRIVATE_KEY'],
    JWT_PUBLIC_KEY: process.env['JWT_PUBLIC_KEY'],
    GOOGLE_CLIENT_ID: process.env['GOOGLE_CLIENT_ID'] ?? '',
    GOOGLE_CLIENT_SECRET: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    GOOGLE_CALLBACK_URL: process.env['GOOGLE_CALLBACK_URL'] ?? '',
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  };

  const { error } = envValidationSchema.validate(env, { abortEarly: false });
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return env;
});
