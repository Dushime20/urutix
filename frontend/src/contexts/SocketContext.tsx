
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { shouldSuppressRealtimeToast } from '../utils/actionToast';
import { Activity, Bell } from 'lucide-react';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const { accessToken, user } = useAuth();

    useEffect(() => {
        if (!accessToken) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        // Use environment variable or default
        const SOCKET_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';

        console.log('Connecting to Global Socket:', `${SOCKET_URL}/events`);

        const socketInstance = io(`${SOCKET_URL}/events`, {
            auth: {
                token: accessToken
            },
            transports: ['websocket'], // Force WebSocket
        });

        socketInstance.on('connect', () => {
            console.log('Global Socket connected:', socketInstance.id);
            setConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Global Socket disconnected');
            setConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });

        // --- Global Listeners ---

        // General Notifications — dedupe by notification id; skip after local action toasts
        socketInstance.on('notification', (data: any) => {
            if (shouldSuppressRealtimeToast(data?.notificationType || data?.type, data?.title)) {
                return;
            }
            const toastId = data?.id ? `notif-${data.id}` : undefined;
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <Bell className="h-10 w-10 text-indigo-500" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {data.title || 'Notification'}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {data.message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { id: toastId });
        });

        // System updates
        socketInstance.on('system_update', (data: any) => {
            toast.success(data.message, {
                icon: '📢',
                duration: 5000,
                style: {
                    border: '1px solid #3b82f6',
                    padding: '16px',
                    color: '#3b82f6',
                },
            });
            // Could also trigger a global state update or refresh check
        });

        // Suspicious Activity Alert (Admin only)
        if (user?.role === 'admin' || user?.role === 'tenant_admin') {
            socketInstance.on('suspicious_activity', (activity: any) => {
                toast.error(`Suspicious Activity: ${activity.action} by ${activity.userId}`, {
                    duration: 6000,
                    position: 'top-center'
                });
            });
        }

        // ─── Dispute real-time events ───────────────────────────────────────────
        socketInstance.on('dispute_created', (data: any) => {
            toast(data.message || 'New dispute created', {
                icon: '⚖️',
                duration: 5000,
                style: { border: '1px solid #2c5173', padding: '12px', color: '#2c5173' },
            });
        });

        socketInstance.on('dispute_updated', (data: any) => {
            toast(data.message || 'Dispute updated', {
                icon: '📋',
                duration: 4000,
                style: { border: '1px solid #f59e0b', padding: '12px', color: '#92400e' },
            });
        });

        socketInstance.on('dispute_resolved', (data: any) => {
            toast.success(data.message || 'Dispute resolved', {
                icon: '✅',
                duration: 6000,
            });
        });

        socketInstance.on('dispute_closed', (data: any) => {
            toast(data.message || 'Dispute closed', {
                icon: '🔒',
                duration: 4000,
            });
        });

        socketInstance.on('dispute_message_added', (data: any) => {
            toast(data.message || 'New message on dispute', {
                icon: '💬',
                duration: 3000,
            });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [accessToken, user?.role]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
