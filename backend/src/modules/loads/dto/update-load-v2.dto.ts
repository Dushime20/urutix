import { PartialType } from '@nestjs/swagger';
import { CreateLoadV2Dto } from './create-load-v2.dto';

export class UpdateLoadV2Dto extends PartialType(CreateLoadV2Dto) {}
