import { useState, useEffect, useCallback } from "react";
import { AuthAdapter } from "../api/authAdapter";
import {
  getStorageAdapter,
  migrateLocalStorageToFirestore,
} from "../api/storageAdapter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeJsonParse(str, fallback = []) {
  try {
    return JSON.parse(str) ?? fallback;
  } catch {
    return fallback;
  }
}

// ─── useAuth ──────────────────────────────────────────────────────────────────

export function useAuth() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = AuthAdapter.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await migrateLocalStorageToFirestore(firebaseUser.uid);
      }
      setUser(firebaseUser ?? null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = useCallback(async (email, password, name) => {
    return AuthAdapter.register(email, password, name);
  }, []);

  const login = useCallback(async (email, password) => {
    return AuthAdapter.login(email, password);
  }, []);

  const logout = useCallback(() => AuthAdapter.logout(), []);

  return { user, loading, register, login, logout };
}

export function useMyList(user) {
  const [myList, setMyList] = useState([]);

  useEffect(() => {
    const adapter = getStorageAdapter(user);

    if (user && adapter.subscribe) {
      const unsub = adapter.subscribe((data) => {
        setMyList(data?.myList ?? []);
      });
      return unsub;
    } else {
      adapter.getMyList().then(setMyList);
      const handleSync = () => adapter.getMyList().then(setMyList);
      window.addEventListener("aios_sync_mylist", handleSync);
      window.addEventListener("storage", handleSync);
      return () => {
        window.removeEventListener("aios_sync_mylist", handleSync);
        window.removeEventListener("storage", handleSync);
      };
    }
  }, [user]);

  const myListRef = useRef(myList);
  myListRef.current = myList;

  const toggleMyList = useCallback(
    async (movie) => {
      const previousList = myListRef.current;
      const exists = previousList.some((m) => m.id === movie.id);
      const newList = exists
        ? previousList.filter((m) => m.id !== movie.id)
        : [...previousList, movie];

      setMyList(newList);

      const adapter = getStorageAdapter(user);
      try {
        if (exists) {
          await adapter.removeFromList(movie);
        } else {
          await adapter.addToList(movie);
        }
      } catch {
        // Revert to the snapshot taken before the optimistic update
        setMyList(previousList);
      }
    },
    [myList, user],
  );

  const isInList = useCallback(
    (id) => myList.some((m) => m.id === id),
    [myList],
  );

  return { myList, toggleMyList, isInList };
}

// ─── useContinueWatching ─────────────────────────────────────────────────────

export function useContinueWatching(user) {
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    const adapter = getStorageAdapter(user);
    adapter.getContinueWatching().then(setContinueWatching);

    if (!user) {
      const handleSync = () =>
        adapter.getContinueWatching().then(setContinueWatching);
      window.addEventListener("aios_sync_cw", handleSync);
      window.addEventListener("storage", handleSync);
      return () => {
        window.removeEventListener("aios_sync_cw", handleSync);
        window.removeEventListener("storage", handleSync);
      };
    }
  }, [user]);

  const updateProgress = useCallback(
    async (movie, season = null, episode = null, timestamp = null) => {
      setContinueWatching((prev) => {
        const existing = prev.find((m) => m.id === movie.id);
        const finalTimestamp =
          timestamp !== null ? timestamp : existing ? existing.timestamp : null;
        const newItem = {
          ...movie,
          lastWatched: Date.now(),
          savedSeason: season,
          savedEpisode: episode,
          timestamp: finalTimestamp,
        };
        const filtered = prev.filter((m) => m.id !== movie.id);
        const updated = [newItem, ...filtered].slice(0, 20);
        getStorageAdapter(user)
          .updateContinueWatching(updated)
          .catch(() => {});
        return updated;
      });
    },
    [user],
  );

  const removeFromContinueWatching = useCallback(
    async (movieId) => {
      setContinueWatching((prev) => {
        const updated = prev.filter((m) => m.id !== movieId);
        getStorageAdapter(user)
          .updateContinueWatching(updated)
          .catch(() => {});
        return updated;
      });
    },
    [user],
  );

  const clearContinueWatching = useCallback(async () => {
    setContinueWatching([]);
    getStorageAdapter(user)
      .updateContinueWatching([])
      .catch(() => {});
  }, [user]);

  return {
    continueWatching,
    updateProgress,
    removeFromContinueWatching,
    clearContinueWatching,
  };
}

// ─── useSearchHistory ────────────────────────────────────────────────────────
export function useSearchHistory(user) {
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    const adapter = getStorageAdapter(user);
    adapter.getSearchHistory().then(setSearchHistory);

    if (!user) {
      const handleSync = () =>
        adapter.getSearchHistory().then(setSearchHistory);
      window.addEventListener("aios_sync_sh", handleSync);
      window.addEventListener("storage", handleSync);
      return () => {
        window.removeEventListener("aios_sync_sh", handleSync);
        window.removeEventListener("storage", handleSync);
      };
    }
  }, [user]);

  const addSearch = useCallback(
    async (query) => {
      const term = query.trim();
      if (!term) return;
      setSearchHistory((prev) => {
        const filtered = prev.filter(
          (t) => t.toLowerCase() !== term.toLowerCase(),
        );
        const updated = [term, ...filtered].slice(0, 10);
        getStorageAdapter(user)
          .updateSearchHistory(updated)
          .catch(() => {});
        return updated;
      });
    },
    [user],
  );

  const removeSearch = useCallback(
    async (query) => {
      setSearchHistory((prev) => {
        const updated = prev.filter((t) => t !== query);
        getStorageAdapter(user)
          .updateSearchHistory(updated)
          .catch(() => {});
        return updated;
      });
    },
    [user],
  );

  const clearSearchHistory = useCallback(async () => {
    setSearchHistory([]);
    getStorageAdapter(user)
      .updateSearchHistory([])
      .catch(() => {});
  }, [user]);

  return { searchHistory, addSearch, removeSearch, clearSearchHistory };
}

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const adapter = getStorageAdapter(user);

    if (user && adapter.subscribe) {
      const unsub = adapter.subscribe((data) => {
        const stored = data?.notifications ?? [];
        if (stored.length > 0) {
          setNotifications(stored);
        } else {
          const welcomeNotif = [
            {
              id: "welcome-" + Date.now(),
              title: "Welcome to Streamly!",
              message:
                "Start exploring personalized content from 7 different platforms.",
              link: "/",
              createdAt: Date.now(),
              isRead: false,
            },
          ];
          setNotifications(welcomeNotif);
          adapter.updateNotifications(welcomeNotif).catch(() => {});
        }
      });
      return unsub;
    } else {
      adapter.getNotifications().then((stored) => {
        if (stored && stored.length > 0) {
          setNotifications(stored);
        } else {
          const welcomeNotif = [
            {
              id: "welcome-" + Date.now(),
              title: "Welcome to Streamly!",
              message:
                "Sign in to sync your watch history and lists across devices.",
              link: "/",
              createdAt: Date.now(),
              isRead: false,
            },
          ];
          setNotifications(welcomeNotif);
          adapter.updateNotifications(welcomeNotif).catch(() => {});
        }
      });

      const handleSync = () =>
        adapter.getNotifications().then(setNotifications);
      window.addEventListener("aios_sync_notif", handleSync);
      window.addEventListener("storage", handleSync);
      return () => {
        window.removeEventListener("aios_sync_notif", handleSync);
        window.removeEventListener("storage", handleSync);
      };
    }
  }, [user]);

  const addNotification = useCallback(
    async (notif) => {
      const newNotif = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        createdAt: Date.now(),
        isRead: false,
        ...notif,
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev].slice(0, 30);
        getStorageAdapter(user)
          .updateNotifications(updated)
          .catch(() => {});
        return updated;
      });
    },
    [user],
  );

  const markAllAsRead = useCallback(async () => {
    if (notifications.every((n) => n.isRead)) return;
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      getStorageAdapter(user)
        .updateNotifications(updated)
        .catch(() => {});
      return updated;
    });
  }, [notifications, user]);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    getStorageAdapter(user)
      .updateNotifications([])
      .catch(() => {});
  }, [user]);

  return { notifications, addNotification, markAllAsRead, clearNotifications };
}
