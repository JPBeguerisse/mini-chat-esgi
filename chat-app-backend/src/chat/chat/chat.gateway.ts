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
    { userId: string; username: string; color: string }
  > = {};

  constructor(
    private configService: ConfigService,
    private messagesService: MessagesService,
  ) {}

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

      const payload = jwt.verify(token, secret) as jwt.JwtPayload;

      // Enregistre l'utilisateur avec son username
      this.connectedUsers[client.id] = {
        userId: payload.sub as string,
        username: payload.username as string,
        color: payload.color as string,
      };

      // Envoie l'historique des messages au client connecté
      const messages = await this.messagesService.findAll();
      client.emit('history', messages);

      // Envoie seulement les usernames et la couleur des utilisateurs connectés
      const usernames = Object.values(this.connectedUsers).map((user) => ({
        username: user.username,
        color: user.color,
      }));
      console.log('Utilisateurs connectés :', usernames);
      this.server.emit('users', usernames);
    } catch (error) {
      console.log('Connexion refusée : token invalide');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // console.log(`User disconnected: ${client.id}`);
    delete this.connectedUsers[client.id];

    // Envoie seulement les usernames restants
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
    if (user) {
      const savedMessage = await this.messagesService.create(
        user.username,
        message,
        user.color,
      );

      this.server.emit('message', {
        username: user.username,
        content: savedMessage.content,
        color: savedMessage.color,
      });
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

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() id: string,
  ) {
    await this.messagesService.remove(id);
    this.server.emit('messageDeleted', id);
  }
}
