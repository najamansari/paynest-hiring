import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from './item.entity';
import { AuthModule } from '../auth/auth.module';
import { BidsModule } from '../bids/bids.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item]),
    AuthModule,
    forwardRef(() => BidsModule), // Use forwardRef here
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService, TypeOrmModule],
})
export class ItemsModule {}
