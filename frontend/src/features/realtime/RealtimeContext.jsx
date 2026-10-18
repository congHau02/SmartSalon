import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "../branch/useBranch";
import { playNotificationChime } from "./audioChime";

const RealtimeContext = createContext(null);

const STORAGE_KEY_SOUND = "smartsalon_sound_enabled";

export function RealtimeProvider({ children }) {
  const queryClient = useQueryClient();
  const { selectedBranchId, selectedBranch } = useBranch();

  const [connectionStatus, setConnectionStatus] = useState("connecting"); // 'connected' | 'connecting' | 'disconnected'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToasts, setActiveToasts] = useState([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SOUND);
    return saved !== null ? saved === "true" : true;
  });

  const stompClientRef = useRef(null);
  const bookingSubRef = useRef(null);
  const dispatchSubRef = useRef(null);
  const isSoundRef = useRef(isSoundEnabled);

  useEffect(() => {
    isSoundRef.current = isSoundEnabled;
    localStorage.setItem(STORAGE_KEY_SOUND, String(isSoundEnabled));
  }, [isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => !prev);
  }, []);

  const dismissToast = useCallback((toastId) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const handleIncomingEvent = useCallback(
    (event, channelType) => {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const formattedItem = {
        id: notificationId,
        channelType,
        eventType: event.eventType || "NOTIFICATION",
        branchId: event.branchId,
        code: event.code || event.referenceId || "EVENT",
        title: event.title || "Thông báo hệ thống",
        message: event.message || "Có hoạt động mới vừa phát sinh",
        timestamp: event.timestamp || new Date().toISOString(),
        data: event.data || {},
        isRead: false,
      };

      // 1. Prepend to notification list (keep latest 50)
      setNotifications((prev) => [formattedItem, ...prev.slice(0, 49)]);
      setUnreadCount((prev) => prev + 1);

      // 2. Play sound chime
      if (isSoundRef.current) {
        playNotificationChime();
      }

      // 3. Show floating toast (auto-dismiss after 6s)
      setActiveToasts((prev) => [formattedItem, ...prev.slice(0, 3)]);
      setTimeout(() => {
        dismissToast(formattedItem.id);
      }, 6000);

      // 4. Invalidate TanStack Query caches so UI updates immediately
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    [queryClient, dismissToast]
  );

  // Initialize and maintain STOMP Client
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => {
        return new SockJS("/ws");
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnectionStatus("connected");
      },
      onDisconnect: () => {
        setConnectionStatus("disconnected");
      },
      onStompError: (frame) => {
        console.warn("[STOMP Broker Error]", frame.headers?.message);
        setConnectionStatus("disconnected");
      },
      onWebSocketClose: () => {
        setConnectionStatus("connecting");
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      if (bookingSubRef.current) {
        bookingSubRef.current.unsubscribe();
        bookingSubRef.current = null;
      }
      if (dispatchSubRef.current) {
        dispatchSubRef.current.unsubscribe();
        dispatchSubRef.current = null;
      }
      client.deactivate();
    };
  }, []);

  // Subscribe to branch-scoped topics whenever selectedBranchId or connection state changes
  useEffect(() => {
    const client = stompClientRef.current;
    if (!client || !client.connected || !selectedBranchId) {
      return;
    }

    // Unsubscribe previous topics
    if (bookingSubRef.current) {
      bookingSubRef.current.unsubscribe();
      bookingSubRef.current = null;
    }
    if (dispatchSubRef.current) {
      dispatchSubRef.current.unsubscribe();
      dispatchSubRef.current = null;
    }

    // 1. Subscribe to Bookings Topic
    const bookingsTopic = `/topic/branch/${selectedBranchId}/bookings`;
    bookingSubRef.current = client.subscribe(bookingsTopic, (msg) => {
      try {
        const payload = JSON.parse(msg.body);
        handleIncomingEvent(payload, "booking");
      } catch (err) {
        console.error("Failed to parse booking WebSocket payload:", err);
      }
    });

    // 2. Subscribe to POS Dispatch Topic
    const dispatchTopic = `/topic/branch/${selectedBranchId}/dispatch`;
    dispatchSubRef.current = client.subscribe(dispatchTopic, (msg) => {
      try {
        const payload = JSON.parse(msg.body);
        handleIncomingEvent(payload, "dispatch");
      } catch (err) {
        console.error("Failed to parse dispatch WebSocket payload:", err);
      }
    });

    return () => {
      if (bookingSubRef.current) {
        bookingSubRef.current.unsubscribe();
        bookingSubRef.current = null;
      }
      if (dispatchSubRef.current) {
        dispatchSubRef.current.unsubscribe();
        dispatchSubRef.current = null;
      }
    };
  }, [connectionStatus, selectedBranchId, handleIncomingEvent]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = {
    connectionStatus,
    selectedBranchId,
    selectedBranchName: selectedBranch?.name || "",
    notifications,
    unreadCount,
    activeToasts,
    isSoundEnabled,
    toggleSound,
    dismissToast,
    markAllAsRead,
    markAsRead,
    clearAll,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
