// src/hooks/useSocket.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './useAuth'; // Note the relative path might change if you move the file

const SocketContext = createContext(null);

// The exported hook, which is what the rest of the app will use
export const useSocket = () => useContext(SocketContext);

// The provider component that wraps the app
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            console.log(token)
            const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
                auth: { token }
            });
            newSocket.on('connect_error', (err) => {
                console.error('Socket connect_error:', err.message);
            });
            newSocket.on('error', (err) => {
                console.error('Socket error:', err);
            });
            setSocket(newSocket);
            return () => newSocket.close();
        } else {
            console.log(token)
        }
    }, [token]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};