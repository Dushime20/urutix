import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum MessageRole {
  DRIVER = 'DRIVER',
  SHIPPER = 'SHIPPER',
  CARGO_OWNER = 'CARGO_OWNER',
  TRUCK_OWNER = 'TRUCK_OWNER',
  DISPATCH = 'DISPATCH',
  SYSTEM = 'SYSTEM',
}

@Entity('messages')
@Index(['senderId', 'recipientId'])
@Index(['threadId'])
@Index(['createdAt'])
@Index(['isRead'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'thread_id', type: 'varchar', length: 255 })
  threadId: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    name: 'sender_role',
    type: 'enum',
    enum: MessageRole,
    default: MessageRole.SYSTEM,
  })
  senderRole: MessageRole;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'trip_id', type: 'uuid', nullable: true })
  tripId?: string;

  @Column({ name: 'load_id', type: 'uuid', nullable: true })
  loadId?: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;
}
