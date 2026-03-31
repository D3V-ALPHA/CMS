import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { courses } from './courses';

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),

    title: text('title').notNull(),
    content: text('content'),

    order: integer('order').notNull(),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    uniqueOrder: uniqueIndex('unique_course_order').on(
      table.courseId,
      table.order,
    ),
  }),
);
