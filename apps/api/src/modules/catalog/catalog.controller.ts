import { Router, Response, NextFunction } from 'express';
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  CreateStaffSchema,
  UpdateStaffSchema,
  CreateServiceCategorySchema,
} from '@reservy/validation';
import { Permission } from '@reservy/domain';
import { catalogService } from './catalog.service';
import { authenticate, requirePermission } from '../../core/guards/auth.guard';
import { AuthenticatedRequest, getOrganizationId } from '../../core/tenant-context';

export const catalogRouter = Router();

catalogRouter.use(authenticate);

// ----------------------------------------------------
// Categories
// ----------------------------------------------------
catalogRouter.get('/categories', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const result = await catalogService.getCategories(orgId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

catalogRouter.post(
  '/categories',
  requirePermission(Permission.SERVICE_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = CreateServiceCategorySchema.parse(req.body);
      const result = await catalogService.createCategory(orgId, validated.name, validated.description, validated.sortOrder);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

catalogRouter.delete(
  '/categories/:id',
  requirePermission(Permission.SERVICE_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      await catalogService.deleteCategory(orgId, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ----------------------------------------------------
// Services
// ----------------------------------------------------
catalogRouter.get('/services', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const result = await catalogService.getServices(orgId, { includeInactive: true });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

catalogRouter.post(
  '/services',
  requirePermission(Permission.SERVICE_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = CreateServiceSchema.parse(req.body);
      const result = await catalogService.createService(orgId, validated);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

catalogRouter.patch(
  '/services/:id',
  requirePermission(Permission.SERVICE_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = UpdateServiceSchema.parse(req.body);
      const result = await catalogService.updateService(orgId, req.params.id, validated);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

catalogRouter.delete(
  '/services/:id',
  requirePermission(Permission.SERVICE_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      await catalogService.deleteService(orgId, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ----------------------------------------------------
// Staff Members
// ----------------------------------------------------
catalogRouter.get('/staff', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const result = await catalogService.getStaffMembers(orgId, { includeInactive: true });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

catalogRouter.post(
  '/staff',
  requirePermission(Permission.STAFF_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = CreateStaffSchema.parse(req.body);
      const result = await catalogService.createStaff(orgId, validated);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

catalogRouter.patch(
  '/staff/:id',
  requirePermission(Permission.STAFF_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = UpdateStaffSchema.parse(req.body);
      const result = await catalogService.updateStaff(orgId, req.params.id, validated);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

catalogRouter.delete(
  '/staff/:id',
  requirePermission(Permission.STAFF_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      await catalogService.deleteStaff(orgId, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
