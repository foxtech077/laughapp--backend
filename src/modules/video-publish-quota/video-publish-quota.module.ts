import { Module } from '@nestjs/common';
import { VideoPublishQuotaService } from './video-publish-quota.service';
import { VideoPublishQuotaController } from './video-publish-quota.controller';

@Module({
  controllers: [VideoPublishQuotaController],
  providers: [VideoPublishQuotaService],
  exports: [VideoPublishQuotaService],
})
export class VideoPublishQuotaModule {}
