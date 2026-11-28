import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateShareholderDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(120)
  tenantName!: string;

  @IsOptional()
  @IsString()
  contactNo?: string | null;

  @IsOptional()
  @IsString()
  tinNumber?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfShares?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shareValue?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalContribution?: number;

  @IsOptional()
  @IsDateString()
  datePaid?: string | null;

  @IsOptional()
  @IsString()
  remarks?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  shareClass?: string;

  @IsOptional()
  @IsBoolean()
  isAccredited?: boolean;

  @IsOptional()
  @IsIn(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'])
  kycStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}
