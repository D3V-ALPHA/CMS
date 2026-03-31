import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../../database/db';
import { lessons, courses } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonsService {
  async addLesson(courseId: string, teacherId: string, dto: CreateLessonDto) {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));
    if (!course) throw new NotFoundException('Course not found');
    if (course.teacherId !== teacherId)
      throw new ForbiddenException('Not your course');

    const [newLesson] = await db
      .insert(lessons)
      .values({
        courseId,
        title: dto.title,
        content: dto.content,
        order: dto.order,
      })
      .returning();
    return newLesson;
  }

  async reorderLessons(
    courseId: string,
    teacherId: string,
    updates: { lessonId: string; newOrder: number }[],
  ) {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));
    if (!course) throw new NotFoundException('Course not found');
    if (course.teacherId !== teacherId)
      throw new ForbiddenException('Not your course');

    await db.transaction(async (tx) => {
      // Step 1: temporarily shift all orders to a high number (avoid conflicts)
      for (const { lessonId, newOrder } of updates) {
        await tx
          .update(lessons)
          .set({ order: 1000 + newOrder }) // add a large offset
          .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));
      }
      // Step 2: set the final orders
      for (const { lessonId, newOrder } of updates) {
        await tx
          .update(lessons)
          .set({ order: newOrder })
          .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));
      }
    });
    return { success: true };
  }

  async getLessonsByCourse(courseId: string) {
    return db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order);
  }
}
