import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { Director } from './entitiy/director.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Director
    ]),
    CommonModule,
  ],
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule { }
