import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    studentId: uuid('student_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),

    enrolledAt: timestamp('enrolled_at').defaultNow(),
  },
  (table) => ({
    uniqueEnrollment: uniqueIndex('unique_student_course').on(
      table.studentId,
      table.courseId,
    ),
  }),
);
