import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { CoinTxnReason } from '@prisma/client';

export class CreateCoinTransactionDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsInt()
  amount: number;

  @ApiProperty({ enum: CoinTxnReason })
  @IsEnum(CoinTxnReason)
  reason: CoinTxnReason;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class FindCoinTransactionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ enum: CoinTxnReason })
  @IsEnum(CoinTxnReason)
  @IsOptional()
  reason?: CoinTxnReason;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}
