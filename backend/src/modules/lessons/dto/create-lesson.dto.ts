/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsUUID, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  @Min(0)
  order: number;
}
