import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

let socket: Socket | null = null;

export function getSocket(): Socket {
    // socket.active is true while connected or attempting reconnect with a valid state
    if (socket && (socket.connected || socket.active)) {
        return socket;
    }
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
    }
    socket = io(`${window.location.origin}/chats`, {
        // auth as a function: called on every connection attempt including reconnects,
        // so it always picks up the latest token after a refresh
        auth: (cb) => cb({ token: useAuthStore.getState().access_token }),
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    });
    // "io server disconnect" means the server explicitly kicked us (e.g. bad token).
    // Socket.IO does NOT auto-reconnect in this case, so we reset the module-level
    // reference so the next getSocket() call creates a fresh socket with the latest token.
    socket.on("disconnect", (reason) => {
        if (reason === "io server disconnect") {
            socket?.removeAllListeners();
            socket = null;
        }
    });
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
}
