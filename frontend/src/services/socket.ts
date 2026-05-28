import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket || socket.disconnected) {
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
        }
        const token = localStorage.getItem("access_token");
        socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/chats`, {
            auth: { token },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
}
