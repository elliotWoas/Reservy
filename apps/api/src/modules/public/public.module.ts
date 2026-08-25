import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { AvailabilityModule } from '../availability/availability.module';
import { BookingModule } from '../booking/booking.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [AvailabilityModule, BookingModule, PaymentModule],
  controllers: [PublicController],
})
export class PublicModule {}
