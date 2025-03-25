import { TestBed } from '@automock/jest';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie-dto';
import { QueryRunner } from 'typeorm';
import { UpdateMovieDto } from './dto/update-movie-dto';

describe('MovieController', () => {
  let movieController: MovieController;
  let movieService: MovieService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(MovieController).compile();

    movieController = unit;
    movieService = unitRef.get<MovieService>(MovieService);
  });

  it('should be defined', () => {
    // expect(true).toBe(true);
    expect(movieController).toBeDefined();
  });

  describe('getMovies', () => {
    it('should call movieService.findAll with the correct parameters', async () => {
      const dto = { page: 1, limit: 10 };
      const userId = 1;
      const movies = [{ id: 1 }, { id: 2 }];

      jest.spyOn(movieService, 'findAll').mockResolvedValue(movies as any);

      const result = await movieController.findAll(dto as any, userId);

      expect(movieService.findAll).toHaveBeenCalledWith(dto, userId);
      expect(result).toEqual(movies);
    });

    it('should call movieService.findOne with the correct id', async () => {
      const id = 1;
      await movieController.findOne(1);

      expect(movieService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('recent', () => {
    it('should call movieService.findRecent with the correct parameters', async () => {
      await movieController.getMovieRecent();

      expect(movieService.findRecent).toHaveBeenCalledWith();
    });
  });

  describe('postMovie', () => {
    it('should call movieService.create with the correct parameters', async () => {
      const body = { title: 'Test' };
      const userId = 1;
      const queryRunner = {};

      await movieController.create(body as CreateMovieDto, queryRunner as QueryRunner, userId);

      expect(movieService.create).toHaveBeenCalledWith(body, userId, queryRunner);
    });
  });

  describe('patchMovie', () => {
    it('should call movieService.update with the correct parameters', async () => {
      const id = 1;
      const body: UpdateMovieDto = { title: 'Update Movie' };

      await movieController.update(id, body);

      expect(movieService.update).toHaveBeenCalledWith(id, body);
    });
  });

  describe('deleteMovies', () => {
    it('should call movieService.update with the correct id', async () => {
      const id = 1;
      await movieController.remove(id);

      expect(movieService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('createMovieLike', () => {
    it('should call movieService.toggleMovieLike with the correct parameters', async () => {
      const movieId = 1;
      const userId = 2;

      await movieController.creatMovieLike(movieId, userId);
      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(movieId, userId, true);
    });
  });  

  describe('createMovieDisLike', () => {
    it('should call movieService.toggleMovieDislike with the correct parameters', async () => {
      const movieId = 1;
      const userId = 2;

      await movieController.creatMovieDislike(movieId, userId);
      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(movieId, userId, false);
    });
  });  
});