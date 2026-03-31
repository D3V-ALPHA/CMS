/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  useEffect(() => {
    // Connect to the same origin (relative path). In Docker, Nginx proxies /socket.io.
    // In local dev, Vite proxies /socket.io to the backend.
    const socket = io();
    socket.on('activity', (data) => {
      setActivities(prev => [data, ...prev]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);
  return activities;
}