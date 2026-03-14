import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: config.get<string>('app.GOOGLE_CLIENT_ID', 'not-configured'),
      clientSecret: config.get<string>(
        'app.GOOGLE_CLIENT_SECRET',
        'not-configured',
      ),
      callbackURL: config.get<string>(
        'app.GOOGLE_CALLBACK_URL',
        'http://localhost:3000/api/v1/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string; verified: boolean }[];
      name?: { givenName?: string; familyName?: string };
    },
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email provided by Google'), undefined);
    }

    let user = await this.usersService.findByGoogleId(profile.id);
    if (!user) {
      user = await this.usersService.findByEmail(email);
      if (user) {
        await this.usersService.updateGoogleId(user.id, profile.id);
      } else {
        user = await this.usersService.create({
          email,
          googleId: profile.id,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          emailVerified: true,
        });
      }
    }

    done(null, user);
  }
}
