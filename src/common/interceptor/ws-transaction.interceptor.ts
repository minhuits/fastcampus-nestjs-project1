import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class WsTransactionInterceptor implements NestInterceptor {
  constructor(
    private readonly dataSource: DataSource,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const client = context.switchToWs().getClient();
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    client.data.queryRunner = queryRunner;

    return next.handle()
      .pipe(
        catchError(async (e) => {
          await queryRunner.rollbackTransaction();
          await queryRunner.release();

          throw e;
        }),
        tap(async () => {
          await queryRunner.commitTransaction();
          await queryRunner.release();
        }),
      );
  }
}
