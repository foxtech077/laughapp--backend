import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VideoPublishQuotaService } from './video-publish-quota.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';

@ApiTags('quota')
@Controller('quota')
@ApiBearerAuth()
export class VideoPublishQuotaController {
  constructor(private readonly quotaService: VideoPublishQuotaService) {}

  @Get('my')
  @Roles(UserType.CREATOR)
  @ApiOperation({ summary: 'Get my publishing quota' })
  @ApiResponse({ status: 200, description: 'Quota info' })
  getMyQuota(@CurrentUser('id') userId: string) {
    return this.quotaService.getQuota(userId);
  }

  @Get(':creatorId')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get creator quota (Admin)' })
  @ApiResponse({ status: 200, description: 'Quota info' })
  getQuota(@Param('creatorId', ParseUUIDPipe) creatorId: string) {
    return this.quotaService.getQuota(creatorId);
  }
}
