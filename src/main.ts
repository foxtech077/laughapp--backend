import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  app.use(helmet());
  app.use(json({ limit: '1mb' }));

  // CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
  });

  // Swagger
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Laugh App API')
      .setDescription('Laugh App MVP - Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('users', 'User management')
      .addTag('auth', 'Authentication')
      .addTag('videos', 'Video management')
      .addTag('tips', 'Tipping')
      .addTag('follows', 'Follow management')
      .addTag('feeds', 'Daily feeds')
      .addTag('leaderboard', 'Leaderboard')
      .addTag('notifications', 'Notifications')
      .addTag('coins', 'Coin management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
  if (nodeEnv !== 'production') {
    console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap();
