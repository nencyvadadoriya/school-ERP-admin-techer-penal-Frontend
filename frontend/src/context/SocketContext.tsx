import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

      socketInstance.on('connect', () => {
        console.log('Connected to socket');
        setIsConnected(true);
        // Use teacher_code or gr_number or _id based on user role for socket registration
        const userId = user.role === 'teacher' ? user.teacher_code : (user.role === 'student' ? user.gr_number : user._id);
        socketInstance.emit('register', userId);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket');
        setIsConnected(false);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } else {
      setSocket(null);
      setIsConnected(false);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
