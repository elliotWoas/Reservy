import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CurrentOrgId, CurrentUser, RequirePermission } from '../../core/decorators/auth.decorators';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { BookingStatus, Permission } from '@reservy/domain';
import { DashboardCreateBookingSchema, UpdateBookingStatusSchema } from '@reservy/validation';
import type { UserContext } from '../../core/tenant-context';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    const booking = await this.bookingService.getBookingByToken(token);
    return { data: booking };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.BOOKING_READ)
  async getBookings(
    @CurrentOrgId() orgId: string,
    @Query('status') status?: BookingStatus,
    @Query('staffId') staffId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const result = await this.bookingService.getBookings(orgId, {
      status,
      staffId,
      startDate,
      endDate,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return result;
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.BOOKING_CREATE)
  async createManualBooking(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: UserContext,
    @Body() body: unknown
  ) {
    const validated = DashboardCreateBookingSchema.parse(body);
    const result = await this.bookingService.createBooking(orgId, validated, {
      actorUserId: user.userId,
      initialStatus: validated.status || BookingStatus.CONFIRMED,
    });
    return { data: result };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.BOOKING_READ)
  async getBookingById(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    const booking = await this.bookingService.getBookingById(orgId, id);
    return { data: booking };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.BOOKING_UPDATE)
  async updateStatus(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const validated = UpdateBookingStatusSchema.parse(body);
    const updated = await this.bookingService.updateBookingStatus(
      orgId,
      id,
      validated,
      user.userId
    );
    return { data: updated };
  }
}
