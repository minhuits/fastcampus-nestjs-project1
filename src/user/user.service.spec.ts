import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';
import { UserService } from './user.service';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe("findAll", () => {
    it('should return all users', async () => {
      const user = [
        {
          id: 1,
          email: 'test@codefactor.ai'
        },
      ];
      mockUserRepository.find.mockReturnValue(user);

      const result = await userService.findAll();

      expect(result).toEqual(user);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe("create() 함수 테스트", () => {
    it('should create a new user and ', async () => {
      const createUserDto = {
        email: 'test@codefactory.ai',
        password: '123123',
      };
      const hashRounds = 10;
      const hashedPassword = 'hashashhashcivhasdf';
      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest.spyOn(bcrypt, 'hash').mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createdUser = await userService.create(createUserDto);

      expect(createdUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, { where: { email: createUserDto.email } });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, { where: { email: createUserDto.email } });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, hashRounds);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw a BadRequestException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123',
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        id: 1,
        email: createUserDto.email,
      });

      await expect(userService.create(createUserDto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
    });
  });

  describe("findOne", () => {
    it('should return a user by Id', async () => {
      const user = {
        id: 1,
        email: 'test@codefactor.ai'
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1
        }
      });
    });

    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.findOne(999)).rejects.toThrow();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999
        }
      });
    });
  });

  describe("update() 함수 테스트", () => {
    it('should update a user if it exists and return the updated user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'test@codefactor.ai',
        password: '123123',
      };
      const hashRounds = 10;
      const hashedPassword = 'hashashhashcivhasdf';
      const user = {
        id: 1,
        email: updateUserDto.email,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest.spyOn(bcrypt, 'hash').mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        ...user,
        password: hashedPassword,
      });

      const result = await userService.update(1, updateUserDto);

      expect(result).toEqual({
        ...user,
        password: hashedPassword,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1
        }
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, hashRounds);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 1, },
        {
          ...updateUserDto,
          password: hashedPassword,
        }
      );
    });

    it('should throw a NotFoundException if user to update is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const updateUserDto: UpdateUserDto = {
        email: 'test@codefactor.ai',
        password: '123123',
      };

      expect(userService.update(999, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999
        }
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("remove() 함수 테스트", () => {
    it('should delete a user by Id', async () => {
      const userId = 1;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
      });

      const result = await userService.remove(userId);

      expect(result).toEqual(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw a NotFoundException if user to delete is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.remove(999)).rejects.toThrow();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999
        }
      });
    });
  });
});