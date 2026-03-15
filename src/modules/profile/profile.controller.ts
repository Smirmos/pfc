import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { CreateExpenseItemDto } from './dto/create-expense-item.dto';
import { CreateIncomeItemDto } from './dto/create-income-item.dto';
import { UpdateExpenseItemDto } from './dto/update-expense-item.dto';
import { UpdateIncomeItemDto } from './dto/update-income-item.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { ProfileService } from './profile.service';

type AuthRequest = FastifyRequest & { user: { id: string } };

@Controller('me')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ── User ──────────────────────────────────────────────────────────

  @Get()
  getMe(@Req() req: AuthRequest) {
    return this.profileService.getMe(req.user.id);
  }

  @Patch()
  updateMe(@Req() req: AuthRequest, @Body() dto: UpdateUserDto) {
    return this.profileService.updateMe(req.user.id, dto);
  }

  // ── Profile settings ──────────────────────────────────────────────

  @Get('profile')
  getProfile(@Req() req: AuthRequest) {
    return this.profileService.getProfile(req.user.id);
  }

  @Put('profile')
  upsertProfile(@Req() req: AuthRequest, @Body() dto: UpsertProfileDto) {
    return this.profileService.upsertProfile(req.user.id, dto);
  }

  @Patch('profile')
  updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  // ── Summary ───────────────────────────────────────────────────────

  @Get('profile/summary')
  getProfileSummary(@Req() req: AuthRequest) {
    return this.profileService.getProfileSummary(req.user.id);
  }

  // ── Income items ──────────────────────────────────────────────────

  @Get('income-items')
  listIncomeItems(@Req() req: AuthRequest) {
    return this.profileService.listIncomeItems(req.user.id);
  }

  @Post('income-items')
  createIncomeItem(@Req() req: AuthRequest, @Body() dto: CreateIncomeItemDto) {
    return this.profileService.createIncomeItem(req.user.id, dto);
  }

  @Patch('income-items/:id')
  updateIncomeItem(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncomeItemDto,
  ) {
    return this.profileService.updateIncomeItem(req.user.id, id, dto);
  }

  @Delete('income-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteIncomeItem(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profileService.deleteIncomeItem(req.user.id, id);
  }

  // ── Expense items ─────────────────────────────────────────────────

  @Get('expense-items')
  listExpenseItems(@Req() req: AuthRequest) {
    return this.profileService.listExpenseItems(req.user.id);
  }

  @Post('expense-items')
  createExpenseItem(
    @Req() req: AuthRequest,
    @Body() dto: CreateExpenseItemDto,
  ) {
    return this.profileService.createExpenseItem(req.user.id, dto);
  }

  @Patch('expense-items/:id')
  updateExpenseItem(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseItemDto,
  ) {
    return this.profileService.updateExpenseItem(req.user.id, id, dto);
  }

  @Delete('expense-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExpenseItem(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profileService.deleteExpenseItem(req.user.id, id);
  }
}
