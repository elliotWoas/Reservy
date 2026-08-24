import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentService } from './payment.service';
import { storageService } from '../../core/storage/storage.service';
import { CurrentOrgId, CurrentUser, RequirePermission } from '../../core/decorators/auth.decorators';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { PaymentStatus, Permission } from '@reservy/domain';
import { SubmitPaymentProofSchema, VerifyPaymentProofSchema } from '@reservy/validation';
import type { UserContext } from '../../core/tenant-context';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('receipt', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({ error: { code: 'FILE_REQUIRED', message: 'فایل رسید ارسال نشده است' } });
    }

    const saved = await storageService.saveFile(file.buffer, file.originalname, file.mimetype);
    return { data: saved };
  }

  @Post('proof')
  async submitProof(@Body() body: unknown) {
    const validated = SubmitPaymentProofSchema.parse(body);
    const result = await this.paymentService.submitPaymentProof(validated);
    return { data: result };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.PAYMENT_READ)
  async getPayments(
    @CurrentOrgId() orgId: string,
    @Query('status') status?: PaymentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const result = await this.paymentService.getPayments(orgId, {
      status,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return result;
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.PAYMENT_VERIFY)
  async verifyPayment(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const validated = VerifyPaymentProofSchema.parse(body);
    const result = await this.paymentService.verifyPayment(
      orgId,
      id,
      validated,
      user.userId
    );
    return { data: result };
  }
}
