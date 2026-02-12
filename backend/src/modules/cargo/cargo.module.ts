import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargoController } from './cargo.controller';
import { CargoService } from './cargo.service';
import { Load } from '../../entities/load.entity';
import { User } from '../../entities/user.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Load, User]),
    EnhancedAuthModule,
  ],
  controllers: [CargoController],
  providers: [CargoService],
  exports: [CargoService],
})
export class CargoModule {}
