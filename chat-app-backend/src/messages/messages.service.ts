import { Injectable } from '@nestjs/common';
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
}
