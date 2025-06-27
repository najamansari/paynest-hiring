import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Item } from './item.entity';

@ApiTags('items')
@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new auction item' })
  @ApiResponse({ status: 201, description: 'Item created', type: Item })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.createItem(createItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active auction items' })
  @ApiResponse({ status: 200, description: 'List of items', type: [Item] })
  findAll() {
    return this.itemsService.getActiveAuctions();
  }

  @Get(':itemId')
  @ApiOperation({ summary: 'Gets details of the requested item' })
  @ApiResponse({ status: 200, description: 'Item details', type: Item })
  async findItem(@Param('itemId') itemId: number) {
    return this.itemsService.findItem(itemId);
  }
}
