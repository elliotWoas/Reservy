import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RegisterSchema, LoginSchema } from '@reservy/validation';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentOrgId, CurrentUser } from '../../core/decorators/auth.decorators';
import type { UserContext } from '../../core/tenant-context';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown) {
    const validated = RegisterSchema.parse(body);
    const result = await this.authService.register(validated);
    return { data: result };
  }

  @Post('login')
  async login(@Body() body: unknown) {
    const validated = LoginSchema.parse(body);
    const result = await this.authService.login(validated);
    return { data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: UserContext, @CurrentOrgId() orgId?: string) {
    const result = await this.authService.getMe(user.userId, orgId);
    return { data: result };
  }
}
