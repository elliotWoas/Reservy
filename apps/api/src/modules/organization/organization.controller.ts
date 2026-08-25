import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CurrentOrgId, RequirePermission } from '../../core/decorators/auth.decorators';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permission } from '@reservy/domain';
import { UpdateOrganizationSchema, CardAccountSchema } from '@reservy/validation';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('current')
  async getCurrent(@CurrentOrgId() orgId: string) {
    const data = await this.organizationService.getCurrentOrganization(orgId);
    return { data };
  }

  @Patch('current')
  @RequirePermission(Permission.ORGANIZATION_UPDATE)
  async updateCurrent(@CurrentOrgId() orgId: string, @Body() body: unknown) {
    const validated = UpdateOrganizationSchema.parse(body);
    const data = await this.organizationService.updateOrganization(orgId, validated);
    return { data };
  }

  @Post('card-accounts')
  @RequirePermission(Permission.ORGANIZATION_UPDATE)
  async setCardAccount(@CurrentOrgId() orgId: string, @Body() body: unknown) {
    const validated = CardAccountSchema.parse(body);
    const data = await this.organizationService.setCardAccount(orgId, validated);
    return { data };
  }
}
