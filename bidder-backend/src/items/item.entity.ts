import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Bid } from '../bids/bid.entity';

@Entity()
export class Item {
  @ApiProperty({ example: 1, description: 'Auto-generated item ID'})
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Antique Vase', description: 'Item name' })
  @Column()
  name: string;

  @ApiProperty({ example: '18th century artifact', description: 'Item description' })
  @Column()
  description: string;

  @ApiProperty({ example: 100.0, description: 'Starting price' })
  @Column('decimal', { precision: 10, scale: 2 })
  startingPrice: number;

  @ApiProperty({ example: 100.0, description: 'Current highest bid' })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentPrice: number;

  @ApiProperty({ example: '2025-01-01 01:01:59', description: 'Time at which the auction will start.' })
  @Column({ type: 'timestamptz' })
  activateAt: Date;

  @ApiProperty({ example: '2025-01-01 01:01:59', description: 'Time at which the auction will end.' })
  @Column({ type: 'timestamptz' })
  expireAt: Date;

  @ApiProperty({ example: '2025-01-01 01:01:59', description: 'Time at which the auction was finalized.' })
  @Column({ type: 'timestamp', nullable: true })
  finalizedAt: Date | null;

  @ApiProperty({ description: 'All current bids placed for this item.' })
  @OneToMany(() => Bid, (bid) => bid.item)
  bids: Bid[];
}
