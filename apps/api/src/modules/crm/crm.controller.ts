import { Router, Response, NextFunction } from 'express';
import { UpdateCustomerNotesSchema } from '@reservy/validation';
import { Permission } from '@reservy/domain';
import { crmService } from './crm.service';
import { authenticate, requirePermission } from '../../core/guards/auth.guard';
import { AuthenticatedRequest, getOrganizationId } from '../../core/tenant-context';

export const crmRouter = Router();

crmRouter.use(authenticate);

crmRouter.get('/', requirePermission(Permission.CUSTOMER_READ), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const result = await crmService.getCustomers(orgId, {
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

crmRouter.patch(
  '/:id/notes',
  requirePermission(Permission.CUSTOMER_UPDATE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = UpdateCustomerNotesSchema.parse(req.body);
      const result = await crmService.updateCustomerNotes(orgId, req.params.id, validated);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
