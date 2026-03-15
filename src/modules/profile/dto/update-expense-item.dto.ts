import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { FREQUENCIES } from '../baseline-calculator';

export class UpdateExpenseItemDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  amountCents?: number;

  @IsString()
  @IsOptional()
  @IsIn(FREQUENCIES)
  frequency?: string;

  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;
}
