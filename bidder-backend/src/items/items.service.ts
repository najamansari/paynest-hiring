import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { BidsService } from '../bids/bids.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private bidsService: BidsService,
  ) {}

  async createItem(createItemDto: CreateItemDto): Promise<Item> {
    if (!createItemDto) {
      throw new Error('Item data is required');
    }
    const now = new Date();
    const activateAt = createItemDto.activateAt || now;
    const expireAt = new Date(
      activateAt.getTime() + createItemDto.duration * 1000,
    );

    const item = this.itemsRepository.create({
      ...createItemDto,
      currentPrice: createItemDto.startingPrice,
      activateAt,
      expireAt,
      finalizedAt: null,
    });

    return this.itemsRepository.save(item);
  }

  async getActiveAuctions(): Promise<Item[]> {
    const now = new Date();
    return this.itemsRepository
      .createQueryBuilder('item')
      .where('item.activateAt <= :now', { now })
      .andWhere('item.expireAt > :now', { now })
      .andWhere('item.finalizedAt IS NULL')
      .orderBy('item.expireAt', 'ASC')
      .getMany();
  }
}
