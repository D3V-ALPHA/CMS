import { Injectable } from '@nestjs/common';
import { db } from '../../database/db';
import { courses, enrollments, lessons, users } from '../../database/schema';
import { ilike, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

@Injectable()
export class CoursesService {
  async createCourse(
    teacherId: string,
    dto: { title: string; description?: string },
  ) {
    const [newCourse] = await db
      .insert(courses)
      .values({
        title: dto.title,
        description: dto.description,
        teacherId,
      })
      .returning();
    return newCourse;
  }

  async listCourses(filter?: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const offset = (page - 1) * limit;

    const baseQuery = db.select().from(courses);
    const filteredQuery = filter?.search
      ? baseQuery.where(ilike(courses.title, `%${filter.search}%`))
      : baseQuery;

    const data = await filteredQuery.limit(limit).offset(offset);

    // ✅ Also return teacherEmail on each course for the student dashboard card
    const enriched = await Promise.all(
      data.map(async (course) => {
        const [teacher] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, course.teacherId));

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));

        return {
          ...course,
          teacherEmail: teacher?.email ?? null,
          students: Number(count),
        };
      }),
    );

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(courses);

    return { data: enriched, total: Number(count) };
  }

  async getTeacherDashboard(teacherId: string) {
    const teacherCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.teacherId, teacherId));

    const result: {
      courseId: string;
      title: string;
      enrolledCount: number;
      lessons: {
        id: string;
        title: string;
        content: string | null;
        order: number;
      }[];
    }[] = [];

    for (const course of teacherCourses) {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .where(eq(enrollments.courseId, course.id));

      // ✅ Include lessons so teacher dashboard can render and reorder them
      const courseLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, course.id))
        .orderBy(lessons.order);

      result.push({
        courseId: course.id,
        title: course.title,
        enrolledCount: Number(countResult.count),
        lessons: courseLessons,
      });
    }

    return result;
  }
}
