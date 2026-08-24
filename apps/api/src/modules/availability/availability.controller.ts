import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import {
  AvailabilityQuerySchema,
  SetStaffScheduleSchema,
  CreateBlockedPeriodSchema,
} from '@reservy/validation';
import { Permission } from '@reservy/domain';
import { CurrentOrgId, RequirePermission } from '../../core/decorators/auth.decorators';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('slots')
  async getSlots(
    @Query('organizationId') queryOrgId: string,
    @Headers('x-organization-id') headerOrgId: string,
    @Query('serviceId') serviceId: string,
    @Query('staffId') staffId: string,
    @Query('locationId') locationId: string,
    @Query('date') date: string
  ) {
    const orgId = queryOrgId || headerOrgId;
    if (!orgId) {
      throw new BadRequestException({ error: { code: 'INVALID_INPUT', message: 'organizationId الزامی است' } });
    }
    const validated = AvailabilityQuerySchema.parse({
      serviceId,
      staffId: staffId || undefined,
      locationId: locationId || undefined,
      date,
    });

    const slots = await this.availabilityService.getAvailableSlots(orgId, validated);
    return { data: slots };
  }

  @Get('staff/:staffId/schedule')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async getSchedule(@CurrentOrgId() orgId: string, @Param('staffId') staffId: string) {
    const schedules = await this.availabilityService.getStaffSchedule(orgId, staffId);
    return { data: schedules };
  }

  @Put('staff/:staffId/schedule')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.STAFF_MANAGE)
  async setSchedule(
    @CurrentOrgId() orgId: string,
    @Param('staffId') staffId: string,
    @Body() body: unknown
  ) {
    const validated = SetStaffScheduleSchema.parse(body);
    const result = await this.availabilityService.setStaffSchedule(orgId, {
      staffId,
      schedules: validated.schedules,
    });
    return { data: result };
  }

  @Get('blocked-periods')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async getBlockedPeriods(@CurrentOrgId() orgId: string, @Query('staffId') staffId?: string) {
    const periods = await this.availabilityService.getBlockedPeriods(orgId, staffId);
    return { data: periods };
  }

  @Post('blocked-periods')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.STAFF_MANAGE)
  async createBlockedPeriod(@CurrentOrgId() orgId: string, @Body() body: unknown) {
    const validated = CreateBlockedPeriodSchema.parse(body);
    const created = await this.availabilityService.createBlockedPeriod(orgId, validated);
    return { data: created };
  }

  @Delete('blocked-periods/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(Permission.STAFF_MANAGE)
  async deleteBlockedPeriod(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    await this.availabilityService.deleteBlockedPeriod(orgId, id);
    return { success: true };
  }
}
