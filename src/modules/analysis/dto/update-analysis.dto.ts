import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAnalysisDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
