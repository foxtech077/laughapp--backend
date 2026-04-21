import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuditLogService } from './admin-audit-log.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { Transform } from 'class-transformer';

@ApiTags('admin')
@Controller('admin/audit-log')
@ApiBearerAuth()
export class AdminAuditLogController {
  constructor(private readonly auditLogService: AdminAuditLogService) {}

  @Get()
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get all audit logs (Admin)' })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.findAll(page, limit);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get audit logs for entity (Admin)' })
  @ApiResponse({ status: 200, description: 'Entity audit logs' })
  findByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.auditLogService.findByEntity(entityType, entityId);
  }
}
