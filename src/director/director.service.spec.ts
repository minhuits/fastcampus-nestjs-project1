import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { Director } from './entitiy/director.entity';

const mockDirectorRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(getRepositoryToken(Director));
  });

  beforeAll(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new director', async () => {
      const createDirectorDto = { name: 'Director 1' };
      jest.spyOn(mockDirectorRepository, 'save').mockResolvedValue(createDirectorDto);

      const result = await directorService.create(createDirectorDto as CreateDirectorDto);

      expect(mockDirectorRepository.save).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(createDirectorDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of directors', async () => {
      const directors = [
        { id: 1, name: 'Director 1' }
      ];

      jest.spyOn(mockDirectorRepository, 'find').mockResolvedValue(directors);

      const result = await directorService.findAll();

      expect(mockDirectorRepository.find).toHaveBeenCalled();
      expect(result).toEqual(directors);
    });
  });

  describe('findOne', () => {
    it('should return a single director by id', async () => {
      const director = { id: 1, name: 'Director 1' };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director as Director);

      const result = await directorService.findOne(director.id);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1
        }
      });
      expect(result).toEqual(director);
    });
  });

  describe('update', () => {
    it('should update a director', async () => {
      const updateDirectorDto = { name: 'Director 2' };
      const existingDirector = { id: 1, name: 'Director 1' };
      const updatedDirector = { id: 1, name: 'Director 2' };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValueOnce(existingDirector);
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValueOnce(updatedDirector);

      const result = await directorService.update(1, updateDirectorDto);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1
        }
      });

      expect(mockDirectorRepository.update).toHaveBeenCalledWith({
        id: 1,
      }, updateDirectorDto);

      expect(result).toEqual(updatedDirector);
    });

    it('should throw NotFoundException if director does not exist', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      await expect(directorService.update(1, { name: 'Director 2' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a director', async () => {
      const director = { id: 1, name: 'Director 1' };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);

      const result = await directorService.remove(1);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1
        }
      });

      expect(mockDirectorRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(1);
    });

    it('should throw NotFoundException if director does not exist', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      await expect(directorService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
