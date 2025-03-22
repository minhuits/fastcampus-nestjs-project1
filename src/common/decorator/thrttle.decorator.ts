import { Reflector } from '@nestjs/core';

export const Thrttle = Reflector.createDecorator<{ count: number, unit: 'minute' }>();