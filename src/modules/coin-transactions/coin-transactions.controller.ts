import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoinTransactionsService } from './coin-transactions.service';
import { FindCoinTransactionsDto } from './dto/coin-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('coins')
@Controller('coins')
@ApiBearerAuth()
export class CoinTransactionsController {
  constructor(private readonly coinTransactionsService: CoinTransactionsService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get my coin transactions' })
  @ApiResponse({ status: 200, description: 'Transaction list' })
  findAll(@CurrentUser('id') userId: string, @Query() dto: Omit<FindCoinTransactionsDto, 'userId'>) {
    return this.coinTransactionsService.findAll({ ...dto, userId });
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get my coin balance' })
  @ApiResponse({ status: 200, description: 'Current balance' })
  getBalance(@CurrentUser('id') userId: string) {
    return this.coinTransactionsService.getBalance(userId);
  }
}
