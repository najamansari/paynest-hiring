import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Item } from '../items/item.entity';
import { User } from '../users/user.entity';

@Entity()
export class Bid {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @ManyToOne(() => Item, (item) => item.bids)
  item: Item;

  @ManyToOne(() => User, (user) => user.bids)
  user: User;
}
