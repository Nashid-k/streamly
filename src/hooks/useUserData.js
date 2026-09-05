import { useState, useEffect, useCallback, useRef } from "react";
import { AuthAdapter } from "../api/authAdapter";
import {
  getStorageAdapter,
  migrateLocalStorageToFirestore,
} from "../api/storageAdapter";
import { buildWelcomeNotification, isNotificationTypeEnabled } from "../utils/notificationEngine";

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

  // Fix C3: userRef ensures adapter is always resolved with the latest user at call-time,
  // not the user captured when the useCallback was created
  const userRef = useRef(user);
  userRef.current = user;

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

  // Use ref to avoid stale closures — only depends on user, not myList
  const myListRef = useRef(myList);
  myListRef.current = myList;

  const toggleMyList = useCallback(
    async (movie) => {
      const previousList = myListRef.current;
      const exists = previousList.some((m) => m.id === movie.id);
      const newList = exists
        ? previousList.filter((m) => m.id !== movie.id)
        : [...previousList, movie];

      // Optimistic update
      setMyList(newList);

      // Fix C3: Capture adapter at call-time using ref
      const adapter = getStorageAdapter(userRef.current);
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
    [], // No dependencies — uses refs for everything
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

  // Fix C3-C5: userRef for fresh adapter at call-time
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const adapter = getStorageAdapter(user);

    if (user && adapter.subscribe) {
      // Live sync through the shared Firestore snapshot (multiplexed in the adapter)
      const unsub = adapter.subscribe((data) => {
        setContinueWatching(
          (data?.continueWatching ?? []).sort(
            (a, b) => b.lastWatched - a.lastWatched,
          ),
        );
      });
      return unsub;
    }

    adapter.getContinueWatching().then(setContinueWatching);
    const handleSync = () =>
      adapter.getContinueWatching().then(setContinueWatching);
    window.addEventListener("aios_sync_cw", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("aios_sync_cw", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [user]);

  // Debounced Firestore write — prevents race conditions from rapid updates
  const cwWriteTimerRef = useRef(null);
  const cwPendingRef = useRef(null);

  const flushCW = useCallback(() => {
    if (cwPendingRef.current) {
      const list = cwPendingRef.current;
      cwPendingRef.current = null;
      getStorageAdapter(userRef.current)
        .updateContinueWatching(list)
        .catch(() => {});
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (cwWriteTimerRef.current) {
        clearTimeout(cwWriteTimerRef.current);
        flushCW(); // Flush any pending writes
      }
    };
  }, [flushCW]);

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
        const updatedList = [newItem, ...filtered].slice(0, 20);
        // Queue Firestore write (debounced — latest list wins)
        cwPendingRef.current = updatedList;
        if (cwWriteTimerRef.current) clearTimeout(cwWriteTimerRef.current);
        cwWriteTimerRef.current = setTimeout(flushCW, 3000);
        return updatedList;
      });
    },
    [flushCW],
  );

  const removeFromContinueWatching = useCallback(
    async (movieId) => {
      let updatedList;

      setContinueWatching((prev) => {
        updatedList = prev.filter((m) => m.id !== movieId);
        return updatedList;
      });

      // Fix C4: Capture adapter at call-time using ref
      if (updatedList) {
        getStorageAdapter(userRef.current)
          .updateContinueWatching(updatedList)
          .catch(() => {});
      }
    },
    [], // No dependencies — uses refs
  );

  const clearContinueWatching = useCallback(async () => {
    setContinueWatching([]);
    // Fix C5: Capture adapter at call-time using ref
    getStorageAdapter(userRef.current)
      .updateContinueWatching([])
      .catch(() => {});
  }, []); // No dependencies — uses refs

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

  // Fix C6: userRef for fresh adapter at call-time
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const adapter = getStorageAdapter(user);

    if (user && adapter.subscribe) {
      // Live sync through the shared Firestore snapshot (multiplexed in the adapter)
      const unsub = adapter.subscribe((data) => {
        setSearchHistory(data?.searchHistory ?? []);
      });
      return unsub;
    }

    adapter.getSearchHistory().then(setSearchHistory);
    const handleSync = () =>
      adapter.getSearchHistory().then(setSearchHistory);
    window.addEventListener("aios_sync_sh", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("aios_sync_sh", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [user]);

  const addSearch = useCallback(
    async (query) => {
      const term = query.trim();
      if (!term) return;

      let updatedList;
      setSearchHistory((prev) => {
        const filtered = prev.filter(
          (t) => t.toLowerCase() !== term.toLowerCase(),
        );
        updatedList = [term, ...filtered].slice(0, 10);
        return updatedList;
      });

      // Fix C6: Capture adapter at call-time using ref
      if (updatedList) {
        getStorageAdapter(userRef.current)
          .updateSearchHistory(updatedList)
          .catch(() => {});
      }
    },
    [], // No dependencies — uses refs
  );

  const removeSearch = useCallback(
    async (query) => {
      let updatedList;
      setSearchHistory((prev) => {
        updatedList = prev.filter((t) => t !== query);
        return updatedList;
      });

      // Fix C6: Capture adapter at call-time using ref
      if (updatedList) {
        getStorageAdapter(userRef.current)
          .updateSearchHistory(updatedList)
          .catch(() => {});
      }
    },
    [], // No dependencies — uses refs
  );

  const clearSearchHistory = useCallback(async () => {
    setSearchHistory([]);
    // Fix C6: Capture adapter at call-time using ref
    getStorageAdapter(userRef.current)
      .updateSearchHistory([])
      .catch(() => {});
  }, []); // No dependencies — uses refs

  return { searchHistory, addSearch, removeSearch, clearSearchHistory };
}

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);

  // Fix C7: userRef for fresh adapter at call-time
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const adapter = getStorageAdapter(user);

    if (user && adapter.subscribe) {
      const unsub = adapter.subscribe((data) => {
        const stored = data?.notifications ?? [];
        if (stored.length > 0) {
          setNotifications(stored);
        } else {
          const welcomeNotif = [buildWelcomeNotification({ isSignedIn: true })];
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
          const welcomeNotif = [buildWelcomeNotification({ isSignedIn: false })];
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
      // Check notification preferences before adding
      if (notif.type && !isNotificationTypeEnabled(notif.type)) return;

      const newNotif = {
        id: notif.id || (Date.now().toString() + Math.random().toString(36).substring(2, 7)),
        createdAt: Date.now(),
        isRead: false,
        ...notif,
      };

      let updatedList;
      setNotifications((prev) => {
        // Deduplicate by ID
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        updatedList = [newNotif, ...prev].slice(0, 50);
        return updatedList;
      });

      if (updatedList) {
        getStorageAdapter(userRef.current)
          .updateNotifications(updatedList)
          .catch(() => {});
      }
    },
    [],
  );

  const addNotifications = useCallback(
    async (newNotifs) => {
      if (!newNotifs || newNotifs.length === 0) return;
      // Only add notifications whose types are enabled
      const enabled = newNotifs.filter((n) => !n.type || isNotificationTypeEnabled(n.type));
      if (enabled.length === 0) return;

      let updatedList;
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const fresh = enabled.filter((n) => !existingIds.has(n.id));
        if (fresh.length === 0) return prev;
        updatedList = [...fresh, ...prev].slice(0, 50);
        return updatedList;
      });

      if (updatedList) {
        getStorageAdapter(userRef.current)
          .updateNotifications(updatedList)
          .catch(() => {});
      }
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    let updatedList;
    setNotifications((prev) => {
      // Check inside updater for consistency (uses prev, not stale state)
      if (prev.every((n) => n.isRead)) return prev;
      updatedList = prev.map((n) => ({ ...n, isRead: true }));
      return updatedList;
    });

    // Fix C7: Capture adapter at call-time using ref
    if (updatedList) {
      getStorageAdapter(userRef.current)
        .updateNotifications(updatedList)
        .catch(() => {});
    }
  }, []); // No dependencies — uses refs

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    // Fix C7: Capture adapter at call-time using ref
    getStorageAdapter(userRef.current)
      .updateNotifications([])
      .catch(() => {});
  }, []); // No dependencies — uses refs

  return { notifications, addNotification, addNotifications, markAllAsRead, clearNotifications };
}
