import { Router, Response, NextFunction } from 'express';
import { Permission } from '@reservy/domain';
import { reportingService } from './reporting.service';
import { authenticate, requirePermission } from '../../core/guards/auth.guard';
import { AuthenticatedRequest, getOrganizationId } from '../../core/tenant-context';

export const reportingRouter = Router();

reportingRouter.use(authenticate);

reportingRouter.get('/summary', requirePermission(Permission.REPORTS_READ), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const result = await reportingService.getDashboardSummary(orgId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

reportingRouter.get('/performance', requirePermission(Permission.REPORTS_READ), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const result = await reportingService.getPerformanceReport(orgId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
