import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class DefaultLogger extends ConsoleLogger {
  warn(message: unknown, ...rest: unknown[]): void {
    console.log('--- warn log ---'.toUpperCase());
    super.warn(message, ...rest);
  }

  error(message: unknown, ...rest: unknown[]): void {
    console.log('--- error log ---'.toUpperCase());
    super.error(message, ...rest);
  }
}
