import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { LoggerMiddleware } from './core/middleware/logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingModule } from './modules/booking/booking.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CrmModule } from './modules/crm/crm.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { AdminModule } from './modules/admin/admin.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    PrismaModule,
    PublicModule,
    AuthModule,
    OrganizationModule,
    CatalogModule,
    AvailabilityModule,
    BookingModule,
    PaymentModule,
    CrmModule,
    ReportingModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
