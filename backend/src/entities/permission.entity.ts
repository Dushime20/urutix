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

    @Column({ type: 'varchar', length: 100 })
    resource: string;

    @Column({ type: 'varchar', length: 50 })
    action: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    category: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[];
}
