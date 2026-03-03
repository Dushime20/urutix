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
import { Permission } from './permission.entity';

@Entity('user_permission_overrides')
@Index(['userId'])
@Index(['expiresAt'], { where: 'expires_at IS NOT NULL' })
export class UserPermissionOverride {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'permission_id', type: 'uuid' })
    permissionId: string;

    @Column({ type: 'boolean' })
    granted: boolean;

    @Column({ type: 'text', nullable: true })
    reason: string;

    @Column({ name: 'granted_by', type: 'uuid', nullable: true })
    grantedBy: string;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'granted_by' })
    grantedByUser: User;
}
