import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "xeno_read_notifications";

function getReadNotifications(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      return new Set(parsed);
    }
  } catch {
    // Ignore parsing errors
  }
  return new Set();
}

function saveReadNotifications(readIds: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(readIds)));
  } catch {
    // Ignore storage errors
  }
}

export function useNotificationState() {
  const [readIds, setReadIds] = useState<Set<string>>(getReadNotifications);

  useEffect(() => {
    saveReadNotifications(readIds);
  }, [readIds]);

  const markAsRead = useCallback((ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const markAllAsRead = useCallback((ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const clearReadState = useCallback(() => {
    setReadIds(new Set());
  }, []);

  return {
    readIds,
    markAsRead,
    markAllAsRead,
    isRead,
    clearReadState,
  };
}
