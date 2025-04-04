import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
// import * as AWS from 'aws-sdk';
import { ObjectCannedACL, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { v4 as uuid } from 'uuid';
import { envVariablesKeys } from './const/env.const';
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";
import { PagePaginationDto } from "./dto/page-pagination.dto";

@Injectable()
export class CommonService {
  private s3: S3;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const accessKeyId: string = configService.get<string>(envVariablesKeys.awsAccessKeyId) as string;
    const secretAccessKey: string = configService.get<string>(envVariablesKeys.awsSecretAccessKey) as string;
    const region: string | undefined = configService.get<string>(envVariablesKeys.awsRegion);

    // JS SDK v3 does not support global configuration.
    // Codemod has attempted to pass values to each service client in this file.
    // You may need to update clients outside of this file, if they use global config.
    // AWS.config.update({
    //   credentials: {
    //     accessKeyId: accessKeyId,
    //     secretAccessKey: secretAccessKey,
    //   },
    //   region: region,
    // });

    this.s3 = new S3({
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },

      region: region,
    });
  }

  async saveMovieToPermanentStorage(filename: string) {
    try {
      const buckeName = this.configService.get<string>(envVariablesKeys.bucketName) as string;

      await this.s3.copyObject({
        Bucket: buckeName,
        CopySource: `${buckeName}/public/temp/${filename}`,
        Key: `public/movie/${filename}`,
        ACL: 'public-read',
      });

      await this.s3.deleteObject({
        Bucket: buckeName,
        Key: `public/temp/${filename}`,
      });

    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException('S3 ERROR!');
    }
  }

  async createPresignedUrl(expiresIn = 300) {
    'nestjs-netflix-bucket-movie/movie/video.mp4'
    const params = {
      Bucket: this.configService.get<string>(envVariablesKeys.bucketName),
      Key: `public/temp/${uuid}.mp4`,
      // Expires: expiresIn,
      // ACL: 'public-read',
      ACL: ObjectCannedACL.public_read,
    };

    try {
      const url = await getSignedUrl(this.s3, new PutObjectCommand(params), {
        expiresIn, /* add value from \'Expires\' from v2 call if present, else remove */
      });

      return url;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException('S3 Presigned URL 생성 실패!');
    }
  }

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