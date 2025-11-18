import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Route } from './route.entity';

@Entity('route_trucks')
@Unique(['tenantId', 'routeId', 'truckId'])
@Index(['tenantId', 'createdAt'])
export class RouteTruck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  routeId: string;

  @Column('uuid')
  truckId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Route, (route) => route.routeTrucks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: Route;
}
