import { Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

const providers: Provider[] = [
  AuthService,
  JwtStrategy,
  { provide: APP_GUARD, useClass: JwtAuthGuard },
];

if (process.env['GOOGLE_CLIENT_ID']) {
  providers.push(GoogleStrategy);
}

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers,
  exports: [AuthService],
})
export class AuthModule {}
