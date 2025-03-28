import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    private readonly prisma: PrismaService,
  ) { }

  async create(createGenreDto: CreateGenreDto) {
    return this.prisma.genre.create({
      data: createGenreDto
    });
  }

  findAll() {
    return this.prisma.genre.findMany();
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: {
        id,
      }
    })

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.prisma.genre.findUnique({
      where: {
        id,
      }
    })

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    await this.prisma.genre.update({
      where: {
        id
      },
      data: {
        ...updateGenreDto
      }
    });

    const newGenre = await this.prisma.genre.findUnique({
      where: {
        id,
      }
    });

    return newGenre;
  }

  async remove(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: {
        id,
      }
    })

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    await this.prisma.genre.delete({
      where: {
        id,
      }
    });

    return id;
  }
}
