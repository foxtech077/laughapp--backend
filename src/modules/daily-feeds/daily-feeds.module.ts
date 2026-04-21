import { Module } from '@nestjs/common';
import { DailyFeedsService } from './daily-feeds.service';
import { FeedsController } from './daily-feeds.controller';

@Module({
  controllers: [FeedsController],
  providers: [DailyFeedsService],
  exports: [DailyFeedsService],
})
export class DailyFeedsModule {}
