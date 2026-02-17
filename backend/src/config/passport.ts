import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { config } from './env';

if (config.googleClientId && config.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: `${config.apiUrl}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || 'Gebruiker';

          if (!email) {
            return done(new Error('Geen e-mailadres van Google ontvangen'), undefined);
          }

          let user = await prisma.user.findUnique({
            where: { email },
            include: { customer: true, technician: true },
          });

          if (user) {
            return done(null, { user, isNew: false });
          }

          const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
          user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              role: 'CUSTOMER',
            },
          });

          await prisma.customer.create({
            data: {
              userId: user.id,
              companyName: name,
              contactName: name,
              email,
              phone: '',
              address: '',
              emailVerified: true,
            },
          });

          const userWithRelations = await prisma.user.findUnique({
            where: { id: newUser.id },
            include: { customer: true, technician: true },
          });
          return done(null, { user: userWithRelations!, isNew: true });
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}

passport.serializeUser((obj: any, done) => {
  done(null, obj?.user?.id ?? obj?.id ?? obj);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { customer: true, technician: true },
    });
    done(null, user);
  } catch (err) {
    done(err as Error, null);
  }
});
