import { Router, Request, Response, NextFunction } from 'express';
import {
  AvailabilityQuerySchema,
  SetStaffScheduleSchema,
  CreateBlockedPeriodSchema,
} from '@reservy/validation';
import { Permission } from '@reservy/domain';
import { availabilityService } from './availability.service';
import { authenticate, requirePermission } from '../../core/guards/auth.guard';
import { AuthenticatedRequest, getOrganizationId } from '../../core/tenant-context';

export const availabilityRouter = Router();

// Public / Internal Availability Query
availabilityRouter.get('/slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req.query.organizationId as string) || (req.headers['x-organization-id'] as string);
    if (!orgId) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'organizationId الزامی است' } });
      return;
    }
    const validated = AvailabilityQuerySchema.parse({
      serviceId: req.query.serviceId,
      staffId: req.query.staffId || undefined,
      locationId: req.query.locationId || undefined,
      date: req.query.date,
    });

    const slots = await availabilityService.getAvailableSlots(orgId, validated);
    res.json({ data: slots });
  } catch (err) {
    next(err);
  }
});

// Authenticated Schedule & Blocked Period Endpoints
availabilityRouter.use(authenticate);

availabilityRouter.get('/staff/:staffId/schedule', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const schedules = await availabilityService.getStaffSchedules(orgId, req.params.staffId);
    res.json({ data: schedules });
  } catch (err) {
    next(err);
  }
});

availabilityRouter.put(
  '/staff/:staffId/schedule',
  requirePermission(Permission.STAFF_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = SetStaffScheduleSchema.parse(req.body);
      const result = await availabilityService.setStaffSchedules(orgId, req.params.staffId, validated);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

availabilityRouter.get('/blocked-periods', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const staffId = req.query.staffId as string | undefined;
    const periods = await availabilityService.getBlockedPeriods(orgId, staffId);
    res.json({ data: periods });
  } catch (err) {
    next(err);
  }
});

availabilityRouter.post(
  '/blocked-periods',
  requirePermission(Permission.STAFF_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = CreateBlockedPeriodSchema.parse(req.body);
      const created = await availabilityService.createBlockedPeriod(orgId, validated);
      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  }
);

availabilityRouter.delete(
  '/blocked-periods/:id',
  requirePermission(Permission.STAFF_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      await availabilityService.deleteBlockedPeriod(orgId, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
