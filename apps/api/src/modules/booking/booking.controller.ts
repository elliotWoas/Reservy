import { Router, Response, NextFunction } from 'express';
import {
  PublicCreateBookingSchema,
  DashboardCreateBookingSchema,
  UpdateBookingStatusSchema,
} from '@reservy/validation';
import { Permission, BookingStatus } from '@reservy/domain';
import { bookingService } from './booking.service';
import { authenticate, requirePermission } from '../../core/guards/auth.guard';
import { AuthenticatedRequest, getOrganizationId } from '../../core/tenant-context';

export const bookingRouter = Router();

// Public Token View
bookingRouter.get('/token/:token', async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingByToken(req.params.token);
    res.json({ data: booking });
  } catch (err) {
    next(err);
  }
});

// Authenticated Endpoints
bookingRouter.use(authenticate);

bookingRouter.get('/', requirePermission(Permission.BOOKING_READ), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const result = await bookingService.getBookings(orgId, {
      status: req.query.status as BookingStatus | undefined,
      staffId: req.query.staffId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

bookingRouter.post(
  '/',
  requirePermission(Permission.BOOKING_CREATE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = DashboardCreateBookingSchema.parse(req.body);
      const result = await bookingService.createBooking(orgId, validated, {
        actorUserId: req.user?.userId,
        initialStatus: validated.status,
      });
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

bookingRouter.patch(
  '/:id/status',
  requirePermission(Permission.BOOKING_UPDATE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = UpdateBookingStatusSchema.parse(req.body);
      const result = await bookingService.updateBookingStatus(
        orgId,
        req.params.id,
        validated,
        req.user?.userId
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
