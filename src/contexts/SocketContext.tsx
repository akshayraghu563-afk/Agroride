'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  sendMessage: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  const joinRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('join', room);
    }
  };

  const leaveRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('leave', room);
    }
  };

  const sendMessage = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}