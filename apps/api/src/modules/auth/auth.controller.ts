import { Router, Request, Response, NextFunction } from 'express';
import { RegisterSchema, LoginSchema } from '@reservy/validation';
import { authService } from './auth.service';
import { authenticate } from '../../core/guards/auth.guard';
import { AuthenticatedRequest } from '../../core/tenant-context';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const result = await authService.register(validated);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const result = await authService.login(validated);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const activeOrgId = req.organizationId;
    const result = await authService.getMe(req.user!.userId, activeOrgId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
