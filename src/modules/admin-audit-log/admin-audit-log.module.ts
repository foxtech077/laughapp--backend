import { Module } from '@nestjs/common';
import { AdminAuditLogService } from './admin-audit-log.service';
import { AdminAuditLogController } from './admin-audit-log.controller';

@Module({
  controllers: [AdminAuditLogController],
  providers: [AdminAuditLogService],
  exports: [AdminAuditLogService],
})
export class AdminAuditLogModule {}
