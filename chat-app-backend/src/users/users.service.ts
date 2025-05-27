import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUser) {
        throw new ConflictException('Ce nom d’utilisateur est déjà pris');
      }

      const existingEmail = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Cet e-mail est déjà utilisé');
      }

      const user = this.userRepository.create(dto);
      return await this.userRepository.save(user);
    } catch (error) {
      // Si c’est déjà une exception NestJS (ex: ConflictException), on la relance telle quelle
      if (error instanceof ConflictException) {
        throw error;
      }

      // Sinon, on envoie une erreur serveur plus générique
      throw new InternalServerErrorException('Une erreur interne est survenue');
    }
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Met à jour la couleur de l'utilisateur
   */
  async updateColor(userId: string, color: string): Promise<void> {
    const result = await this.userRepository.update(userId, { color });
    if (result.affected === 0) {
      throw new NotFoundException('Utilisateur introuvable');
    }
  }
}
