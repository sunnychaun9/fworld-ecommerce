import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

/** Any-version UUID (ids are app-generated UUID v7). */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Maximum rows accepted per import request. */
export const MAX_IMPORT_ROWS = 1000;

/** Per-row validation shape (validated programmatically, not by the global pipe). */
export class ImportProductRow {
  @IsString()
  @Length(1, 180)
  name!: string;

  @IsString()
  @Length(1, 200)
  slug!: string;

  @Matches(UUID_PATTERN, { message: 'categoryId must be a valid UUID' })
  categoryId!: string;

  @IsOptional()
  @Matches(UUID_PATTERN, { message: 'brandId must be a valid UUID' })
  brandId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  mrp!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice!: number;

  @IsOptional()
  @IsIn(['ACTIVE', 'DRAFT', 'ARCHIVED'])
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  variants?: unknown[];
}
