import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { CurrentOrgId, RequirePermission } from '../../core/decorators/auth.decorators';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permission } from '@reservy/domain';

@Controller('reporting')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('summary')
  @RequirePermission(Permission.REPORTING_READ)
  async getSummary(@CurrentOrgId() orgId: string) {
    return await this.reportingService.getDashboardSummary(orgId);
  }

  @Get('performance')
  @RequirePermission(Permission.REPORTING_READ)
  async getPerformance(@CurrentOrgId() orgId: string) {
    return await this.reportingService.getPerformanceReports(orgId);
  }
}
