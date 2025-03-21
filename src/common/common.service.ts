import { BadRequestException, Injectable } from "@nestjs/common";
import { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";
import { PagePaginationDto } from "./dto/page-pagination.dto";

@Injectable()
export class CommonService {
  constructor() { }

  applyPagination<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, dto: PagePaginationDto) {
    const { page, take } = dto;

    const skip = (page - 1) * take;

    queryBuilder.take(take);
    queryBuilder.skip(skip);
  }

  async applyCursorPagination<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, dto: CursorPaginationDto) {

    let { cursor, order, take } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      /**
       * {
       *   values: {
       *      id: 27
       *   },
       *   order: ['id_DESC']
       * }
       */
      const cursorObject = JSON.parse(decodedCursor);

      order = cursorObject.order;

      const { values } = cursorObject;

      // WHERE (column1 > value1)
      // OR (column1 = value1 AND column2 < value2)
      // OR (column1 = value1 AND column2 = value2 AND column3 > value3)
      // 
      // => (column1, column2, column3) > (value1, value2, value3)
      const columns = Object.keys(values);
      const comparisonOperator = order.some((o) => o.endsWith('DESC')) ? '<' : '>';
      const whereConditions = columns.map(c => `${queryBuilder.alias}.${c}`).join(',');
      const whereParams = columns.map(c => `:${c}`).join(',');

      queryBuilder.where(`(${whereConditions}) ${comparisonOperator} (${whereParams})`, values);
    }

    // ["likeCount_DESC", "id_DESC"]
    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException('Order는 ASC 또는 DESC으로 입력해주세요');
      }

      if (i == 0) {
        queryBuilder.orderBy(`${queryBuilder.alias}.${column}`, direction);
      } else {
        queryBuilder.addOrderBy(`${queryBuilder.alias}.${column}`, direction);
      }
    }

    queryBuilder.take(take);

    const results = await queryBuilder.getMany();
    const nextCursor = this.generateNextCursor(results, order);

    return { queryBuilder, nextCursor };
  }

  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) return null;

    /**
     * {
     *   values: {
     *      id: 27
     *   },
     *   order: ['id_DESC']
     * }
     */
    const lastItem = results[results.length - 1];
    const values = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    const cursorObject = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObject)).toString('base64');

    return nextCursor;
  }
}