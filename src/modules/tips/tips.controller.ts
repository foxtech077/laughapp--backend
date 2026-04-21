import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TipsService } from './tips.service';
import { CreateTipDto, FindTipsDto, TipResponseDto, PaginatedTipsResponseDto } from './dto/tip.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('tips')
@Controller('tips')
@ApiBearerAuth()
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a tip to a creator' })
  @ApiResponse({ status: 201, description: 'Tip sent', type: TipResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient coins or invalid video' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTipDto) {
    return this.tipsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get tips with filters' })
  @ApiResponse({ status: 200, description: 'List of tips', type: PaginatedTipsResponseDto })
  findAll(@Query() dto: FindTipsDto) {
    return this.tipsService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tip by ID' })
  @ApiResponse({ status: 200, description: 'Tip found', type: TipResponseDto })
  @ApiResponse({ status: 404, description: 'Tip not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tipsService.findOne(id);
  }

  @Get('my/received')
  @ApiOperation({ summary: 'Get tips I received' })
  @ApiResponse({ status: 200, description: 'List of received tips', type: PaginatedTipsResponseDto })
  getMyReceived(@CurrentUser('id') userId: string, @Query() dto: Omit<FindTipsDto, 'creatorId'>) {
    return this.tipsService.findAll({ ...dto, creatorId: userId });
  }

  @Get('my/sent')
  @ApiOperation({ summary: 'Get tips I sent' })
  @ApiResponse({ status: 200, description: 'List of sent tips', type: PaginatedTipsResponseDto })
  getMySent(@CurrentUser('id') userId: string, @Query() dto: Omit<FindTipsDto, 'fanId'>) {
    return this.tipsService.findAll({ ...dto, fanId: userId });
  }
}
