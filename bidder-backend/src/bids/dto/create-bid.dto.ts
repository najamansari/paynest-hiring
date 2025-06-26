import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreateBidDto {

  @ApiProperty({ example: 150.0, description: 'Bid amount' })
  @IsNumber()
  @Min(0.01, { message: 'Bid amount must be at least $0.01' })
  amount: number;
}
