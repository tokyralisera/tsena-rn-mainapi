import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuration CORS dynamique
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', 'http://localhost:4200').split(','),
    methods: configService.get('CORS_METHODS', 'GET,POST,PUT,DELETE,PATCH,OPTIONS').split(','),
    allowedHeaders: configService.get('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization,Accept,X-Requested-With,x-access-token').split(','),
    credentials: configService.get('CORS_CREDENTIALS', 'true') === 'true',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();