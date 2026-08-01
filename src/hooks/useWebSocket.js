import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * useWebSocket — Custom hook for managing WebSocket connections.
 * 
 * Handles connection, reconnection, message parsing, and status tracking.
 * Returns connection status and methods to interact with the socket.
 * 
 * For the pilot demo, this hook can operate in "mock" mode generating
 * synthetic events when no real server is available.
 */

const RECONNECT_INTERVALS = [1000, 2000, 4000, 8000, 15000];
const MAX_RECONNECT_ATTEMPTS = 10;

export default function useWebSocket(url, { onMessage, mockMode = true } = {}) {
  const [status, setStatus] = useState('connecting'); // connecting | connected | disconnected | error
  const wsRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const mockTimerRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref fresh
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (mockMode) {
      // In mock mode, simulate connection and generate events
      setStatus('connecting');
      setTimeout(() => {
        setStatus('connected');
        startMockEvents();
      }, 1500);
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus('connecting');

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        attemptReconnect();
      };
    } catch (err) {
      setStatus('error');
      attemptReconnect();
    }
  }, [url, mockMode]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) return;

    const delay = RECONNECT_INTERVALS[
      Math.min(reconnectAttemptRef.current, RECONNECT_INTERVALS.length - 1)
    ];

    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttemptRef.current++;
      setStatus('connecting');
      connect();
    }, delay);
  }, [connect]);

  const startMockEvents = useCallback(() => {
    // Generate synthetic events at random intervals
    const generateEvent = () => {
      const events = [
        {
          type: 'complaint.new',
          data: {
            complaint_id: `CMP-${Date.now().toString(36).toUpperCase()}`,
            type: ['pothole', 'road_obstruction', 'waterlogging', 'streetlight'][Math.floor(Math.random() * 4)],
            description: ['Large pothole near bus stop', 'Road obstruction on main road', 'Waterlogging in residential area', 'Streetlight malfunction'][Math.floor(Math.random() * 4)],
            location: {
              lat: 17.6868 + (Math.random() - 0.5) * 0.01,
              lng: 83.2185 + (Math.random() - 0.5) * 0.01,
            },
            ward_id: 'GVMC-W12',
            status: 'received',
            reported_at: new Date().toISOString(),
          },
        },
        {
          type: 'sensor.new',
          data: {
            event_id: `SEN-${Date.now().toString(36).toUpperCase()}`,
            asset_id: `CCTV-VZG-${Math.floor(Math.random() * 200)}`,
            event_type: 'road_obstruction',
            location: {
              lat: 17.6871 + (Math.random() - 0.5) * 0.008,
              lng: 83.2183 + (Math.random() - 0.5) * 0.008,
            },
            timestamp: new Date().toISOString(),
            confidence: +(0.6 + Math.random() * 0.35).toFixed(2),
            source: 'COC',
          },
        },
        {
          type: 'team.update',
          data: {
            team_id: `FT-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
            status: ['available', 'en_route', 'on_site', 'done'][Math.floor(Math.random() * 4)],
            location: {
              lat: 17.689 + (Math.random() - 0.5) * 0.012,
              lng: 83.217 + (Math.random() - 0.5) * 0.012,
            },
            updated_at: new Date().toISOString(),
          },
        },
        {
          type: 'assignment.new',
          data: {
            alert_id: `ALR-${Date.now().toString(36).toUpperCase()}`,
            incident_id: `CMP-${Date.now().toString(36).toUpperCase()}`,
            team_id: `FT-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            eta_minutes: Math.floor(Math.random() * 20) + 5,
            issued_at: new Date().toISOString(),
          },
        },
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      onMessageRef.current?.(event);

      // Schedule next event (3-8 seconds)
      const nextDelay = 3000 + Math.random() * 5000;
      mockTimerRef.current = setTimeout(generateEvent, nextDelay);
    };

    // Start after a short delay
    mockTimerRef.current = setTimeout(generateEvent, 2000);
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimerRef.current);
    clearTimeout(mockTimerRef.current);
    wsRef.current?.close();
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      clearTimeout(mockTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, send, disconnect, reconnect: connect };
}
