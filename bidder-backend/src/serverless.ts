import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';

const bootstrapServer = async () => {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp)
  );

  app.enableCors();
  await app.init();

  return serverless(expressApp);
};

const handlerPromise = bootstrapServer();

export const handler = async (event: any, context: any) => {
  const handler = await handlerPromise;
  return handler(event, context);
};
