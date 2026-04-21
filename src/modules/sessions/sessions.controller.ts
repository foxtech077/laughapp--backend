import { Controller, Get, Delete, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('sessions')
@Controller('sessions')
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions' })
  getMySessions(@CurrentUser('id') userId: string) {
    return this.sessionsService.getActiveSessions(userId);
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate a session' })
  @ApiResponse({ status: 200, description: 'Session invalidated' })
  invalidate(@CurrentUser('id') userId: string, @Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.sessionsService.invalidate(userId, sessionId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate all my sessions' })
  @ApiResponse({ status: 200, description: 'All sessions invalidated' })
  invalidateAll(@CurrentUser('id') userId: string) {
    return this.sessionsService.invalidateAll(userId);
  }
}
