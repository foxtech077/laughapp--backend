import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoinPackagesService } from './coin-packages.service';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('coins')
@Controller('coin-packages')
export class CoinPackagesController {
  constructor(private readonly coinPackagesService: CoinPackagesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all active coin packages' })
  @ApiResponse({ status: 200, description: 'Coin packages' })
  findAll() {
    return this.coinPackagesService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get coin package by ID' })
  @ApiResponse({ status: 200, description: 'Coin package' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coinPackagesService.findOne(id);
  }
}
