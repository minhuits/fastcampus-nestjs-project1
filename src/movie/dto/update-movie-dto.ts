import { IsNotEmpty, IsOptional } from "class-validator";

enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}

// custom validator
// @ValidatorConstraint()
// class PasswordValidator implements ValidatorConstraintInterface {
//   validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
//     return value.length > 4 && value.length < 8;
//   }
//   defaultMessage?(validationArguments?: ValidationArguments): string {
//     return '비밀번호 길이는 4~8자 여야합니다. \n입력된 PW: ($value)';
//   }
// }

// function IsPasswordValid(validationOptions?: ValidationOptions) {
//   return function (object: Object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName,
//       options: validationOptions,
//       validator: PasswordValidator
//     });
//   }
// }

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  /**
   - 기본 validator
   @IsDefined() 
   @IsOptional() 
   => null || undefined
   
   @Equals('code factory')
   @NotEquals('code factory')
   
   @IsEmpty() 
   @IsNotEmpty()
   => null || undefined || ''
   
   # Array
   @IsIn(['action', 'fantasy'])
   @IsNotIn(['action', 'fantasy'])
   
   - 타입 validator
   @IsBoolean()
   @IsString()
   @IsNumber()
   @IsInt()
   @IsArray()
   @IsEnum(MovieGenre)
   @IsDateString()
   
   - 숫자 validator
   @IsDivisibleBy(5)
   @IsPositive()
   @IsNegative()
   @Min(100)
   @Max(100)
   
   - 문자 validator
   @Contains('code factory')
   @NotContains('code factory')
   @IsAlphanumeric()
   @IsCreditCard()
   @IsHexColor()
   @MaxLength(100)
   @MinLength(100)
   @IsUUID()
   @IsLatLong()
   
   - Custom validator
  @Validate(PasswordValidator, {
    message: '다른 에러 메시지',
  })
  @IsPasswordValid({
    message: '다른 에러 메시지',
  }) // custom
   */
  // test: string;
}
