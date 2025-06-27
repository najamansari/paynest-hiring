import { Context } from '@netlify/functions';
import { Handler } from '@netlify/functions';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express'; // Default import
import serverless from 'serverless-http'; // Default import

let cachedServer: Handler;

async function bootstrapServer(): Promise<Handler> {
  if (!cachedServer) {
    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp)
    );
    
    nestApp.enableCors();
    await nestApp.init();
    cachedServer = serverless(expressApp) as any;
  }
  return cachedServer;
}

export const handler = async (event: any, context: any) => {
  const server = await bootstrapServer();
  return server(event, context as any);
};

module.exports = { handler };
