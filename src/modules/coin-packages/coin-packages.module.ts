import { Module } from '@nestjs/common';
import { CoinPackagesService } from './coin-packages.service';
import { CoinPackagesController } from './coin-packages.controller';

@Module({
  controllers: [CoinPackagesController],
  providers: [CoinPackagesService],
  exports: [CoinPackagesService],
})
export class CoinPackagesModule {}
