import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterApiSchema,
  ResetPasswordSchema,
} from '../schemas/auth.schema';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterApiInput,
  ResetPasswordInput,
} from '../schemas/auth.schema';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterApiSchema))
  register(@Body() data: RegisterApiInput) {
    return this.authService.register(data);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() data: LoginInput) {
    return this.authService.login(data);
  }

  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  forgotPassword(@Body() data: ForgotPasswordInput) {
    return this.authService.forgotPassword(data);
  }

  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  resetPassword(@Body() data: ResetPasswordInput) {
    return this.authService.resetPassword(data);
  }
}
