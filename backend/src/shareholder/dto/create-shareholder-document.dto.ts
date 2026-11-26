import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateShareholderDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  documentName!: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  documentUrl?: string;
}
