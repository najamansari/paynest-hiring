import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';
import serverless from 'serverless-http';

let cachedHandler: any;

async function bootstrap(module: any) {
  const expressApp = express();
  const app = await NestFactory.create(module);
  app.useGlobalPipes(new ValidationPipe());

  // Seed users
  const usersService = app.get(UsersService);
  await usersService.seedUsers();

  app.useWebSocketAdapter(new IoAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('Paynest Bidding Service')
    .setDescription('Sample Bidding Service for Paynest')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableCors({
    origin: true,
    credentials: true
  });

  if (process.env.NETLIFY) {
    // Don't start server in Netlify environment
    return expressApp;
  }

  await app.listen(process.env.PORT || 3000);

  return expressApp
}
void bootstrap(AppModule);

const proxyApi = async (module: any, event: any, context: any) => {
  if (!cachedHandler) {
    const app = await bootstrap(module);
    cachedHandler = serverless(app);
  }

  return cachedHandler(event, context);
};

export const handler = async (event: any, context: any) =>
  proxyApi(AppModule, event, context);
