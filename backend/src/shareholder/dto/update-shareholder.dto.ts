import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateShareholderDto {
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
  @IsIn(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'])
  kycStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}
