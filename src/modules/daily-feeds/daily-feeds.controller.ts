import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DailyFeedsService } from './daily-feeds.service';
import { GenerateFeedDto, FindFeedsDto, FeedResponseDto } from './dto/daily-feed.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { UserType } from '@prisma/client';

@ApiTags('feeds')
@Controller('feeds')
export class FeedsController {
  constructor(private readonly dailyFeedsService: DailyFeedsService) {}

  @Post('generate')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Generate daily feed (Admin only)' })
  @ApiResponse({ status: 201, description: 'Feed generated', type: FeedResponseDto })
  generate(@Body() dto: GenerateFeedDto) {
    return this.dailyFeedsService.generate(dto);
  }

  @Post(':id/publish')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Publish a generated feed (Admin only)' })
  @ApiResponse({ status: 200, description: 'Feed published' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.dailyFeedsService.publish(id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all feeds with pagination' })
  @ApiResponse({ status: 200, description: 'List of feeds' })
  findAll(@Query() dto: FindFeedsDto) {
    return this.dailyFeedsService.findAll(dto);
  }

  @Get('date/:date')
  @Public()
  @ApiOperation({ summary: 'Get feed by date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Feed for date', type: FeedResponseDto })
  @ApiResponse({ status: 404, description: 'No feed found for this date' })
  findByDate(@Param('date') date: string) {
    return this.dailyFeedsService.findByDate(date);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get feed by ID' })
  @ApiResponse({ status: 200, description: 'Feed found', type: FeedResponseDto })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dailyFeedsService.findOne(id);
  }
}
