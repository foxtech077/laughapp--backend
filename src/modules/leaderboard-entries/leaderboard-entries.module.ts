import { Module } from '@nestjs/common';
import { LeaderboardEntriesService } from './leaderboard-entries.service';
import { LeaderboardController } from './leaderboard-entries.controller';

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardEntriesService],
  exports: [LeaderboardEntriesService],
})
export class LeaderboardEntriesModule {}
