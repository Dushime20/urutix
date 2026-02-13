import { IsEnum, IsOptional } from 'class-validator';
import { AuditFilterDto } from './audit-filter.dto';

/**
 * ExportAuditDto
 * 
 * Data transfer object for exporting audit logs.
 * Extends AuditFilterDto with format specification.
 */
export class ExportAuditDto extends AuditFilterDto {
  @IsEnum(['csv', 'excel', 'json'])
  @IsOptional()
  format?: 'csv' | 'excel' | 'json';
}
