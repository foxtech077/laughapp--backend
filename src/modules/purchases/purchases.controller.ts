import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto, ConfirmPurchaseDto } from './dto/purchase.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserType } from '@prisma/client';

@ApiTags('purchases')
@Controller('purchases')
@ApiBearerAuth()
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a purchase (initiates payment)' })
  @ApiResponse({ status: 201, description: 'Purchase created' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(userId, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm payment and credit coins' })
  @ApiResponse({ status: 200, description: 'Purchase confirmed' })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('userType') userType: UserType,
    @Body() dto: ConfirmPurchaseDto,
  ) {
    return this.purchasesService.confirm(id, userId, userType, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my purchases' })
  @ApiResponse({ status: 200, description: 'Purchase list' })
  findByUser(@CurrentUser('id') userId: string) {
    return this.purchasesService.findByUser(userId);
  }
}
