'use client';
import { useState, useEffect } from 'react';

export default function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [showBar, setShowBar] = useState(false);
  const [barType, setBarType] = useState('offline'); // 'offline' | 'online'

  useEffect(() => {
    const goOffline = () => {
      setOnline(false);
      setBarType('offline');
      setShowBar(true);
    };

    const goOnline = () => {
      setOnline(true);
      setBarType('online');
      setShowBar(true);
      setTimeout(() => setShowBar(false), 3000);
    };

    // Set initial state
    if (!navigator.onLine) goOffline();

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!showBar) return null;

  return (
    <div className={`network-bar network-${barType}`}>
      {barType === 'offline'
        ? '⚠ You are offline — check your internet connection'
        : '✓ Back online'}
    </div>
  );
}
