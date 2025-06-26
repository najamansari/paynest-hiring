import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Register User entity
    AuthModule, // For authentication dependencies
  ],
  providers: [UsersService],
  exports: [UsersService], // Export for AuthModule and other modules
})
export class UsersModule {}
