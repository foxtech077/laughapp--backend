import { PrismaClient, UserType, VideoStatus, CoinTxnReason, FeedStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@laughapp.com' },
    update: {},
    create: {
      email: 'admin@laughapp.com',
      username: 'admin',
      passwordHash: adminPassword,
      displayName: 'Admin',
      userType: UserType.ADMIN,
      isActive: true,
      isVerified: true,
      coinBalance: 0,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create a creator
  const creatorPassword = await bcrypt.hash('creator123', 12);
  const creator = await prisma.user.upsert({
    where: { email: 'creator@laughapp.com' },
    update: {},
    create: {
      email: 'creator@laughapp.com',
      username: 'comedian_joe',
      passwordHash: creatorPassword,
      displayName: 'Joe Comedian',
      userType: UserType.CREATOR,
      isActive: true,
      isVerified: true,
      coinBalance: 100,
      profileLink: 'comedian_joe-abc12345',
    },
  });

  // Create creator profile
  await prisma.creatorProfile.upsert({
    where: { userId: creator.id },
    update: {},
    create: {
      userId: creator.id,
      stageName: 'Joe Comedian',
      tagline: 'Making you laugh since 2020',
      totalViews: BigInt(10000),
      totalSignups: BigInt(500),
      totalTipsReceived: BigInt(100),
      totalTipAmount: BigInt(1500),
      totalFollowers: BigInt(200),
    },
  });

  // Create video publish quota for creator
  await prisma.videoPublishQuota.upsert({
    where: { creatorId: creator.id },
    update: {},
    create: {
      creatorId: creator.id,
      dailyResetAt: new Date(),
      weeklyResetAt: new Date(),
    },
  });
  console.log('✅ Creator created:', creator.email);

  // Create fan user
  const fanPassword = await bcrypt.hash('fan123', 12);
  const fan = await prisma.user.upsert({
    where: { email: 'fan@laughapp.com' },
    update: {},
    create: {
      email: 'fan@laughapp.com',
      username: 'happy_fan',
      passwordHash: fanPassword,
      displayName: 'Happy Fan',
      userType: UserType.FAN,
      isActive: true,
      isVerified: true,
      coinBalance: 10,
      isOnTrial: true,
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      profileLink: 'happy_fan-def67890',
    },
  });
  console.log('✅ Fan created:', fan.email);

  // Create coin packages
  const packages = [
    { name: 'Starter Pack', coinAmount: 50, priceUsdCents: 499, bonusCoins: 0, sortOrder: 1 },
    { name: 'Popular Pack', coinAmount: 100, priceUsdCents: 999, bonusCoins: 10, sortOrder: 2 },
    { name: 'Super Pack', coinAmount: 250, priceUsdCents: 1999, bonusCoins: 50, sortOrder: 3 },
    { name: 'Ultimate Pack', coinAmount: 500, priceUsdCents: 3999, bonusCoins: 150, sortOrder: 4 },
  ];

  for (const pkg of packages) {
    await prisma.coinPackage.upsert({
      where: { id: pkg.name.toLowerCase().replace(' ', '-') },
      update: pkg,
      create: {
        id: pkg.name.toLowerCase().replace(' ', '-'),
        ...pkg,
        isActive: true,
        priceUsdDisplay: `$${(pkg.priceUsdCents / 100).toFixed(2)}`,
      },
    });
  }
  console.log('✅ Coin packages created');

  // Create sample videos
  const videos = [
    { title: 'Funny Cat Compilation', description: 'Best cat fails of 2026', hashtags: 'cats,funny,fails', viewCount: 1000n, signupCount: 50n, tipCount: 10n, tipAmount: 150n },
    { title: 'Stand-up Special', description: 'My best jokes', hashtags: 'standup,comedy', viewCount: 500n, signupCount: 25n, tipCount: 5n, tipAmount: 75n },
    { title: 'Improv Session', description: 'Live improv comedy', hashtags: 'improv,theater', viewCount: 300n, signupCount: 15n, tipCount: 3n, tipAmount: 45n },
  ];

  for (const videoData of videos) {
    await prisma.video.create({
      data: {
        creatorId: creator.id,
        ...videoData,
        videoUrl: 'https://s3.amazonaws.com/bucket/video.mp4',
        thumbnailUrl: 'https://s3.amazonaws.com/bucket/thumb.jpg',
        status: VideoStatus.PUBLISHED,
        publishedAt: new Date(),
        isActive: true,
      },
    });
  }
  console.log('✅ Sample videos created');

  // Create a daily feed
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const feed = await prisma.dailyFeed.upsert({
    where: { feedDate: today },
    update: {},
    create: {
      feedDate: today,
      status: FeedStatus.PUBLISHED,
      generatedAt: new Date(),
      publishedAt: new Date(),
      totalVideos: videos.length,
      generationDurationMs: 100,
    },
  });

  const allVideos = await prisma.video.findMany({ where: { creatorId: creator.id } });
  for (let i = 0; i < allVideos.length; i++) {
    await prisma.dailyFeedEntry.create({
      data: {
        feedId: feed.id,
        videoId: allVideos[i].id,
        rank: i + 1,
        score: 100 - i * 20,
        viewCount: allVideos[i].viewCount,
        signupCount: allVideos[i].signupCount,
        tipCount: allVideos[i].tipCount,
        tipAmount: allVideos[i].tipAmount,
      },
    });
  }
  console.log('✅ Daily feed created');

  console.log('\n🎉 Seeding completed!\n');
  console.log('Test accounts:');
  console.log('  Admin:  admin@laughapp.com / admin123');
  console.log('  Creator: creator@laughapp.com / creator123');
  console.log('  Fan: fan@laughapp.com / fan123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
