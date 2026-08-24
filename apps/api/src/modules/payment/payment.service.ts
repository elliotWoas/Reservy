import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentProofReviewStatus,
  BookingStatus,
  DomainError,
  DomainErrorCode,
  canTransitionPayment,
} from '@reservy/domain';
import { SubmitPaymentProofInput, VerifyPaymentProofInput } from '@reservy/validation';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async submitPaymentProof(input: SubmitPaymentProofInput) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking) {
      throw new DomainError(DomainErrorCode.BOOKING_NOT_FOUND, 'نوبت مورد نظر یافت نشد');
    }

    return await this.prisma.$transaction(async (tx) => {
      let payment = await tx.payment.findFirst({
        where: { bookingId: booking.id },
      });

      if (!payment) {
        payment = await tx.payment.create({
          data: {
            organizationId: booking.organizationId,
            bookingId: booking.id,
            method: PaymentMethod.CARD_TO_CARD,
            amount: input.amount,
            currency: booking.currency,
            status: PaymentStatus.PROOF_SUBMITTED,
            referenceNumber: input.referenceNumber,
          },
        });
      } else {
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PROOF_SUBMITTED,
            amount: input.amount,
            referenceNumber: input.referenceNumber || payment.referenceNumber,
          },
        });
      }

      const proof = await tx.paymentProof.create({
        data: {
          paymentId: payment.id,
          fileUrl: input.fileUrl,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          reviewStatus: PaymentProofReviewStatus.PENDING,
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PAYMENT_SUBMITTED },
      });

      return { payment, proof };
    });
  }

  async getPayments(
    orgId: string,
    filters: {
      status?: PaymentStatus;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { status, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: { customer: true, service: true, staff: true },
          },
          proofs: { orderBy: { uploadedAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyPayment(
    orgId: string,
    paymentId: string,
    input: VerifyPaymentProofInput,
    actorUserId?: string
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, organizationId: orgId },
      include: { booking: true, proofs: true },
    });

    if (!payment) {
      throw new DomainError(DomainErrorCode.PAYMENT_NOT_FOUND, 'تراکنش پرداخت یافت نشد');
    }

    const targetPaymentStatus =
      input.reviewStatus === PaymentProofReviewStatus.APPROVED
        ? PaymentStatus.VERIFIED
        : PaymentStatus.REJECTED;

    const validation = canTransitionPayment(payment.status as PaymentStatus, targetPaymentStatus);
    if (!validation.valid) {
      throw new DomainError(DomainErrorCode.INVALID_STATUS_TRANSITION, validation.reason!);
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: targetPaymentStatus,
          verifiedAt: input.reviewStatus === PaymentProofReviewStatus.APPROVED ? new Date() : undefined,
          verifiedByUserId: actorUserId,
        },
      });

      const latestProof = payment.proofs[0];
      if (latestProof) {
        await tx.paymentProof.update({
          where: { id: latestProof.id },
          data: {
            reviewStatus: input.reviewStatus,
            reviewedAt: new Date(),
            reviewedByUserId: actorUserId,
            rejectionReason: input.rejectionReason,
          },
        });
      }

      const targetBookingStatus =
        input.reviewStatus === PaymentProofReviewStatus.APPROVED
          ? BookingStatus.CONFIRMED
          : BookingStatus.REJECTED;

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: targetBookingStatus,
          cancellationReason:
            input.reviewStatus === PaymentProofReviewStatus.REJECTED
              ? input.rejectionReason || 'رسید پرداخت توسط مدیریت رد شد'
              : undefined,
        },
      });

      return updatedPayment;
    });
  }
}
