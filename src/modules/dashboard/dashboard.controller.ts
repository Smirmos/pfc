import { Controller, Get, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { DashboardService } from './dashboard.service';

type AuthRequest = FastifyRequest & { user: { id: string } };

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() req: AuthRequest) {
    return this.dashboardService.getDashboard(req.user.id);
  }
}
