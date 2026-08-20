export interface SendSmsParams {
  to: string; // e.g. 09123456789
  template: string;
  params: Record<string, string | number>;
}

export interface ISmsProvider {
  sendSms(params: SendSmsParams): Promise<boolean>;
}

export class MockSmsProvider implements ISmsProvider {
  async sendSms(params: SendSmsParams): Promise<boolean> {
    console.log(`[SMS MOCK] Sending SMS to ${params.to} using template "${params.template}":`, params.params);
    return true;
  }
}

export class NotificationService {
  private smsProvider: ISmsProvider;

  constructor(smsProvider?: ISmsProvider) {
    this.smsProvider = smsProvider || new MockSmsProvider();
  }

  async onBookingCreated(params: { customerName: string; phone: string; serviceName: string; startAt: string; code: string }) {
    await this.smsProvider.sendSms({
      to: params.phone,
      template: 'booking_created',
      params: {
        customerName: params.customerName,
        service: params.serviceName,
        time: params.startAt,
        code: params.code,
      },
    });
  }

  async onPaymentSubmitted(params: { orgOwnerPhone?: string; bookingCode: string; amount: number }) {
    if (params.orgOwnerPhone) {
      await this.smsProvider.sendSms({
        to: params.orgOwnerPhone,
        template: 'payment_submitted_owner',
        params: {
          code: params.bookingCode,
          amount: params.amount,
        },
      });
    }
  }

  async onPaymentVerified(params: { customerPhone: string; customerName: string; bookingCode: string }) {
    await this.smsProvider.sendSms({
      to: params.customerPhone,
      template: 'payment_verified_customer',
      params: {
        customerName: params.customerName,
        code: params.bookingCode,
      },
    });
  }
}

export const notificationService = new NotificationService();
