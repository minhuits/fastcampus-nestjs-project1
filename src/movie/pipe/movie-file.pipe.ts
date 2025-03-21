import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { rename } from 'fs/promises';
import { join } from 'path';
import { v4 } from 'uuid';

type ExpressMulterFileType =  Express.Multer.File;

@Injectable()
export class MovieFilePipe implements PipeTransform<ExpressMulterFileType, Promise<ExpressMulterFileType>> {
  constructor(
    private readonly options: {
      maxSize: number,
      mimetype: string,
    }
  ) { }

  async transform(value: ExpressMulterFileType, metadata: ArgumentMetadata): Promise<ExpressMulterFileType> {
    if (!value) {
      throw new BadRequestException('movie 필드는 필수입니다');
    }

    const byteSize = this.options.maxSize * 1000000;

    if (value.size > byteSize) {
      throw new BadRequestException(`${this.options.maxSize}MB 이하의 사이즈만 업로드 가능합니다!`);
    }

    if (value.mimetype !== this.options.mimetype) {
      throw new BadRequestException(`${this.options.mimetype}만 업로드 가능합니다!`);
    }

    const split = value.originalname.split('.');

    let extension = 'mp4';

    if (split.length > 1) {
      extension = split[split.length - 1];

    }
    // uuid_Date.mp4
    const filename = `${v4()}_${Date.now()}.${extension}`;
    const newPath = join(value.destination, filename);

    await rename(value.path, newPath);

    return {
      ...value,
      filename,
      path: newPath,
    }
  }
} // 파일 이름 변경하기2