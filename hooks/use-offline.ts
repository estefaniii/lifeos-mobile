import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { isOnline, onConnectivityChange, getQueueSize, processQueue } from '@/lib/offline-sync';

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());
  const [queueSize, setQueueSize] = useState(getQueueSize());

  useEffect(() => {
    const unsubscribe = onConnectivityChange((status) => {
      setOnline(status);
      if (status) {
        // Refresh queue size after processing
        setTimeout(() => setQueueSize(getQueueSize()), 2000);
      }
    });

    // Periodic queue size check
    const interval = setInterval(() => {
      setQueueSize(getQueueSize());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const syncNow = async () => {
    const result = await processQueue();
    setQueueSize(getQueueSize());
    return result;
  };

  return { online, queueSize, syncNow };
}
