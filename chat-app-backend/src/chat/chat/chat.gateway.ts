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

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Record<string, { userId: string; username: string }> =
    {};

  constructor(private configService: ConfigService) {}

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

      // ✅ Enregistre l'utilisateur avec son username
      this.connectedUsers[client.id] = {
        userId: payload.sub as string,
        username: payload.username as string,
      };

      // ✅ Envoie seulement les usernames, pas les objets complets
      const usernames = Object.values(this.connectedUsers).map(
        (user) => user.username,
      );
      this.server.emit('users', usernames);
    } catch (error) {
      console.log('Connexion refusée : token invalide');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`User disconnected: ${client.id}`);
    delete this.connectedUsers[client.id];

    // ✅ Envoie seulement les usernames restants
    const usernames = Object.values(this.connectedUsers).map(
      (user) => user.username,
    );
    this.server.emit('users', usernames);
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    const user = this.connectedUsers[client.id];
    if (user) {
      this.server.emit('message', { username: user.username, message });
    }
  }
}
