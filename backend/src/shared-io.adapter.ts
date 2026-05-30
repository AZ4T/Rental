import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server } from 'socket.io';

// NestJS IoAdapter.createIOServer() creates a NEW socket.io Server on the same
// HTTP server for every gateway (chats, calls, notifications). Multiple engine.io
// instances on the same port race to handle each poll request, causing 400 responses.
// This adapter caches the server so all gateways share one engine.io instance.
export class SharedIoAdapter extends IoAdapter {
    private sharedServer: Server | null = null;

    createIOServer(port: number, options?: Record<string, unknown>): Server {
        if (!this.sharedServer) {
            this.sharedServer = super.createIOServer(port, options) as Server;
        }
        return this.sharedServer;
    }
}
