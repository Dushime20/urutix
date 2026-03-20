import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultiModalShipment, MultiModalLeg } from './entities/multi-modal.entity';
import { Load } from '../../entities/load.entity';
import { MultiModalService } from './multi-modal.service';
import { MultiModalController } from './multi-modal.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MultiModalShipment, MultiModalLeg, Load]),
  ],
  controllers: [MultiModalController],
  providers: [MultiModalService],
  exports: [MultiModalService],
})
export class MultiModalModule {}
