import { Module } from '@nestjs/common';
import { CreatorProfilesService } from './creator-profiles.service';
import { CreatorProfilesController } from './creator-profiles.controller';

@Module({
  controllers: [CreatorProfilesController],
  providers: [CreatorProfilesService],
  exports: [CreatorProfilesService],
})
export class CreatorProfilesModule {}
