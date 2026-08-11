import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToMany,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
@Index(['category'])
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Canonical code: resource:action (required on production schema) */
    @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
    name?: string;

    @Column({ type: 'varchar', length: 100 })
    resource: string;

    @Column({ type: 'varchar', length: 100 })
    action: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    category: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[];
}
