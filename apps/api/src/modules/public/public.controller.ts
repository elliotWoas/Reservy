import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DomainError, DomainErrorCode } from '@reservy/domain';
import {
  PublicCreateBookingSchema,
  AvailabilityQuerySchema,
  SubmitPaymentProofSchema,
} from '@reservy/validation';
import { AvailabilityService } from '../availability/availability.service';
import { BookingService } from '../booking/booking.service';
import { PaymentService } from '../payment/payment.service';

@Controller()
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly bookingService: BookingService,
    private readonly paymentService: PaymentService
  ) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('public/organizations/:slug')
  async getPublicProfile(@Param('slug') slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug, status: 'ACTIVE' },
      include: {
        locations: { where: { isActive: true } },
        cardAccounts: {
          where: { isActive: true },
          select: { cardNumber: true, cardHolderName: true, bankName: true },
        },
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            services: {
              where: { isActive: true, isPublic: true, deletedAt: null },
              include: {
                staffServices: {
                  include: {
                    staff: {
                      select: { id: true, displayName: true, avatarUrl: true, bio: true },
                    },
                  },
                },
              },
            },
          },
        },
        services: {
          where: { isActive: true, isPublic: true, deletedAt: null },
          include: {
            category: true,
            staffServices: {
              include: {
                staff: {
                  select: { id: true, displayName: true, avatarUrl: true, bio: true },
                },
              },
            },
          },
        },
        staffMembers: {
          where: { isActive: true, isBookable: true, deletedAt: null },
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            isBookable: true,
          },
        },
      },
    });

    if (!org) {
      throw new DomainError(DomainErrorCode.ORGANIZATION_NOT_FOUND, 'کسب‌وکار مورد نظر یافت نشد');
    }

    return { data: org };
  }

  @Get('public/organizations/:slug/availability')
  async getPublicAvailability(
    @Param('slug') slug: string,
    @Query('serviceId') serviceId: string,
    @Query('staffId') staffId: string,
    @Query('locationId') locationId: string,
    @Query('date') date: string
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { slug, status: 'ACTIVE' },
    });

    if (!org) {
      throw new DomainError(DomainErrorCode.ORGANIZATION_NOT_FOUND, 'کسب‌وکار مورد نظر یافت نشد');
    }

    const validated = AvailabilityQuerySchema.parse({
      serviceId,
      staffId: staffId || undefined,
      locationId: locationId || undefined,
      date,
    });

    const slots = await this.availabilityService.getAvailableSlots(org.id, validated);
    return { data: slots };
  }

  @Post('public/organizations/:slug/bookings')
  async createPublicBooking(@Param('slug') slug: string, @Body() body: unknown) {
    const org = await this.prisma.organization.findUnique({
      where: { slug, status: 'ACTIVE' },
    });

    if (!org) {
      throw new DomainError(DomainErrorCode.ORGANIZATION_NOT_FOUND, 'کسب‌وکار مورد نظر یافت نشد');
    }

    const validated = PublicCreateBookingSchema.parse(body);
    const result = await this.bookingService.createBooking(org.id, validated);
    return result;
  }

  @Post('public/payments/proof')
  async submitPublicPaymentProof(@Body() body: unknown) {
    const validated = SubmitPaymentProofSchema.parse(body);
    const result = await this.paymentService.submitPaymentProof(validated);
    return { data: result };
  }
}
