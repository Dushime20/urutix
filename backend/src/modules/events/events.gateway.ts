
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'events',
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Check for auth token (in headers or query)
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

            if (token) {
                const secret = this.configService.get<string>('JWT_SECRET');
                const payload = this.jwtService.verify(token, { secret });

                // Join user-specific room
                const userId = payload.sub;
                client.join(`user_${userId}`);
                console.log(`Client ${client.id} authenticated as user ${userId}`);

                // If admin, join admin room
                const roles = payload.roles || (payload.role ? [payload.role] : []);

                if (roles.includes('admin') || roles.includes('tenant_admin') ||
                    roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) { // Also check uppercase enum values
                    client.join('admin');
                    console.log(`Client ${client.id} joined admin room`);
                }
            } else {
                console.log(`Client ${client.id} connected without auth`);
            }
        } catch (error) {
            console.log(`Client ${client.id} connection auth failed:`, error.message);
            // We don't disconnect, just don't join privileged rooms
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    // --- Emitting Methods ---

    /**
     * Send to specific user
     */
    emitToUser(userId: string, event: string, data: any) {
        this.server.to(`user_${userId}`).emit(event, data);
    }

    /**
     * Send to all admins
     */
    emitToAdmin(event: string, data: any) {
        this.server.to('admin').emit(event, data);
    }

    /**
     * Send to everyone (Global)
     */
    emitToAll(event: string, data: any) {
        this.server.emit(event, data);
    }

    // --- Specific Event Helpers ---

    emitActivityLog(activity: any) {
        this.server.to('admin').emit('new_activity', activity);
    }

    emitSuspiciousActivity(activity: any) {
        this.server.to('admin').emit('suspicious_activity', activity);
    }

    emitNotification(userId: string, notification: any) {
        const room = `user_${userId}`;
        // Emit both event names for client compatibility
        this.server.to(room).emit('notification', notification);
        this.server.to(room).emit('notification:new', notification);
    }
}
