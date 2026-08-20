import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { SubmitPaymentProofSchema, VerifyPaymentProofSchema } from '@reservy/validation';
import { Permission, PaymentStatus } from '@reservy/domain';
import { paymentService } from './payment.service';
import { storageService } from '../../core/storage/storage.service';
import { authenticate, requirePermission } from '../../core/guards/auth.guard';
import { AuthenticatedRequest, getOrganizationId } from '../../core/tenant-context';

export const paymentRouter = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Public receipt upload endpoint
paymentRouter.post('/upload', upload.single('receipt'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: { code: 'FILE_REQUIRED', message: 'فایل رسید ارسال نشده است' } });
      return;
    }

    const saved = await storageService.saveFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({ data: saved });
  } catch (err) {
    next(err);
  }
});

// Public submit payment proof
paymentRouter.post('/proof', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = SubmitPaymentProofSchema.parse(req.body);
    const result = await paymentService.submitPaymentProof(validated);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// Authenticated Dashboard Payment Review
paymentRouter.use(authenticate);

paymentRouter.get('/', requirePermission(Permission.PAYMENT_READ), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const result = await paymentService.getPayments(orgId, {
      status: req.query.status as PaymentStatus | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

paymentRouter.post(
  '/:id/verify',
  requirePermission(Permission.PAYMENT_VERIFY),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrganizationId(req);
      const validated = VerifyPaymentProofSchema.parse(req.body);
      const result = await paymentService.verifyPayment(
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
