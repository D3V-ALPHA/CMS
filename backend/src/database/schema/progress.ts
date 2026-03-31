import {
  pgTable,
  uuid,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { lessons } from './lessons';

export const progress = pgTable(
  'progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    studentId: uuid('student_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    lessonId: uuid('lesson_id')
      .references(() => lessons.id, { onDelete: 'cascade' })
      .notNull(),

    completed: boolean('completed').default(false),

    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    uniqueProgress: uniqueIndex('unique_student_lesson').on(
      table.studentId,
      table.lessonId,
    ),
  }),
);
