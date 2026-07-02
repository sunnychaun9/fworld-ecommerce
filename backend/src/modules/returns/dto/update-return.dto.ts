import { IsIn, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export const RETURN_DECISION_STATUSES = ['APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'] as const;
export type ReturnDecisionStatus = (typeof RETURN_DECISION_STATUSES)[number];

/** Admin payload to advance a return through its lifecycle. */
export class UpdateReturnDto {
  @IsIn(RETURN_DECISION_STATUSES)
  status!: ReturnDecisionStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  decisionReason?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  refundAmount?: number;
}
