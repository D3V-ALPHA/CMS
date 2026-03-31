import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../../database/db';
import {
  progress,
  lessons,
  enrollments,
  courses,
  users,
} from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { WsService } from '../ws/ws.service';

@Injectable()
export class ProgressService {
  constructor(private wsService: WsService) {}

  async completeLesson(studentId: string, lessonId: string) {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId));
    if (!lesson) throw new BadRequestException('Lesson not found');

    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, lesson.courseId),
        ),
      );
    if (!enrollment)
      throw new ForbiddenException('Not enrolled in this course');

    // Check if already completed
    const [existing] = await db
      .select()
      .from(progress)
      .where(
        and(eq(progress.studentId, studentId), eq(progress.lessonId, lessonId)),
      );
    if (existing?.completed) return { alreadyCompleted: true };

    // Upsert (insert or update)
    const [record] = await db
      .insert(progress)
      .values({
        studentId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [progress.studentId, progress.lessonId],
        set: { completed: true, completedAt: new Date() },
      })
      .returning();

    // Emit WebSocket event with progress percentage
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, lesson.courseId));
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId));

    // Compute current progress percentage for this course
    const progressData = await this.getCourseProgress(studentId, course.id);
    const message = `${student.email} completed "${lesson.title}" in ${course.title} (${Math.round(progressData.completionPercentage)}% complete)`;

    await this.wsService.emitActivity({
      type: 'completion',
      message,
      timestamp: new Date().toISOString(),
    });

    return record;
  }

  // Helper: progress for a specific course
  // ✅ Fixed: filters completed lessons to only those belonging to this course
  // This prevents completedIds.size from counting lessons from OTHER courses,
  // which was causing percentages above 100%
  private async getCourseProgress(studentId: string, courseId: string) {
    const lessonsInCourse = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    const lessonIds = new Set(lessonsInCourse.map((l) => l.id));

    const allCompleted = await db
      .select()
      .from(progress)
      .where(
        and(eq(progress.studentId, studentId), eq(progress.completed, true)),
      );

    // ✅ Only count completed lessons that actually belong to this course
    const completedInThisCourse = allCompleted.filter((p) =>
      lessonIds.has(p.lessonId),
    );

    const completionPercentage =
      lessonIds.size === 0
        ? 0
        : (completedInThisCourse.length / lessonIds.size) * 100;

    return {
      completionPercentage,
      completedCount: completedInThisCourse.length,
      totalLessons: lessonIds.size,
    };
  }

  async getStudentProgress(studentId: string, courseId?: string) {
    if (courseId) {
      return this.getCourseProgress(studentId, courseId);
    } else {
      const enrolledCourses = await db
        .select()
        .from(enrollments)
        .innerJoin(courses, eq(courses.id, enrollments.courseId))
        .where(eq(enrollments.studentId, studentId));

      const result: {
        courseId: string;
        courseTitle: string;
        completionPercentage: number;
        completedCount: number;
        totalLessons: number;
      }[] = [];

      for (const { courses: course } of enrolledCourses) {
        const progressData = await this.getCourseProgress(studentId, course.id);
        result.push({
          courseId: course.id,
          courseTitle: course.title,
          ...progressData,
        });
      }
      return result;
    }
  }

  // ✅ New method: returns completed lesson IDs scoped to a specific course
  // Used by CourseModal to know which individual lessons to mark as done
  async getCompletedLessonIds(studentId: string, courseId: string) {
    const lessonsInCourse = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    const lessonIds = lessonsInCourse.map((l) => l.id);

    const allCompleted = await db
      .select()
      .from(progress)
      .where(
        and(eq(progress.studentId, studentId), eq(progress.completed, true)),
      );

    // Only return IDs that belong to this course
    const completedLessonIds = allCompleted
      .map((p) => p.lessonId)
      .filter((id) => lessonIds.includes(id));

    return { completedLessonIds };
  }
}
