/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { ReorderLessonDto } from './dto/reorder-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('courses/:courseId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  // ✅ GET /courses/:courseId/lessons — was missing, caused the 404
  @Get()
  async getLessons(@Param('courseId') courseId: string) {
    return this.lessonsService.getLessonsByCourse(courseId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('teacher')
  async addLesson(
    @Param('courseId') courseId: string,
    @Req() req: any,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.addLesson(courseId, req.user.userId, dto);
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  async reorderLessons(
    @Param('courseId') courseId: string,
    @Req() req: any,
    @Body() updates: ReorderLessonDto[],
  ) {
    return this.lessonsService.reorderLessons(
      courseId,
      req.user.userId,
      updates,
    );
  }
}
