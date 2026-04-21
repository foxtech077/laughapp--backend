import { Module } from '@nestjs/common';
import { CoinTransactionsService } from './coin-transactions.service';
import { CoinTransactionsController } from './coin-transactions.controller';

@Module({
  controllers: [CoinTransactionsController],
  providers: [CoinTransactionsService],
  exports: [CoinTransactionsService],
})
export class CoinTransactionsModule {}
