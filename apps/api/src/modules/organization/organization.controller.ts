import { Router, Response, NextFunction } from 'express';
import { UpdateOrganizationSchema, CardAccountSchema } from '@reservy/validation';
import { Permission } from '@reservy/domain';
import { organizationService } from './organization.service';
import { authenticate, requirePermission } from '../../core/guards/auth.guard';
import { AuthenticatedRequest, getOrganizationId } from '../../core/tenant-context';

export const organizationRouter = Router();

organizationRouter.use(authenticate);

organizationRouter.get('/current', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const org = await organizationService.getOrganization(orgId);
    res.json({ data: org });
  } catch (err) {
    next(err);
  }
});

organizationRouter.patch(
  '/current',
  requirePermission(Permission.ORGANIZATION_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = UpdateOrganizationSchema.parse(req.body);
      const updated = await organizationService.updateOrganization(orgId, validated);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

organizationRouter.get('/card-accounts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const accounts = await organizationService.getCardAccounts(orgId);
    res.json({ data: accounts });
  } catch (err) {
    next(err);
  }
});

organizationRouter.post(
  '/card-accounts',
  requirePermission(Permission.ORGANIZATION_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = CardAccountSchema.parse(req.body);
      const created = await organizationService.setCardAccount(orgId, validated);
      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  }
);

organizationRouter.delete(
  '/card-accounts/:id',
  requirePermission(Permission.ORGANIZATION_MANAGE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      await organizationService.deleteCardAccount(orgId, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
