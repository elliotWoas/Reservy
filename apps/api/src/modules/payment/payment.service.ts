import { prisma } from '@reservy/database';
import {
  BookingStatus,
  PaymentStatus,
  PaymentProofReviewStatus,
  DomainError,
  DomainErrorCode,
} from '@reservy/domain';
import { SubmitPaymentProofInput, VerifyPaymentProofInput } from '@reservy/validation';
import { notificationService } from '../../core/notifications/notification.service';
import { auditService } from '../../core/audit/audit.service';

export class PaymentService {
  /**
   * Customer submits a card-to-card receipt proof.
   */
  async submitPaymentProof(input: SubmitPaymentProofInput) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { organization: true, customer: true },
    });

    if (!booking) {
      throw new DomainError(DomainErrorCode.BOOKING_NOT_FOUND, 'رزرو یافت نشد');
    }

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) {
      throw new DomainError(DomainErrorCode.PAYMENT_ALREADY_VERIFIED, 'این رزرو قبلاً تایید شده است');
    }

    return await prisma.$transaction(async (tx) => {
      // Find or create pending payment for this booking
      let payment = await tx.payment.findFirst({
        where: { bookingId: booking.id },
      });

      if (!payment) {
        payment = await tx.payment.create({
          data: {
            organizationId: booking.organizationId,
            bookingId: booking.id,
            amount: input.amount,
            currency: booking.currency,
            status: PaymentStatus.PROOF_SUBMITTED,
            referenceNumber: input.referenceNumber || null,
          },
        });
      } else {
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PROOF_SUBMITTED,
            referenceNumber: input.referenceNumber || payment.referenceNumber,
          },
        });
      }

      // Create Payment Proof record
      const proof = await tx.paymentProof.create({
        data: {
          paymentId: payment.id,
          fileUrl: input.fileUrl,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          reviewStatus: PaymentProofReviewStatus.PENDING,
        },
      });

      // Update Booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PAYMENT_SUBMITTED },
      });

      // Send owner notification
      await notificationService.onPaymentSubmitted({
        orgOwnerPhone: booking.organization.phone || undefined,
        bookingCode: booking.code,
        amount: input.amount,
      });

      return {
        paymentId: payment.id,
        proofId: proof.id,
        status: payment.status,
      };
    });
  }

  /**
   * Admin lists payments for review/audit.
   */
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
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: orgId,
    };

    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              customer: true,
              service: true,
              staff: true,
            },
          },
          proofs: {
            orderBy: { uploadedAt: 'desc' },
          },
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

  /**
   * Admin approves or rejects a payment proof.
   */
  async verifyPayment(
    orgId: string,
    paymentId: string,
    input: VerifyPaymentProofInput,
    actorUserId?: string
  ) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, organizationId: orgId },
      include: {
        booking: { include: { customer: true } },
        proofs: { orderBy: { uploadedAt: 'desc' }, take: 1 },
      },
    });

    if (!payment) {
      throw new DomainError(DomainErrorCode.PAYMENT_NOT_FOUND, 'پرداخت مورد نظر یافت نشد');
    }

    const isApproved = input.reviewStatus === PaymentProofReviewStatus.APPROVED;

    if (!isApproved && !input.rejectionReason) {
      throw new DomainError(DomainErrorCode.INVALID_INPUT, 'در صورت رد پرداخت، ذکر دلیل رد الزامی است');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update Payment Proof
      if (payment.proofs.length > 0) {
        await tx.paymentProof.update({
          where: { id: payment.proofs[0].id },
          data: {
            reviewStatus: input.reviewStatus,
            reviewedAt: new Date(),
            reviewedByUserId: actorUserId || null,
            rejectionReason: input.rejectionReason || null,
          },
        });
      }

      // 2. Update Payment
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: isApproved ? PaymentStatus.VERIFIED : PaymentStatus.REJECTED,
          verifiedAt: isApproved ? new Date() : null,
          verifiedByUserId: isApproved ? actorUserId : null,
        },
      });

      // 3. Synchronize Booking State
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: isApproved ? BookingStatus.CONFIRMED : BookingStatus.REJECTED,
          cancellationReason: !isApproved ? input.rejectionReason : null,
        },
      });

      // 4. Audit Log
      await auditService.log({
        organizationId: orgId,
        actorUserId,
        action: isApproved ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED',
        entityType: 'Payment',
        entityId: paymentId,
        metadata: {
          bookingId: payment.bookingId,
          amount: payment.amount,
          rejectionReason: input.rejectionReason,
        },
      });

      // 5. Notify Customer if approved
      if (isApproved) {
        await notificationService.onPaymentVerified({
          customerPhone: payment.booking.customer.phone,
          customerName: payment.booking.customer.fullName,
          bookingCode: payment.booking.code,
        });
      }

      return updatedPayment;
    });
  }
}

export const paymentService = new PaymentService();
