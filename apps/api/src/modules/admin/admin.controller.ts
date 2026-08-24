import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RequireSuperAdmin } from '../../core/decorators/auth.decorators';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequireSuperAdmin()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getOverview() {
    return await this.adminService.getPlatformOverview();
  }

  @Patch('organizations/:id/status')
  async updateOrgStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED'
  ) {
    const updated = await this.adminService.updateOrganizationStatus(id, status);
    return { data: updated };
  }
}
