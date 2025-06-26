import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString, IsOptional, IsNotEmpty, Min } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: 'Antique Vase', description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '18th century artifact', description: 'Item description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 100.0, description: 'Starting price' })
  @IsNumber()
  @Min(0.01)
  startingPrice: number;

  @ApiProperty({ example: 3600, description: 'Auction duration in seconds' })
  @IsNumber()
  duration: number; // Duration in seconds

  @ApiProperty({ example: '2025-01-01 01:01:59', description: 'Optional time at which the auction should start. Defaults to the current time.' })
  @IsDate()
  @IsOptional()
  activateAt?: Date; // Optional activation time
}
