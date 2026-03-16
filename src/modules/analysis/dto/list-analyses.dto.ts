import { IsIn, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ANALYSIS_CATEGORIES } from './create-analysis.dto';

const FILTER_STATUSES = ['active', 'inactive'] as const;

export class ListAnalysesDto {
  @IsOptional()
  @IsString()
  @IsIn(ANALYSIS_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(FILTER_STATUSES)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
