import { Controller, Get, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, FindNotificationsDto, MarkReadDto } from './dto/notification.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  @ApiResponse({ status: 200, description: 'Notifications list' })
  findAll(@CurrentUser('id') userId: string, @Query() dto: FindNotificationsDto) {
    return this.notificationsService.findAll(userId, dto);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  markRead(@CurrentUser('id') userId: string, @Body() dto: MarkReadDto) {
    return this.notificationsService.markRead(userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  delete(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.delete(id, userId);
  }
}
