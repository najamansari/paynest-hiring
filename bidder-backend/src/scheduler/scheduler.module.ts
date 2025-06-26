import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../items/item.entity';
import { Bid } from '../bids/bid.entity';
import { AuctionScheduler } from './auction-scheduler.service';
import { BidsModule } from '../bids/bids.module'; // Add this import

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Item, Bid]),
    BidsModule,
  ],
  providers: [AuctionScheduler],
})
export class SchedulerModule {}
