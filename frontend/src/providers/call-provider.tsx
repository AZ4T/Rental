"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

type CallStatus = "idle" | "outgoing" | "incoming" | "active";

interface IncomingCallData {
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    offer: RTCSessionDescriptionInit;
    isVideo?: boolean;
}

interface CallState {
    status: CallStatus;
    peerId: string;
    peerName: string;
    peerAvatar?: string;
    startTime?: number;
    isMuted: boolean;
    isVideo?: boolean;
}

interface CallContextValue {
    callState: CallState;
    initiateCall: (calleeId: string, calleeName: string, calleeAvatar?: string) => Promise<void>;
    initiateVideoCall: (calleeId: string, calleeName: string, calleeAvatar?: string) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    localVideoRef: { current: HTMLVideoElement | null };
    remoteVideoRef: { current: HTMLVideoElement | null };
    remoteStreamRef: { current: MediaStream | null };
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall() {
    const ctx = useContext(CallContext);
    if (!ctx) throw new Error("useCall must be used inside CallProvider");
    return ctx;
}

export function CallProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const callStatusRef = useRef<CallStatus>("idle");
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
    const incomingRef = useRef<IncomingCallData | null>(null);

    const [callState, setCallState] = useState<CallState>({
        status: "idle",
        peerId: "",
        peerName: "",
        isMuted: false,
    });

    const cleanup = useCallback(() => {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        remoteStreamRef.current = null;
        pcRef.current?.close();
        pcRef.current = null;
        pendingCandidates.current = [];
        incomingRef.current = null;
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        callStatusRef.current = "idle";
        setCallState({ status: "idle", peerId: "", peerName: "", isMuted: false });
    }, []);

    const createPC = useCallback(
        (peerId: string): RTCPeerConnection => {
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    socketRef.current?.emit("call:ice-candidate", {
                        targetId: peerId,
                        candidate: candidate.toJSON(),
                    });
                }
            };

            pc.ontrack = ({ streams }) => {
                const stream = streams[0];
                const hasVideo = stream.getVideoTracks().length > 0;
                if (hasVideo) {
                    remoteStreamRef.current = stream;
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                    }
                } else {
                    if (!remoteAudioRef.current) {
                        remoteAudioRef.current = new Audio();
                        remoteAudioRef.current.autoplay = true;
                    }
                    remoteAudioRef.current.srcObject = stream;
                }
            };

            pc.onconnectionstatechange = () => {
                if (
                    pc.connectionState === "disconnected" ||
                    pc.connectionState === "failed" ||
                    pc.connectionState === "closed"
                ) {
                    cleanup();
                }
            };

            return pc;
        },
        [cleanup],
    );

    const initiateCall = useCallback(
        async (calleeId: string, calleeName: string, calleeAvatar?: string) => {
            if (callState.status !== "idle") return;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            const pc = createPC(calleeId);
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            pcRef.current = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            callStatusRef.current = "outgoing";
            setCallState({
                status: "outgoing",
                peerId: calleeId,
                peerName: calleeName,
                peerAvatar: calleeAvatar,
                isMuted: false,
                isVideo: false,
            });

            socketRef.current?.emit("call:initiate", {
                calleeId,
                callerName: user?.name ?? "Пользователь",
                callerAvatar: user?.avatar_url,
                offer,
                isVideo: false,
            });
        },
        [callState.status, createPC, user],
    );

    const initiateVideoCall = useCallback(
        async (calleeId: string, calleeName: string, calleeAvatar?: string) => {
            if (callState.status !== "idle") return;

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;

            // Show local video preview
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const pc = createPC(calleeId);
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            pcRef.current = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            callStatusRef.current = "outgoing";
            setCallState({
                status: "outgoing",
                peerId: calleeId,
                peerName: calleeName,
                peerAvatar: calleeAvatar,
                isMuted: false,
                isVideo: true,
            });

            socketRef.current?.emit("call:initiate", {
                calleeId,
                callerName: user?.name ?? "Пользователь",
                callerAvatar: user?.avatar_url,
                offer,
                isVideo: true,
            });
        },
        [callState.status, createPC, user],
    );

    const acceptCall = useCallback(async () => {
        const incoming = incomingRef.current;
        if (!incoming) return;

        const isVideo = incoming.isVideo ?? false;
        const stream = await navigator.mediaDevices.getUserMedia(
            isVideo ? { video: true, audio: true } : { audio: true },
        );
        localStreamRef.current = stream;

        if (isVideo && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        const pc = createPC(incoming.callerId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        pcRef.current = pc;

        await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));

        for (const c of pendingCandidates.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit("call:answer", { callerId: incoming.callerId, answer });

        callStatusRef.current = "active";
        setCallState({
            status: "active",
            peerId: incoming.callerId,
            peerName: incoming.callerName,
            peerAvatar: incoming.callerAvatar,
            startTime: Date.now(),
            isMuted: false,
            isVideo,
        });
    }, [createPC, localVideoRef]);

    const rejectCall = useCallback(() => {
        const incoming = incomingRef.current;
        if (incoming) {
            socketRef.current?.emit("call:reject", { callerId: incoming.callerId });
        }
        cleanup();
    }, [cleanup]);

    const endCall = useCallback(() => {
        const peerId = callState.peerId;
        if (peerId) {
            const duration = callState.startTime ? Math.floor((Date.now() - callState.startTime) / 1000) : 0;
            socketRef.current?.emit("call:end", { targetId: peerId, duration });
        }
        cleanup();
    }, [callState.peerId, callState.startTime, cleanup]);

    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const enabled = !callState.isMuted;
        stream.getAudioTracks().forEach((t) => (t.enabled = !enabled));
        setCallState((prev) => ({ ...prev, isMuted: enabled }));
    }, [callState.isMuted]);

    // Socket setup
    useEffect(() => {
        if (!isAuthenticated || !user) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }

        const token = localStorage.getItem("access_token");
        const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/calls`, {
            auth: { token },
        });
        socketRef.current = socket;

        socket.on(
            "call:incoming",
            (data: IncomingCallData) => {
                if (callStatusRef.current !== "idle") {
                    socket.emit("call:busy", { callerId: data.callerId });
                    return;
                }
                incomingRef.current = data;
                callStatusRef.current = "incoming";
                setCallState({
                    status: "incoming",
                    peerId: data.callerId,
                    peerName: data.callerName,
                    peerAvatar: data.callerAvatar,
                    isMuted: false,
                    isVideo: data.isVideo ?? false,
                });
            },
        );

        socket.on("call:answered", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            const pc = pcRef.current;
            if (!pc) return;
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            for (const c of pendingCandidates.current) {
                await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidates.current = [];
            callStatusRef.current = "active";
            setCallState((prev) => ({
                ...prev,
                status: "active",
                startTime: Date.now(),
            }));
        });

        socket.on("call:ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            const pc = pcRef.current;
            if (!pc || !pc.remoteDescription) {
                pendingCandidates.current.push(candidate);
                return;
            }
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on("call:rejected", () => cleanup());
        socket.on("call:ended", () => cleanup());
        socket.on("call:busy", () => cleanup());

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id]);

    return (
        <CallContext.Provider
            value={{ callState, initiateCall, initiateVideoCall, acceptCall, rejectCall, endCall, toggleMute, localVideoRef, remoteVideoRef, remoteStreamRef }}
        >
            {children}
        </CallContext.Provider>
    );
}
