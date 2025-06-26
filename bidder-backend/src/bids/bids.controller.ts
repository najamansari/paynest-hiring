import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Get,
  Req,
  ForbiddenException
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreateBidDto } from './dto/create-bid.dto';
import { Bid } from './bid.entity';

@ApiTags('bids')
@Controller('items/:itemId/bids')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @ApiOperation({ summary: 'Place a bid on an item' })
  @ApiResponse({
    status: 201,
    description: 'Bid placed successfully',
    type: Bid
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async placeBid(
    @Param('itemId') itemId: number,
    @Body() createBidDto: CreateBidDto,
    @Req() req
  ) {
    // Ensure user can only bid for themselves
    const userId = req.user.userId;
    return this.bidsService.placeBid(
      Number(itemId),
      userId,
      createBidDto.amount
    );
  }

}
