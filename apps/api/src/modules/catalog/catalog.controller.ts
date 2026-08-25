import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CurrentOrgId, RequirePermission } from '../../core/decorators/auth.decorators';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permission } from '@reservy/domain';
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  CreateServiceCategorySchema,
  CreateStaffSchema,
  UpdateStaffSchema,
} from '@reservy/validation';

@Controller('catalog')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // Services
  @Get('services')
  async getServices(@CurrentOrgId() orgId: string) {
    const data = await this.catalogService.getServices(orgId);
    return { data };
  }

  @Post('services')
  @RequirePermission(Permission.SERVICE_CREATE)
  async createService(@CurrentOrgId() orgId: string, @Body() body: unknown) {
    const validated = CreateServiceSchema.parse(body);
    const data = await this.catalogService.createService(orgId, validated);
    return { data };
  }

  @Patch('services/:id')
  @RequirePermission(Permission.SERVICE_UPDATE)
  async updateService(
    @CurrentOrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const validated = UpdateServiceSchema.parse(body);
    const data = await this.catalogService.updateService(orgId, id, validated);
    return { data };
  }

  @Delete('services/:id')
  @RequirePermission(Permission.SERVICE_DELETE)
  async deleteService(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    const data = await this.catalogService.deleteService(orgId, id);
    return { data };
  }

  // Categories
  @Get('categories')
  async getCategories(@CurrentOrgId() orgId: string) {
    const data = await this.catalogService.getCategories(orgId);
    return { data };
  }

  @Post('categories')
  @RequirePermission(Permission.SERVICE_CREATE)
  async createCategory(@CurrentOrgId() orgId: string, @Body() body: unknown) {
    const validated = CreateServiceCategorySchema.parse(body);
    const data = await this.catalogService.createCategory(orgId, validated);
    return { data };
  }

  // Staff
  @Get('staff')
  async getStaff(@CurrentOrgId() orgId: string) {
    const data = await this.catalogService.getStaff(orgId);
    return { data };
  }

  @Post('staff')
  @RequirePermission(Permission.STAFF_CREATE)
  async createStaff(@CurrentOrgId() orgId: string, @Body() body: unknown) {
    const validated = CreateStaffSchema.parse(body);
    const data = await this.catalogService.createStaff(orgId, validated);
    return { data };
  }

  @Patch('staff/:id')
  @RequirePermission(Permission.STAFF_UPDATE)
  async updateStaff(
    @CurrentOrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const validated = UpdateStaffSchema.parse(body);
    const data = await this.catalogService.updateStaff(orgId, id, validated);
    return { data };
  }
}
