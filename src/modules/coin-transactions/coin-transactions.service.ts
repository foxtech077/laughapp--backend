import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { FindCoinTransactionsDto } from './dto/coin-transaction.dto';

@Injectable()
export class CoinTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: FindCoinTransactionsDto) {
    const { userId, reason, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (reason) where.reason = reason;

    const [transactions, total] = await Promise.all([
      this.prisma.coinTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coinTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });

    return { balance: user?.coinBalance || 0 };
  }
}
