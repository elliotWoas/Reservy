import { Router, Response, NextFunction } from 'express';
import { OrganizationStatus } from '@reservy/domain';
import { adminService } from './admin.service';
import { authenticate, requireSuperAdmin } from '../../core/guards/auth.guard';
import { AuthenticatedRequest } from '../../core/tenant-context';

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireSuperAdmin);

adminRouter.get('/overview', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getPlatformOverview();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/organizations/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: OrganizationStatus };
    const result = await adminService.setOrganizationStatus(req.params.id, status);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
