import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'La couleur doit être un code hexadecimal valide (ex: #ff0000)',
  })
  color: string;
}
