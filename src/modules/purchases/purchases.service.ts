import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreatePurchaseDto, ConfirmPurchaseDto } from './dto/purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePurchaseDto) {
    const pkg = await this.prisma.coinPackage.findUnique({
      where: { id: dto.packageId },
    });

    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Coin package not found or inactive');
    }

    // Create purchase record
    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        packageId: dto.packageId,
        amountPaidCents: pkg.priceUsdCents,
        coinsPurchased: pkg.coinAmount,
        coinsBonus: pkg.bonusCoins,
        paymentStatus: 'PENDING',
      },
    });

    return purchase;
  }

  async confirm(id: string, dto: ConfirmPurchaseDto) {
    const purchase = await this.prisma.purchase.findUnique({ where: { id } });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.paymentStatus === 'COMPLETED') {
      throw new BadRequestException('Purchase already completed');
    }

    // Update purchase
    const updated = await this.prisma.purchase.update({
      where: { id },
      data: {
        paymentStatus: 'COMPLETED',
        paymentProvider: dto.paymentProvider,
        paymentProviderTxnId: dto.paymentProviderTxnId,
        completedAt: new Date(),
      },
    });

    // Credit coins to user
    const totalCoins = purchase.coinsPurchased + purchase.coinsBonus;

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: purchase.userId },
        data: { coinBalance: { increment: totalCoins } },
      });

      await tx.coinTransaction.create({
        data: {
          userId: purchase.userId,
          amount: totalCoins,
          balanceAfter: user.coinBalance,
          reason: 'PURCHASE',
          purchaseId: purchase.id,
        },
      });
    });

    return updated;
  }

  async findByUser(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        package: true,
      },
    });
  }
}
