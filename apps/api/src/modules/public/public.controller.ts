import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@reservy/database';
import { DomainError, DomainErrorCode } from '@reservy/domain';
import { PublicCreateBookingSchema, AvailabilityQuerySchema, SubmitPaymentProofSchema } from '@reservy/validation';
import { availabilityService } from '../availability/availability.service';
import { bookingService } from '../booking/booking.service';
import { paymentService } from '../payment/payment.service';

export const publicRouter = Router();

// Public Organization Profile
publicRouter.get('/organizations/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.slug, status: 'ACTIVE' },
      include: {
        locations: { where: { isActive: true } },
        cardAccounts: { where: { isActive: true }, select: { cardNumber: true, cardHolderName: true, bankName: true } },
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            services: {
              where: { isActive: true, isPublic: true, deletedAt: null },
              include: {
                staffServices: {
                  include: {
                    staff: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
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
                staff: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
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

    res.json({ data: org });
  } catch (err) {
    next(err);
  }
});

// Public Availability Engine Query
publicRouter.get('/organizations/:slug/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.slug, status: 'ACTIVE' },
    });

    if (!org) {
      throw new DomainError(DomainErrorCode.ORGANIZATION_NOT_FOUND, 'کسب‌وکار مورد نظر یافت نشد');
    }

    const validated = AvailabilityQuerySchema.parse({
      serviceId: req.query.serviceId,
      staffId: req.query.staffId || undefined,
      locationId: req.query.locationId || undefined,
      date: req.query.date,
    });

    const slots = await availabilityService.getAvailableSlots(org.id, validated);
    res.json({ data: slots });
  } catch (err) {
    next(err);
  }
});

// Public Create Booking
publicRouter.post('/organizations/:slug/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.slug, status: 'ACTIVE' },
    });

    if (!org) {
      throw new DomainError(DomainErrorCode.ORGANIZATION_NOT_FOUND, 'کسب‌وکار مورد نظر یافت نشد');
    }

    const validated = PublicCreateBookingSchema.parse(req.body);
    const result = await bookingService.createBooking(org.id, validated);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Public Submit Payment Proof
publicRouter.post('/payments/proof', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = SubmitPaymentProofSchema.parse(req.body);
    const result = await paymentService.submitPaymentProof(validated);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});
