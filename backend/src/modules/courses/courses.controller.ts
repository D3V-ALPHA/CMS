/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('teacher')
  async createCourse(@Req() req: any, @Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(req.user.userId, dto);
  }

  @Get()
  async listCourses(@Query() filter: CourseFilterDto) {
    return this.coursesService.listCourses(filter);
  }

  @Get('teacher/dashboard')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  async getTeacherDashboard(@Req() req: any) {
    return this.coursesService.getTeacherDashboard(req.user.userId);
  }
}
