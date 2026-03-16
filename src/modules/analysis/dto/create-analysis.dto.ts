import { IsIn, IsString, MaxLength } from 'class-validator';

export const ANALYSIS_CATEGORIES = [
  'vehicle',
  'home',
  'appliance',
  'other',
] as const;

export class CreateAnalysisDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsIn(ANALYSIS_CATEGORIES)
  category!: string;
}
