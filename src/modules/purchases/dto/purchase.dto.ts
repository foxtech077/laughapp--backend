import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsInt } from 'class-validator';

export class CreatePurchaseDto {
  @ApiProperty()
  @IsUUID()
  packageId: string;
}

export class ConfirmPurchaseDto {
  @ApiProperty()
  @IsString()
  paymentProvider: string;

  @ApiProperty()
  @IsString()
  paymentProviderTxnId: string;
}
