/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Patch,
  Get,
  Param,
  UseGuards,
  Req,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProgressQueryDto } from './dto/progress-query.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Patch('lessons/:lessonId/complete')
  @UseGuards(RolesGuard)
  @Roles('student')
  async completeLesson(@Param('lessonId') lessonId: string, @Req() req: any) {
    return this.progressService.completeLesson(req.user.userId, lessonId);
  }

  // ✅ All /students/me/* routes MUST stay above /students/:id/*
  // NestJS matches top-to-bottom — if /:id comes first, "me" is treated as an ID

  @Get('students/me/progress')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getMyProgress(@Req() req: any, @Query('courseId') courseId?: string) {
    return this.progressService.getStudentProgress(req.user.userId, courseId);
  }

  // ✅ New route: returns which lesson IDs a student has completed in a course
  // Used by CourseModal to render per-lesson completed state
  @Get('students/me/completed-lessons')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getMyCompletedLessons(
    @Req() req: any,
    @Query('courseId') courseId: string,
  ) {
    return this.progressService.getCompletedLessonIds(
      req.user.userId,
      courseId,
    );
  }

  // ✅ Dynamic :id routes come LAST — after all static /me routes
  @Get('students/:id/progress')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getStudentProgress(
    @Param('id') studentId: string,
    @Req() req: any,
    @Query() query: ProgressQueryDto,
  ) {
    if (req.user.userId !== studentId)
      throw new ForbiddenException('Access denied');
    return this.progressService.getStudentProgress(studentId, query.courseId);
  }
}
