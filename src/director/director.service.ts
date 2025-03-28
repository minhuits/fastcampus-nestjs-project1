import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@Injectable()
export class DirectorService {
  constructor(
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    private readonly prisma: PrismaService,
  ) { }

  create(createDirectorDto: CreateDirectorDto) {
    return this.prisma.director.create({ data: createDirectorDto });
  }

  findAll() {
    return this.prisma.director.findMany();
  }

  findOne(id: number) {
    return this.prisma.director.findUnique({
      where: {
        id,
      },
    })
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.prisma.director.findUnique({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    await this.prisma.director.update({
      where: {
        id,
      },
      data: {
        ...updateDirectorDto,
      }
    });

    const newDirector = await this.prisma.director.findUnique({
      where: {
        id
      },
    });

    return newDirector;
  }

  async remove(id: number) {
    const director = await this.prisma.director.findUnique({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    await this.prisma.director.delete({
      where: {
        id,
      }
    });

    return id;
  }
}
