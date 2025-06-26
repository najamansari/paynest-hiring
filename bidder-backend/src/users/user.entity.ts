import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Bid } from '../bids/bid.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @OneToMany(() => Bid, (bid) => bid.user)
  bids: Bid[];
}
