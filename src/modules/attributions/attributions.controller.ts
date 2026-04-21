import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttributionsService } from './attributions.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('attributions')
@Controller('attributions')
export class AttributionsController {
  constructor(private readonly attributionsService: AttributionsService) {}

  @Get('user/:userId')
  @Public()
  @ApiOperation({ summary: 'Get attributions for a user' })
  @ApiResponse({ status: 200, description: 'Attribution list' })
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.attributionsService.findByUser(userId, page, limit);
  }

  @Get('creator/:creatorId/stats')
  @Public()
  @ApiOperation({ summary: 'Get attribution stats for a creator' })
  @ApiResponse({ status: 200, description: 'Attribution stats' })
  getStatsByCreator(@Param('creatorId', ParseUUIDPipe) creatorId: string) {
    return this.attributionsService.getStatsByCreator(creatorId);
  }
}
