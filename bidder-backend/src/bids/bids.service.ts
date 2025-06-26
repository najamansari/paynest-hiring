import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid } from './bid.entity';
import { BidGateway } from './bid.gateway';
import { Item } from '../items/item.entity';
import { User } from '../users/user.entity';

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,

    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private bidGateway: BidGateway,
  ) {}

  async placeBid(itemId: number, userId: number, amount: number): Promise<Bid> {
    // Validate user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Validate item exists
    const item = await this.itemsRepository.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');

    const now = new Date();

    // Check auction activation
    if (now < item.activateAt) {
      throw new BadRequestException('Auction has not started yet');
    }

    // Check auction expiration
    if (now > item.expireAt) {
      throw new BadRequestException('Auction has ended');
    }

    // Validate bid amount
    if (amount <= item.currentPrice) {
      throw new BadRequestException(
        `Bid must be higher than current price ($${item.currentPrice})`,
      );
    }

    // Update item's current price
    item.currentPrice = amount;
    await this.itemsRepository.save(item);

    // Create new bid
    const bid = this.bidsRepository.create({
      amount,
      item: { id: itemId },
      user: { id: userId },
    });

    const savedBid = await this.bidsRepository.save(bid);

    try {
      this.bidGateway.broadcastNewBid(itemId, amount);
      console.log('📢 Broadcast succeeded');
    } catch (err) {
      console.error('📢 Broadcast failed:', err);
    }

    console.log(`New bid by user ${userId} on item ${itemId}: $${amount}`);

    return savedBid;
  }

  async getHighestBid(itemId: number): Promise<number> {
    const item = await this.itemsRepository.findOne({ where: { id: itemId } });
    return item?.currentPrice || 0;
  }

  async finalizeAuction(itemId: number): Promise<void> {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['bids', 'bids.user'],
    });

    if (!item) return;

    if (item.bids.length === 0) return;
    // Find winning bid
    const winningBid = item.bids.reduce((prev, current) =>
      prev.amount > current.amount ? prev : current,
    );

    if (winningBid) {
      // Add your finalization logic here
      console.log(
        `Auction ${itemId} won by user ${winningBid.user.id} with bid ${winningBid.amount}`,
      );

      try {
        this.bidGateway.broadcastWinningBid(
          itemId,
          winningBid.user.id,
          winningBid.amount,
        );
        console.log('📢 Broadcast succeeded');
      } catch (err) {
        console.error('📢 Broadcast failed:', err);
      }
    }
  }
}
