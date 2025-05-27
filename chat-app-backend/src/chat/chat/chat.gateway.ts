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
    { userId: number; username: string; color: string }
  > = {};

  constructor(
    private configService: ConfigService,
    private messagesService: MessagesService,
    private usersService: UsersService,
  ) {}

  // async handleConnection(client: Socket) {
  //   try {
  //     const token = client.handshake.auth.token;

  //     if (!token) {
  //       console.log('Connexion refusée : pas de token');
  //       client.disconnect();
  //       return;
  //     }

  //     const secret = this.configService.get<string>('JWT_SECRET');
  //     if (!secret) {
  //       console.error('JWT_SECRET manquant');
  //       client.disconnect();
  //       return;
  //     }

  //     const payload = jwt.verify(token, secret) as jwt.JwtPayload;

  //     // Enregistre l'utilisateur avec son username et sa couleur
  //     this.connectedUsers[client.id] = {
  //       userId: payload.sub as string,
  //       username: payload.username as string,
  //       color: payload.color as string,
  //     };

  //     // Envoie l'historique des messages au client connecté
  //     const messages = await this.messagesService.findAll();
  //     client.emit('history', messages);

  //     // Envoie seulement les usernames et la couleur des utilisateurs connectés
  //     const usernames = Object.values(this.connectedUsers).map((user) => ({
  //       username: user.username,
  //       color: user.color,
  //     }));
  //     console.log('Utilisateurs connectés :', usernames);
  //     this.server.emit('users', usernames);
  //   } catch (error) {
  //     console.log('Connexion refusée : token invalide');
  //     client.disconnect();
  //   }
  // }

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

      // 🔓 Décodage JWT
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;

      // ✅ Conversion sécurisée du sub (string → number)
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

      // 🔍 Récupération de l'utilisateur en base
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
      };

      const messages = await this.messagesService.findAll();
      client.emit('history', messages);

      const usernames = Object.values(this.connectedUsers).map((u) => ({
        username: u.username,
        color: u.color,
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
    });
  }

  @SubscribeMessage('updateColor')
  async handleUpdateColor(
    @ConnectedSocket() client: Socket,
    @MessageBody() color: string,
  ) {
    const user = this.connectedUsers[client.id];
    if (!user) return;
    // Mise à jour mémoire
    user.color = color;
    // Persistance en base
    await this.usersService.updateColor(user.userId, color);
    // Redistribue la liste users
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

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() id: string,
  ) {
    await this.messagesService.remove(id);
    this.server.emit('messageDeleted', id);
  }
}
