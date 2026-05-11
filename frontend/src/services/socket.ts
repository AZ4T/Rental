import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        const token = localStorage.getItem("access_token");
        socket = io(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
            auth: { token },
            autoConnect: true,
        });
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
