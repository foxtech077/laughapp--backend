import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeaderboardEntriesService } from './leaderboard-entries.service';
import { GetLeaderboardDto, LeaderboardResponseDto } from './dto/leaderboard.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardEntriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get hourly leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard data', type: LeaderboardResponseDto })
  getLeaderboard(@Query() dto: GetLeaderboardDto) {
    return this.leaderboardService.getLeaderboard(dto);
  }

  @Post('update')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Trigger hourly leaderboard update (Admin only)' })
  @ApiResponse({ status: 200, description: 'Leaderboard updated' })
  updateLeaderboard() {
    return this.leaderboardService.updateHourlyLeaderboard();
  }
}
