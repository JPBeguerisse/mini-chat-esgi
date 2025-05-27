import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/messages.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  // Créer un message
  async create(
    username: string,
    content: string,
    color: string,
  ): Promise<Message> {
    const message = this.messagesRepository.create({
      username,
      content,
      color,
    });
    return this.messagesRepository.save(message);
  }

  // Recupérer tous les messages
  async findAll(): Promise<Message[]> {
    return this.messagesRepository.find({
      order: {
        createdAt: 'ASC',
      },
    });
  }

  // Récupérer un message par son ID
  async findById(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOneBy({ id });
    if (!message) throw new NotFoundException('Message non trouvé');
    return message;
  }

  // modifier un message par son ID
  async update(id: string, content: string): Promise<Message> {
    const message = await this.messagesRepository.findOneBy({ id });
    if (!message) throw new NotFoundException('Message non trouvé');
    message.content = content;
    return this.messagesRepository.save(message);
  }

  // messages.service.ts
  async deleteMessage(id: string, username: string): Promise<void> {
    const message = await this.messagesRepository.findOneBy({ id });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    if (message.username !== username) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce message');
    }

    await this.messagesRepository.delete(id);
  }

  // Supprimer un message par son ID
  async remove(id: string): Promise<void> {
    const message = await this.messagesRepository.findOneBy({ id });
    if (!message) throw new NotFoundException('Message non trouvé');
    await this.messagesRepository.remove(message);
  }
}
