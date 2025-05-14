import { Module } from '@nestjs/common';
import { ChatGateway } from './chat/chat.gateway';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  imports: [MessagesModule],
  providers: [ChatGateway],
})
export class ChatModule {}
