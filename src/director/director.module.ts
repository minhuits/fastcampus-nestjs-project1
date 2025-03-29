import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { Director, DirectorSchema } from './schema/director.schema';

@Module({
  imports: [
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
