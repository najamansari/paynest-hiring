import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { BidsModule } from './bids/bids.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'build'),
      exclude: ['/api/{*path}'],
      serveStaticOptions: {
        index: 'index.html',
        fallthrough: false,
        dotfiles: 'ignore',
      },
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    }),

    ScheduleModule.forRoot(),


    AuthModule,
    UsersModule,
    ItemsModule,
    BidsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
