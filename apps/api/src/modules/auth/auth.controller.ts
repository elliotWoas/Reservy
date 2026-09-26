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
    // Log registration request initiation
    console.log('[Auth] Incoming registration request');
    const validated = RegisterSchema.parse(body);
    console.log(`[Auth] Registration payload validated for: ${validated.email}`);
    const result = await this.authService.register(validated);
    console.log(`[Auth] User registered successfully: ${result.user.email} (${result.user.id})`);
    return { data: result };
  }

  @Post('login')
  async login(@Body() body: unknown) {
    // Log login attempt
    console.log('[Auth] Incoming login request');
    const validated = LoginSchema.parse(body);
    console.log(`[Auth] Login credentials validated for email: ${validated.email}`);
    const result = await this.authService.login(validated);
    console.log(`[Auth] User authenticated successfully: ${result.user.email}`);
    return { data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: UserContext, @CurrentOrgId() orgId?: string) {
    const result = await this.authService.getMe(user.userId, orgId);
    return { data: result };
  }
}
