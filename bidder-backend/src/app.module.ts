import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { BidsModule } from './bids/bids.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import * as Joi from 'joi';

@Module({
  imports: [
    // ConfigModule should be first
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available globally
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
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
