import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class CoinPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.coinPackage.findUnique({ where: { id } });
  }
}
