  import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  namespace: '/bids',
  cors: {
    origin: '*', // Allow all for testing
    credentials: true
  }
})
export class BidGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) {}

  private pendingAuthentications = new Map<string, Promise<void>>();
  private pendingRoomJoins = new Map<string, { itemId: number }[]>();

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
    this.server = server;
  }


  private async authenticateClient(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;

      if (!token) throw new Error('No token provided');

      const payload = this.jwtService.verify(token.toString());
      const user = await this.usersService.findById(payload.sub);

      if (!user) throw new Error('User not found');

      client.data.user = user;
      console.log(`🔐 ${user.username} authenticated`);
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async handleConnection(client: Socket) {
    try {
      // Create authentication promise
      const authPromise = this.authenticateClient(client);
      this.pendingAuthentications.set(client.id, authPromise);

      // Wait for authentication to complete
      await authPromise;

      // Process any queued room joins
      this.processPendingRoomJoins(client);

      console.log(`✅ Client ${client.id} authenticated and ready`);
    } catch (error) {
      console.error(`❌ Authentication failed for ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  private async processRoomJoin(client: Socket, itemId: number) {
    if (!client.data.user) {
      throw new Error('Client not authenticated');
    }

    const room = `item_${itemId}`;
    client.join(room);

    console.log(`🚪 ${client.data.user.username} joined room ${room}`);
    client.emit('roomJoined', { room, success: true });
  }

  private processPendingRoomJoins(client: Socket) {
    const pendingJoins = this.pendingRoomJoins.get(client.id);

    if (pendingJoins) {
      pendingJoins.forEach(async data => {
        try {
          await this.processRoomJoin(client, data.itemId);
        } catch (error) {
          console.error(`❌ Pending room join failed: ${error.message}`);
        }
      });

      this.pendingRoomJoins.delete(client.id);
    }
    this.pendingAuthentications.delete(client.id);
  }

  @SubscribeMessage('joinItemRoom')
  async handleJoinRoom(client: Socket, data: { itemId: number }) {
    try {
      // Check if authentication is complete
      const authPromise = this.pendingAuthentications.get(client.id);

      if (authPromise) {
        // Queue the join request if authentication is still in progress
        if (!this.pendingRoomJoins.has(client.id)) {
          this.pendingRoomJoins.set(client.id, []);
        }
        this.pendingRoomJoins.get(client.id)!.push(data);
        return;
      }

      // If authentication is complete, process immediately
      await this.processRoomJoin(client, data.itemId);
    } catch (error) {
      console.error(`❌ Room join error for ${client.id}: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  broadcastNewBid(itemId: number, amount: number) {
    try {
      const room = `item_${itemId}`;
      this.server.to(room).emit('newBid', {
        itemId,
        amount,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Broadcast to ${room}: $${amount}`);
    } catch (err) {
      console.error('Broadcast failed', err.stack);
    }
  }

  broadcastWinningBid(itemId: number, userId: number, amount: number) {
    try {
      const room = `item_${itemId}`;
      this.server.to(room).emit('winningBid', {
        itemId,
        userId,
        amount,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Broadcast to ${room}: $${amount}`);
    } catch (err) {
      console.error('Broadcast failed', err.stack);
    }
  }
}

