import { IsUUID, IsInt, Min } from 'class-validator';

export class ReorderLessonDto {
  @IsUUID()
  lessonId: string;

  @IsInt()
  @Min(0)
  newOrder: number;
}
