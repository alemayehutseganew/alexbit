import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContactSchema } from '@primehorizon/domain/contact-schema';
import type { ContactInput } from '@primehorizon/domain/contact-schema';
import { ZodValidationPipe } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContactService } from './contact.service';

@Controller('api/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ContactSchema))
  createMessage(@Body() data: ContactInput) {
    return this.contactService.createMessage(data);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAllAdmin() {
    return this.contactService.findAllAdmin();
  }
}
