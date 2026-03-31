import { IsOptional, IsUUID } from 'class-validator';

export class ProgressQueryDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;
}
