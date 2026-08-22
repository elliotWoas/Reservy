import { PrismaClient } from '@prisma/client';
import {
  UserRole,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentProofReviewStatus,
  Currency,
} from '@reservy/domain';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const hasher = crypto.createHash('sha256');
  hasher.update(password + 'reservy-salt');
  return hasher.digest('hex');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Super Admin
  const adminPasswordHash = hashPassword('password123');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@reservy.com' },
    update: {},
    create: {
      email: 'admin@reservy.com',
      passwordHash: adminPasswordHash,
      fullName: 'مدیر کل پلتفرم',
      phone: '09120000000',
      role: UserRole.PLATFORM_ADMIN,
      isSuperAdmin: true,
    },
  });
  console.log('✅ Created Super Admin:', adminUser.email);

  // 2. Create Tenant & Organization
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'aria-group' },
    update: {},
    create: {
      name: 'هلدینگ آریا',
      slug: 'aria-group',
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: 'aria-beauty' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'استودیو زیبایی آریا',
      slug: 'aria-beauty',
      description: 'ارائه خدمات حرفه‌ای زیبایی، استایلینگ مو و مراقبت از پوست با کادری مجرب در محیطی مدرن و آرامش‌بخش.',
      logoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&auto=format&fit=crop&q=80',
      phone: '02122003344',
      email: 'info@ariabeauty.ir',
      timezone: 'Asia/Tehran',
      currency: Currency.IRT,
      locale: 'fa-IR',
    },
  });
  console.log('✅ Created Organization:', org.name);

  // 3. Create Business Owner
  const ownerPasswordHash = hashPassword('password123');
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@reservy.com' },
    update: {},
    create: {
      email: 'owner@reservy.com',
      passwordHash: ownerPasswordHash,
      fullName: 'امیرحسین رضایی',
      phone: '09121111111',
      role: UserRole.OWNER,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: ownerUser.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: ownerUser.id,
      tenantId: tenant.id,
      organizationId: org.id,
      role: UserRole.OWNER,
    },
  });

  // 4. Create Location
  const location = await prisma.location.create({
    data: {
      organizationId: org.id,
      name: 'شعبه سعادت‌آباد',
      address: 'تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۴۲، طبقه ۲',
      phone: '02122003344',
      timezone: 'Asia/Tehran',
    },
  });

  // 5. Create Card Account for Card-to-Card payment
  await prisma.cardAccount.create({
    data: {
      organizationId: org.id,
      cardNumber: '6037997123456789',
      cardHolderName: 'امیرحسین رضایی',
      bankName: 'بانک ملی ایران',
      isActive: true,
    },
  });

  // 6. Create Service Categories
  const catHair = await prisma.serviceCategory.create({
    data: { organizationId: org.id, name: 'خدمات مو و استایل', sortOrder: 1 },
  });
  const catSkin = await prisma.serviceCategory.create({
    data: { organizationId: org.id, name: 'خدمات پوست و فیشیال', sortOrder: 2 },
  });
  const catVIP = await prisma.serviceCategory.create({
    data: { organizationId: org.id, name: 'پکیج‌های اختصاصی VIP', sortOrder: 3 },
  });

  // 7. Create Services
  const sHaircut = await prisma.service.create({
    data: {
      organizationId: org.id,
      categoryId: catHair.id,
      name: 'اصلاح و استایل مو',
      description: 'شستشو، کوتاهی ژورنالی متناسب با فرم چهره و استایل نهایی با محصولات حرفه‌ای',
      durationMinutes: 45,
      price: 350000,
      bufferBeforeMinutes: 5,
      bufferAfterMinutes: 5,
      currency: Currency.IRT,
    },
  });

  const sBeard = await prisma.service.create({
    data: {
      organizationId: org.id,
      categoryId: catHair.id,
      name: 'اصلاح و فرم‌دهی ریش',
      description: 'قرینه‌سازی و کانتور ریش با تیغ و بخور گرم',
      durationMinutes: 30,
      price: 200000,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      currency: Currency.IRT,
    },
  });

  const sFacial = await prisma.service.create({
    data: {
      organizationId: org.id,
      categoryId: catSkin.id,
      name: 'پاکسازی عمیق و فیشیال پوست',
      description: 'لایه‌برداری، میکرودرم، آبرسانی عمقی، ماساژ صورت و ماسک طلا',
      durationMinutes: 60,
      price: 650000,
      bufferBeforeMinutes: 10,
      bufferAfterMinutes: 10,
      currency: Currency.IRT,
    },
  });

  const sVIP = await prisma.service.create({
    data: {
      organizationId: org.id,
      categoryId: catVIP.id,
      name: 'پکیج سلطنتی VIP آریا',
      description: 'شامل اصلاح مو، اصلاح ریش، فیشیال VIP، پدیکور و ماساژ ریلکسی سر و شانه',
      durationMinutes: 120,
      price: 1500000,
      bufferBeforeMinutes: 10,
      bufferAfterMinutes: 15,
      currency: Currency.IRT,
    },
  });

  // 8. Create Staff Members
  const staff1 = await prisma.staffMember.create({
    data: {
      organizationId: org.id,
      displayName: 'علی رضایی',
      bio: 'متخصص استایلینگ و کوتاهی کلاسیک و مدرن با بیش از ۸ سال تجربه',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      phone: '09122222222',
      isBookable: true,
      isActive: true,
    },
  });

  const staff2 = await prisma.staffMember.create({
    data: {
      organizationId: org.id,
      displayName: 'رضا محمدی',
      bio: 'مستر باربر و متخصص مراقبت از پوست و فیشیال آقایان',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      phone: '09123333333',
      isBookable: true,
      isActive: true,
    },
  });

  // Link Staff to Services
  await prisma.staffService.createMany({
    data: [
      { staffId: staff1.id, serviceId: sHaircut.id },
      { staffId: staff1.id, serviceId: sBeard.id },
      { staffId: staff1.id, serviceId: sVIP.id },
      { staffId: staff2.id, serviceId: sHaircut.id },
      { staffId: staff2.id, serviceId: sFacial.id },
      { staffId: staff2.id, serviceId: sVIP.id },
    ],
  });

  // 9. Create Schedules for Staff (Saturday to Thursday: 10:00 - 21:00 with 14:00-15:00 lunch break; Friday off)
  for (const staff of [staff1, staff2]) {
    for (let day = 0; day <= 6; day++) {
      const isFriday = day === 6;
      await prisma.staffSchedule.create({
        data: {
          organizationId: org.id,
          staffId: staff.id,
          dayOfWeek: day,
          isDayOff: isFriday,
          shiftsJson: isFriday ? '[]' : JSON.stringify([{ startTime: '10:00', endTime: '21:00' }]),
          breaksJson: isFriday ? '[]' : JSON.stringify([{ startTime: '14:00', endTime: '15:00' }]),
        },
      });
    }
  }

  // 10. Create Customers
  const cust1 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      fullName: 'سهراب مرادی',
      phone: '09124445566',
      email: 'sohrab@example.com',
      notes: 'مدل موی ترجیحی: فید سایه روشن، حساسیت به اسپری حاوی الکل',
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      fullName: 'نیما کیهانی',
      phone: '09127778899',
      email: 'nima@example.com',
      notes: 'مشتری قدیمی، چای دارچین دوست دارد',
    },
  });

  // 11. Create Bookings & Payments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(7, 30, 0, 0); // 11:00 Tehran time

  const booking1End = new Date(tomorrow.getTime() + 45 * 60 * 1000);

  const b1 = await prisma.booking.create({
    data: {
      organizationId: org.id,
      locationId: location.id,
      customerId: cust1.id,
      staffId: staff1.id,
      serviceId: sHaircut.id,
      code: 'BK-7A9F21',
      accessToken: 'tok_demo_secure_booking_1',
      startAt: tomorrow,
      endAt: booking1End,
      status: BookingStatus.PAYMENT_SUBMITTED,
      price: sHaircut.price,
      currency: Currency.IRT,
      notes: 'لطفا در صورت امکان راس ساعت آماده باشید',
      serviceNameSnapshot: sHaircut.name,
      staffNameSnapshot: staff1.displayName,
      priceSnapshot: sHaircut.price,
      durationSnapshot: sHaircut.durationMinutes,
      items: {
        create: {
          serviceId: sHaircut.id,
          serviceNameSnapshot: sHaircut.name,
          priceSnapshot: sHaircut.price,
          durationSnapshot: sHaircut.durationMinutes,
        },
      },
    },
  });

  await prisma.payment.create({
    data: {
      organizationId: org.id,
      bookingId: b1.id,
      method: PaymentMethod.CARD_TO_CARD,
      amount: sHaircut.price,
      currency: Currency.IRT,
      status: PaymentStatus.PROOF_SUBMITTED,
      referenceNumber: 'REF-88492019',
      proofs: {
        create: {
          fileUrl: '/uploads/demo-receipt.jpg',
          mimeType: 'image/jpeg',
          fileSize: 245120,
          reviewStatus: PaymentProofReviewStatus.PENDING,
        },
      },
    },
  });

  console.log('✅ Seed data successfully populated!');
  console.log('----------------------------------------------------');
  console.log('🔑 Demo Login Credentials:');
  console.log('Super Admin: admin@reservy.com | password123');
  console.log('Business Owner: owner@reservy.com | password123');
  console.log('Public Booking Page: http://localhost:3000/aria-beauty');
  console.log('Dashboard: http://localhost:3000/dashboard');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
