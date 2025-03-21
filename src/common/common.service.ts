import { Injectable } from "@nestjs/common";
import { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto copy";
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

  applyCursorPagination<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, dto: CursorPaginationDto) {
    const { order, take, id } = dto;

    if (id) {
      const direction = order === 'ASC' ? '>' : '<';

      /// order -> ASC : movide.id > :id
      /// :id
      queryBuilder.where(`${queryBuilder.alias}.id ${direction} :id`, { id });
    }

    queryBuilder.orderBy(`${queryBuilder.alias}.id`, order);

    queryBuilder.take(take);
  }
}