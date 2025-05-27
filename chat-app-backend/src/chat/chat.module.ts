import { Module } from '@nestjs/common';
import { ChatGateway } from './chat/chat.gateway';
import { MessagesModule } from 'src/messages/messages.module';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MessagesModule,
    UsersModule,
    ConfigModule,
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
