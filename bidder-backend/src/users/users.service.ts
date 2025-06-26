import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  async seedUsers(): Promise<void> {
    const count = await this.usersRepository.count();
    if (count === 0) {
      const users : any[] = [];
      for (let i = 1; i <= 100; i++) {
        users.push({
          username: `user${i}`,
          password: await bcrypt.hash(`password${i}`, 10),
        });
      }
      await this.usersRepository.save(users);
      console.log('Seeded 100 users');
    }
  }

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createUser(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }
}
