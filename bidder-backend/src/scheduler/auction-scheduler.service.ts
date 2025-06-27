import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../items/item.entity';
import { BidsService } from '../bids/bids.service';

@Injectable()
export class AuctionScheduler {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private bidsService: BidsService,
  ) {}

  @Cron('*/30 * * * * *') // Check every 10 seconds
  async handleAuctionLifecycle() {
    console.log('Checking auctions that have ended');
    const now = new Date();

    // Close expired auctions
    const expiredItems = await this.itemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.bids', 'bid')
      .where('item.expireAt <= :now', { now })
      .andWhere('item.finalizedAt IS NULL')
      .orderBy('bid.amount', 'DESC')
      .getMany();

    for (const item of expiredItems) {
      if (!item.bids) continue;
      console.log(`Auction ended for item ${item.id} - ${item.name}`);
      await this.bidsService.finalizeAuction(item.id);
      item.finalizedAt = new Date();
      await this.itemsRepository.save(item);
    }
  }
}
