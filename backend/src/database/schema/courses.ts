import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),

  title: text('title').notNull(),
  description: text('description'),

  teacherId: uuid('teacher_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});
