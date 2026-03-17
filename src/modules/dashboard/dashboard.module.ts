import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ProfileModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
