"use client";

import { useEffect, useRef, useState } from "react";
import { useCall } from "@/providers/call-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Video } from "lucide-react";

function VideoCallView() {
    const { localVideoRef, remoteVideoRef, remoteStreamRef } = useCall();
    const remoteEl = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (!remoteEl.current) return;
        remoteVideoRef.current = remoteEl.current;
        if (remoteStreamRef.current) {
            remoteEl.current.srcObject = remoteStreamRef.current;
            remoteEl.current.play().catch(() => {});
        }
        return () => { remoteVideoRef.current = null; };
    }, [remoteVideoRef, remoteStreamRef]);

    return (
        <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
            {/* Remote stream - full size */}
            <video
                ref={remoteEl}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />
            {/* Local stream - picture in picture */}
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-2 right-2 w-24 h-16 rounded-lg object-cover border-2 border-white shadow-lg"
            />
        </div>
    );
}

function useCallTimer(startTime?: number) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!startTime) { setElapsed(0); return; }
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
        return () => clearInterval(id);
    }, [startTime]);
    const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export function CallOverlay() {
    const { callState, acceptCall, rejectCall, endCall, toggleMute } = useCall();
    const timer = useCallTimer(callState.startTime);

    if (callState.status === "idle") return null;

    const { status, peerName, peerAvatar, isMuted, isVideo } = callState;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden ${isVideo && status === "active" ? "w-[480px]" : "w-80"}`}>
                {/* Video area - shown when active video call */}
                {isVideo && status === "active" ? (
                    <>
                        <VideoCallView />
                        <div className="px-4 py-2 flex items-center justify-between bg-gray-900 text-white">
                            <span className="text-sm font-semibold">{peerName}</span>
                            <span className="text-sm text-gray-400">{timer}</span>
                        </div>
                    </>
                ) : (
                    /* Top gradient - avatar view */
                    <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-6 pt-8 pb-10 flex flex-col items-center gap-3">
                        {/* Тип звонка — крупный значок над аватаркой */}
                        <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold rounded-full px-3 py-1 backdrop-blur-sm">
                            {isVideo ? (
                                <>
                                    <Video className="h-3.5 w-3.5" />
                                    Видеозвонок
                                </>
                            ) : (
                                <>
                                    <Phone className="h-3.5 w-3.5" />
                                    Аудиозвонок
                                </>
                            )}
                        </div>

                        <Avatar className="h-24 w-24 ring-4 ring-white/30">
                            <AvatarImage src={peerAvatar ?? ""} />
                            <AvatarFallback className="text-3xl bg-blue-500 text-white">
                                {peerName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center text-white">
                            <p className="text-xl font-bold">{peerName}</p>
                            <p className="text-sm text-blue-100 mt-1">
                                {status === "incoming" && "Входящий вызов..."}
                                {status === "outgoing" && "Вызов..."}
                                {status === "active" && timer}
                            </p>
                        </div>

                        {/* Pulse animation for ringing */}
                        {(status === "incoming" || status === "outgoing") && (
                            <div className="flex gap-1 mt-1">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce"
                                        style={{ animationDelay: `${i * 150}ms` }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-6">
                    {status === "incoming" ? (
                        <div className="flex justify-around">
                            {/* Reject */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={rejectCall}
                                    className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
                                >
                                    <PhoneOff className="h-6 w-6 text-white" />
                                </button>
                                <span className="text-xs text-gray-500">Отклонить</span>
                            </div>
                            {/* Accept */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={acceptCall}
                                    className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg animate-pulse"
                                >
                                    {isVideo ? (
                                        <Video className="h-6 w-6 text-white" />
                                    ) : (
                                        <Phone className="h-6 w-6 text-white" />
                                    )}
                                </button>
                                <span className="text-xs text-gray-500">
                                    {isVideo ? "Принять видео" : "Принять"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-around">
                            {/* Mute */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={toggleMute}
                                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors shadow ${
                                        isMuted
                                            ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                                    }`}
                                >
                                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                </button>
                                <span className="text-xs text-gray-500">{isMuted ? "Включить" : "Выкл. микр."}</span>
                            </div>
                            {/* End */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={endCall}
                                    className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
                                >
                                    <PhoneOff className="h-5 w-5 text-white" />
                                </button>
                                <span className="text-xs text-gray-500">Завершить</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
