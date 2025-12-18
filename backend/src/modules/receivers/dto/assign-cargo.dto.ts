import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignCargoDto {
  @IsNotEmpty()
  @IsUUID()
  receiverId: string;
}

