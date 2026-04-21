import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreatePurchaseDto, ConfirmPurchaseDto } from './dto/purchase.dto';
import { ForbiddenException } from '@nestjs/common';
import { UserType } from '@prisma/client';

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

  async confirm(id: string, requesterUserId: string, requesterUserType: UserType, dto: ConfirmPurchaseDto) {
    const purchase = await this.prisma.purchase.findUnique({ where: { id } });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.paymentStatus === 'COMPLETED') {
      throw new BadRequestException('Purchase already completed');
    }

    const isOwner = purchase.userId === requesterUserId;
    const isAdmin = requesterUserType === UserType.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to confirm this purchase');
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
