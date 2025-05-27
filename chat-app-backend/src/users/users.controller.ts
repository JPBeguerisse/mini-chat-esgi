import {
  Controller,
  Get,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @UseGuards(JwtAuthGuard)
  // @Get()
  // getProfile(@Request() req) {
  //   return req.user;
  // }

  @UseGuards(JwtAuthGuard)
  @Get('me') // ✅ bon nom de route
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      color: user.color,
    };
  }
}
