import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from 'src/messages/messages.service';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Record<
    string,
    { userId: number; username: string; color: string; lastSeen: number }
  > = {};

  constructor(
    private configService: ConfigService,
    private messagesService: MessagesService,
    private usersService: UsersService,
  ) {}

  // connxion
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        console.log('Connexion refusée : pas de token');
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        console.error('JWT_SECRET manquant');
        client.disconnect();
        return;
      }

      // Décodage JWT
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;

      if (!payload.sub) {
        console.error('Token sans sub');
        client.disconnect();
        return;
      }

      const userId = Number(payload.sub);
      if (isNaN(userId)) {
        console.error('Token avec sub invalide');
        client.disconnect();
        return;
      }

      // Récupération de l'utilisateur en base
      const user = await this.usersService.findById(userId);
      if (!user) {
        console.error('Utilisateur introuvable');
        client.disconnect();
        return;
      }
      this.connectedUsers[client.id] = {
        userId: user.id,
        username: user.username,
        color: user.color,
        lastSeen: 0,
      };

      const messages = await this.messagesService.findAll();
      client.emit('history', messages);

      const usernames = Object.values(this.connectedUsers).map((user) => ({
        username: user.username,
        color: user.color,
        lastSeen: user.lastSeen,
      }));

      this.server.emit('users', usernames);
    } catch (error) {
      console.log('Connexion refusée : token invalide');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // console.log(`User disconnected: ${client.id}`);
    delete this.connectedUsers[client.id];

    const usernames = Object.values(this.connectedUsers).map((user) => ({
      username: user.username,
      color: user.color,
    }));

    this.server.emit('users', usernames);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    const user = this.connectedUsers[client.id];
    if (!user) return;
    const savedMessage = await this.messagesService.create(
      user.username,
      message,
      user.color,
    );

    this.server.emit('message', {
      username: user.username,
      content: savedMessage.content,
      color: savedMessage.color,
      messageId: savedMessage.id,
      createdAt: savedMessage.createdAt,
    });
  }

  @SubscribeMessage('updateColor')
  async handleUpdateColor(
    @ConnectedSocket() client: Socket,
    @MessageBody() color: string,
  ) {
    const user = this.connectedUsers[client.id];
    if (!user) return;
    user.color = color;
    await this.usersService.updateColor(user.userId, color);
    const list = Object.values(this.connectedUsers).map((u) => ({
      username: u.username,
      color: u.color,
    }));
    this.server.emit('users', list);
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers[client.id];
    if (user) {
      this.server.emit('userTyping', user.username);
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers[client.id];
    if (user) {
      this.server.emit('userStopTyping', user.username);
    }
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string; content: string },
  ) {
    const updated = await this.messagesService.update(data.id, data.content);
    this.server.emit('messageEdited', updated);
  }

  // chat.gateway.ts
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageId: string,
  ) {
    const user = this.connectedUsers[client.id];
    if (!user) return;

    try {
      await this.messagesService.deleteMessage(messageId, user.username);
      this.server.emit('messageDeleted', messageId);
    } catch (err) {
      console.error(err.message);
      client.emit('deleteError', err.message);
    }
  }

  // @SubscribeMessage('deleteMessage')
  // async handleDeleteMessage(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() id: string,
  // ) {
  //   await this.messagesService.remove(id);
  //   this.server.emit('messageDeleted', id);
  // }

  @SubscribeMessage('messageSeen')
  async handleMessageSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageId: number,
  ) {
    const user = this.connectedUsers[client.id];
    if (!user) return;
    user.lastSeen = messageId;
    this.server.emit('userSeen', {
      username: user.username,
      color: user.color,
      lastSeen: messageId,
    });
  }
}
