/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../../database/db';
import { enrollments, courses, users } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { WsService } from '../ws/ws.service';

@Injectable()
export class EnrollmentsService {
  constructor(private wsService: WsService) {}

  async enroll(studentId: string, courseId: string) {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));
    if (!course) throw new BadRequestException('Course not found');

    const [existing] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId),
        ),
      );
    if (existing) throw new BadRequestException('Already enrolled');

    const [enrollment] = await db
      .insert(enrollments)
      .values({
        studentId,
        courseId,
      })
      .returning();

    // Emit WebSocket event
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId));
    const message = `${student.email} enrolled in ${course.title}`;
    await this.wsService.emitActivity({
      type: 'enrollment',
      message,
      timestamp: new Date().toISOString(),
    });

    return enrollment;
  }

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId),
        ),
      );
    return !!enrollment;
  }

  async getStudentCourses(studentId: string) {
    return db
      .select()
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.studentId, studentId));
  }
}
