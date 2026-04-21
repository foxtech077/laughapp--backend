import { Controller, Get, Patch, Param, ParseUUIDPipe, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreatorProfilesService } from './creator-profiles.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('creators')
@Controller('creators')
export class CreatorProfilesController {
  constructor(private readonly creatorProfilesService: CreatorProfilesService) {}

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my creator profile' })
  @ApiResponse({ status: 200, description: 'Creator profile' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.creatorProfilesService.findByUser(userId);
  }

  @Get(':userId/profile')
  @Public()
  @ApiOperation({ summary: 'Get creator profile by user ID' })
  @ApiResponse({ status: 200, description: 'Creator profile' })
  getProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.creatorProfilesService.findByUser(userId);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my creator profile' })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() data: { stageName?: string; tagline?: string; payoutEmail?: string },
  ) {
    return this.creatorProfilesService.update(userId, data);
  }

  @Get('profile/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my creator stats' })
  @ApiResponse({ status: 200, description: 'Creator stats' })
  getMyStats(@CurrentUser('id') userId: string) {
    return this.creatorProfilesService.getStats(userId);
  }

  @Get(':userId/stats')
  @Public()
  @ApiOperation({ summary: 'Get creator stats by user ID' })
  @ApiResponse({ status: 200, description: 'Creator stats' })
  getStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.creatorProfilesService.getStats(userId);
  }
}
