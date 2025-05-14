import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userService.create({
      ...dto,
      password: hashedPassword,
    });
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email ou Mot de passe invalide');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Email ou Mot de passe invalide');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      color: user.color,
    };

    const token = this.jwtService.sign(payload);
    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        color: user.color,
      },
    };
  }
}
