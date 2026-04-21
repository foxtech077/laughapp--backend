import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, IsOptional, IsString } from 'class-validator';

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
