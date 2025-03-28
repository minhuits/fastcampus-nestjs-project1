import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
// import { Director } from './entitiy/director.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Director, DirectorSchema } from './schema/director.schema';

@Module({
  imports: [
    // TypeOrmModule.forFeature([
    //   Director
    // ]),
    MongooseModule.forFeature([
      {
        name: Director.name,
        schema: DirectorSchema,
      }
    ]),
    CommonModule,
  ],
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule { }
