import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { CurrentOrgId, RequirePermission } from '../../core/decorators/auth.decorators';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permission } from '@reservy/domain';
import { UpdateCustomerNotesSchema } from '@reservy/validation';

@Controller('crm')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  @RequirePermission(Permission.CUSTOMER_READ)
  async getCustomers(
    @CurrentOrgId() orgId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return await this.crmService.getCustomers(orgId, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch(':id/notes')
  @RequirePermission(Permission.CUSTOMER_UPDATE)
  async updateNotes(
    @CurrentOrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const validated = UpdateCustomerNotesSchema.parse(body);
    const data = await this.crmService.updateCustomerNotes(orgId, id, validated);
    return { data };
  }
}
