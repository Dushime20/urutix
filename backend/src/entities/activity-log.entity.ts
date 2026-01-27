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

@Entity('activity_logs')
@Index(['userId'])
@Index(['action'])
@Index(['resource', 'resourceId'])
@Index(['createdAt'])
@Index(['isSuspicious'], { where: 'is_suspicious = true' })
export class ActivityLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId: string;

    @Column({ type: 'varchar', length: 100 })
    action: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    resource: string;

    @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
    resourceId: string;

    @Column({ type: 'jsonb', nullable: true })
    details: Record<string, any>;

    @Column({ name: 'ip_address', type: 'inet', nullable: true })
    ipAddress: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string;

    @Column({ type: 'jsonb', nullable: true })
    location: {
        country?: string;
        city?: string;
        coordinates?: [number, number];
    };

    @Column({ name: 'is_suspicious', type: 'boolean', default: false })
    isSuspicious: boolean;

    @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
    sessionId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
