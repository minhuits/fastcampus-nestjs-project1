import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const WsQueryRunner = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const client = context.switchToWs().getClient();

    if (!client || !client.data || !client.data.queryBuilder) {
      throw new InternalServerErrorException('QueryRunner 객체를 찾을 수 없습니다!');
    }

    return client.data.queryRunner;
  },
);