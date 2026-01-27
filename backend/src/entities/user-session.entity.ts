import {
    Entity,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
@Index(['userId'])
@Index(['expiresAt'])
export class UserSession {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'ip_address', type: 'inet', nullable: true })
    ipAddress: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string;

    @Column({ name: 'device_info', type: 'jsonb', nullable: true })
    deviceInfo: {
        browser?: string;
        os?: string;
        device?: string;
        isMobile?: boolean;
    };

    @Column({ type: 'jsonb', nullable: true })
    location: {
        country?: string;
        city?: string;
        coordinates?: [number, number];
    };

    @Column({ name: 'last_activity', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastActivity: Date;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
