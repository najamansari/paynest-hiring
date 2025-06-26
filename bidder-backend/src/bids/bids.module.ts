import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidsController } from './bids.controller';
import { BidGateway } from './bid.gateway';
import { BidsService } from './bids.service';
import { Bid } from './bid.entity';
import { AuthModule } from '../auth/auth.module';
import { ItemsModule } from '../items/items.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { Item } from '../items/item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, Item, User]),
    forwardRef(() => AuthModule),
    forwardRef(() => ItemsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [BidsController],
  providers: [BidsService, BidGateway],
  exports: [BidsService],
})
export class BidsModule {}
