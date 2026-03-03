import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('system_settings')
@Index(['category'])
@Index(['isPublic'], { where: 'is_public = true' })
export class SystemSettings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50 })
    category: string;

    @Column({ type: 'varchar', length: 100 })
    key: string;

    @Column({ type: 'jsonb' })
    value: any;

    @Column({ name: 'data_type', type: 'varchar', length: 20 })
    dataType: 'string' | 'number' | 'boolean' | 'json';

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'is_public', type: 'boolean', default: false })
    isPublic: boolean;

    @Column({ name: 'updated_by', type: 'uuid', nullable: true })
    updatedBy: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'updated_by' })
    updatedByUser: User;
}
