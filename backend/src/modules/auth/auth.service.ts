/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { db } from '../../database/db';
import { users } from '../../database/schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { redis } from '../../config/redis';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(email: string, password: string, role: 'teacher' | 'student') {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existing.length)
      throw new UnauthorizedException('Email already exists');

    const hashed = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash: hashed, role })
      .returning();

    return { id: user.id, email: user.email, role: user.role };
  }

  async validateUser(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, role: user.role };

    // Use the JwtService without extra options – they are already set in the module
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    await redis.set(
      `refresh_token:${refreshToken}`,
      user.id,
      'EX',
      7 * 24 * 60 * 60,
    );

    return { accessToken, refreshToken };
  }

  async refreshToken(oldToken: string) {
    const userId = await redis.get(`refresh_token:${oldToken}`);
    if (!userId) throw new UnauthorizedException('Invalid refresh token');

    await redis.del(`refresh_token:${oldToken}`);
    const newToken = uuidv4();
    await redis.set(
      `refresh_token:${newToken}`,
      userId,
      'EX',
      7 * 24 * 60 * 60,
    );

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, refreshToken: newToken };
  }
}
