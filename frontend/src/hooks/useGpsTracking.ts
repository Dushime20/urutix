/**
 * useGpsTracking — sends GPS coordinates via the /tracking WebSocket
 * while a trip is ACTIVE.  Falls back to the HTTP endpoint if the
 * socket is unavailable.
 *
 * Usage:
 *   const { isTracking, currentPosition, startTracking, stopTracking } =
 *     useGpsTracking({ tripId, driverId, enabled });
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { getApiBaseUrl } from '../config/environment';

export interface GpsPosition {
  latitude: number;
  longitude: number;
  speed?: number;          // km/h
  heading?: number;        // degrees
  accuracy?: number;       // metres
  batteryLevel?: number;   // 0-100
  isMoving: boolean;
  timestamp: Date;
}

interface UseGpsTrackingOptions {
  tripId: string;
  driverId: string;
  /** Set to false to pause tracking without unmounting the hook */
  enabled?: boolean;
  /** How often to send a location update (ms). Default 20 000 */
  intervalMs?: number;
}

interface UseGpsTrackingResult {
  isTracking: boolean;
  currentPosition: GpsPosition | null;
  error: string | null;
  /** GPS accuracy in metres (null = unknown) */
  accuracy: number | null;
}

const DEFAULT_INTERVAL_MS = 20_000;

export function useGpsTracking({
  tripId,
  driverId,
  enabled = true,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseGpsTrackingOptions): UseGpsTrackingResult {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<GpsPosition | null>(null);

  // ── Connect / disconnect Socket.io ─────────────────────────────────────
  useEffect(() => {
    if (!enabled || !tripId || !driverId) return;

    const token = localStorage.getItem('accessToken') || localStorage.getItem('jwtToken');
    if (!token) return;

    const baseUrl = getApiBaseUrl().replace('/api', '');
    const socket = io(`${baseUrl}/tracking`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[GPS] Tracking socket connected');
      socket.emit('join:trip', { tripId });
    });

    socket.on('connect_error', (err) => {
      console.warn('[GPS] Socket connection error, will use HTTP fallback:', err.message);
    });

    socket.on('location:confirmed', () => {
      // server acknowledged our update
    });

    socket.on('error', (err: any) => {
      console.error('[GPS] Socket error:', err);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave:trip', { tripId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, tripId, driverId]);

  // ── Send a single position update ──────────────────────────────────────
  const sendPosition = useCallback(
    async (pos: GpsPosition) => {
      const payload = {
        tripId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        heading: pos.heading,
        accuracy: pos.accuracy,
        batteryLevel: pos.batteryLevel,
        isMoving: pos.isMoving,
        timestamp: pos.timestamp.toISOString(),
      };

      // Prefer WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit('location:update', payload);
      } else {
        // HTTP fallback
        try {
          await api.post(`/trips/${tripId}/location`, payload);
        } catch (err) {
          console.warn('[GPS] HTTP fallback failed:', err);
        }
      }
    },
    [tripId],
  );

  // ── Start GPS watchPosition ─────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !tripId || !driverId) {
      setIsTracking(false);
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this device');
      return;
    }

    let lastSentAt = 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (rawPos) => {
        const pos: GpsPosition = {
          latitude: rawPos.coords.latitude,
          longitude: rawPos.coords.longitude,
          speed: rawPos.coords.speed != null
            ? Math.round(rawPos.coords.speed * 3.6)   // m/s → km/h
            : undefined,
          heading: rawPos.coords.heading ?? undefined,
          accuracy: rawPos.coords.accuracy,
          isMoving: (rawPos.coords.speed ?? 0) > 0.5,
          timestamp: new Date(rawPos.timestamp),
        };

        lastPositionRef.current = pos;
        setCurrentPosition(pos);
        setAccuracy(rawPos.coords.accuracy);
        setIsTracking(true);
        setError(null);

        // Throttle sends to intervalMs
        const now = Date.now();
        if (now - lastSentAt >= intervalMs) {
          lastSentAt = now;
          sendPosition(pos);
        }
      },
      (err) => {
        setError(`GPS error: ${err.message}`);
        setIsTracking(false);
        console.error('[GPS] watchPosition error:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 15_000,
      },
    );

    // Belt-and-suspenders: also send on a fixed interval so we always
    // transmit even when the device hasn't moved (heartbeat)
    intervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendPosition({ ...lastPositionRef.current, timestamp: new Date() });
      }
    }, intervalMs);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsTracking(false);
    };
  }, [enabled, tripId, driverId, intervalMs, sendPosition]);

  return { isTracking, currentPosition, error, accuracy };
}
