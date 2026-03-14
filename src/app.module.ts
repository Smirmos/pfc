import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { DrizzleModule } from './database/drizzle.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ImpulseModule } from './modules/impulse/impulse.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { DecisionsModule } from './modules/decisions/decisions.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    DrizzleModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    AnalysisModule,
    DashboardModule,
    ImpulseModule,
    ExtractionModule,
    DecisionsModule,
    MonitoringModule,
    BillingModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
