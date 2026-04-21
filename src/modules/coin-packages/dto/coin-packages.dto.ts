// Coin packages DTOs - only list/find operations needed
export class CoinPackageResponseDto {
  id: string;
  name: string;
  description: string | null;
  coinAmount: number;
  priceUsdCents: number;
  priceUsdDisplay: string | null;
  bonusCoins: number;
  isActive: boolean;
  sortOrder: number;
}
