import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  email: text('email').notNull().unique(),

  passwordHash: text('password_hash').notNull(),

  role: text('role', {
    enum: ['teacher', 'student'],
  }).notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});
