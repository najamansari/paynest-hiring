import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  app.enableCors();

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
