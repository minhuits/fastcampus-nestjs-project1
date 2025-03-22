import { Injectable } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { readdir, unlink } from "fs/promises";
import { join, parse } from "path";
import { Movie } from "src/movie/entity/movie.entity";
import { Repository } from "typeorm";

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    private readonly schedulerRegistry: SchedulerRegistry,
  ) { }

  // 1. Cron 사용해보기
  // 
  // @Cron('* * * * * *')
  logEverySecond() {
    console.log('1초마다 실행!');
  }

  // 2. 임시 파일 삭제 기능 (기준: 생성 시간)
  //
  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFileTargets = files.filter((file) => {
      const filename = parse(file).name;
      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = (24 * 60 * 60 * 1000);

        const now = +new Date();

        return (now - date) > aDayInMilSec;
      } catch (error) {
        return true;
      }

    })

    await Promise.all(
      deleteFileTargets.map(
        (filename) => unlink(join(process.cwd(), 'public', 'temp', filename))
      )
    );

    for (let i = 0; i < deleteFileTargets.length; i++) {
      const fileName = deleteFileTargets[i];


    }
  }

  // 3. 좋아요 싫어요 통계
  // 
  // @Cron('0 * * * * *')
  async calculateLikeDislikeStats() {
    console.log('run');

    await this.movieRepository.query(`
      UPDATE movie m
      SET "likeCount" = (
        SELECT count(*) FROM movie_user_like mul
        WHERE m.id = mul."movieId" AND mul."isLike" = true
      )
    `);

    await this.movieRepository.query(`
      UPDATE movie m
      SET "likeCount" = (
        SELECT count(*) FROM movie_user_like mul
        WHERE m.id = mul."movieId" AND mul."isLike" = false
      )
    `);
  }

  // 4. 다이나믹 태스크 스케줄링
  @Cron('* * * * * *', {
    name: 'printer',
  })
  printer() {
    console.log('[printer] print every seconds!');
  }

  @Cron('*/5 * * * * *')
  stepper() {
    console.log('[stepper] ==== stepper run! ====');

    const job = this.schedulerRegistry.getCronJob('printer');

    console.log('# Last Date');
    console.log(job.lastDate());
    console.log('# Next Date');
    console.log(job.nextDate());
    console.log('# Next Dates');
    console.log(job.nextDates(5));

    if (job.running) {
      job.stop();
    } else {
      job.start();
    }
  }
}
