import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  //? Configuration CORS dynamique
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', 'http://localhost:4200').split(','),
    methods: configService.get('CORS_METHODS', 'GET,POST,PUT,DELETE,PATCH,OPTIONS').split(','),
    allowedHeaders: configService.get('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization,Accept,X-Requested-With,x-access-token').split(','),
    credentials: configService.get('CORS_CREDENTIALS', 'true') === 'true',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));

   //? Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('RoadMarket API')
    .setDescription('API de la plateforme RoadMarket - Gestion des publications d\'offres, demandes, logistique et informations')
    .setVersion('1.0')
    .addTag('Auth', 'Endpoints d\'authentification et gestion utilisateurs')
    .addTag('Upload', 'Endpoints pour l\'upload d\'images sur Cloudinary')
    .addTag('Publications - Offres', 'Gestion des publications d\'offres')
    .addTag('Publications - Demandes', 'Gestion des publications de demandes')
    .addTag('Categories', 'Gestion des catégories de produits')
    .addTag('Pays', 'Gestion des pays')
    .addTag('Villes', 'Gestion des villes')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'JWT-auth', 
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();