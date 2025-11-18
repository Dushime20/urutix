import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('refresh_tokens')
@Index(['token'], { unique: true })
@Index(['userId', 'revoked', 'expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ unique: true })
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column({ nullable: true })
  revokedAt?: Date;

  @Column({ nullable: true })
  revokedBy?: string;

  @CreateDateColumn()
  createdAt: Date;
}
