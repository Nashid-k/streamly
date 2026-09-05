import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

function safeJsonParse(str, fallback = []) {
  try {
    return JSON.parse(str) ?? fallback;
  } catch {
    return fallback;
  }
}

const dispatchEvent = (eventName) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(eventName));
  }
};

export async function migrateLocalStorageToFirestore(uid) {
  try {
    const localList = safeJsonParse(localStorage.getItem("aios_my_list"), []);
    const localCW = safeJsonParse(
      localStorage.getItem("aios_continue_watching"),
      [],
    );
    const localSH = safeJsonParse(
      localStorage.getItem("aios_search_history"),
      [],
    );
    const localNotifs = safeJsonParse(
      localStorage.getItem("aios_notifications"),
      [],
    );

    if (
      localList.length === 0 &&
      localCW.length === 0 &&
      localSH.length === 0 &&
      localNotifs.length === 0
    )
      return;

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        myList: localList,
        continueWatching: localCW,
        searchHistory: localSH,
        notifications: localNotifs,
        createdAt: Date.now(),
      });
    }

    // Clear localStorage after successful migration to prevent re-migration
    // and stale data confusion
    try {
      localStorage.removeItem("aios_my_list");
      localStorage.removeItem("aios_continue_watching");
      localStorage.removeItem("aios_search_history");
      localStorage.removeItem("aios_notifications");
    } catch {
      // Best-effort cleanup
    }
  } catch {
    // Migration is best-effort — silently ignore failures
  }
}

export class CloudStorageAdapter {
  constructor(uid) {
    this.uid = uid;
    this.ref = doc(db, "users", uid);
    this._cache = null;
    // Multiplexed listeners: every consumer (myList, continueWatching,
    // searchHistory, notifications) subscribes through the same adapter, but
    // only ONE onSnapshot is opened per user doc. Each subscriber gets the
    // full doc snapshot and picks out the slice it needs.
    this._subscribers = new Set();
    this._snapshotUnsub = null;
    this._reconnectPending = false;
    this._reconnectTimeout = null;
  }

  /**
   * Subscribe to real-time Firestore updates.
   * Returns an unsubscribe function.
   */
  subscribe(callback) {
    this._subscribers.add(callback);
    this._ensureListening();
    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      this._subscribers.delete(callback);
      if (this._subscribers.size === 0) this._teardown();
    };
  }

  _ensureListening() {
    if (this._snapshotUnsub || this._subscribers.size === 0 || this._reconnectPending) return;
    const reconnect = () => {
      if (this._reconnectPending) return;
      this._reconnectPending = true;
      this._reconnectTimeout = setTimeout(() => {
        this._reconnectPending = false;
        this._reconnectTimeout = null;
        this._stopListening();
        this._ensureListening();
      }, 3000);
    };
    this._snapshotUnsub = onSnapshot(
      this.ref,
      (snap) => {
        this._cache = snap.exists() ? snap.data() : null;
        const data = this._cache;
        // Copy so a subscriber that unsubscribes mid-iteration can't break us
        for (const cb of Array.from(this._subscribers)) {
          try { cb(data); } catch { /* one bad observer must not kill the stream */ }
        }
      },
      (err) => {
        console.warn("Firestore onSnapshot error:", err);
        // Fix C15: automatically reconnect after transient errors
        if (err.code !== "permission-denied" && err.code !== "not-found") {
          reconnect();
        }
      },
    );
  }

  _stopListening() {
    if (this._snapshotUnsub) {
      this._snapshotUnsub();
      this._snapshotUnsub = null;
    }
  }

  _teardown() {
    if (this._reconnectPending) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectPending = false;
      this._reconnectTimeout = null;
    }
    this._stopListening();
    this._subscribers.clear();
  }

  /** Release every listener and cached state (call on logout). */
  destroy() {
    this._teardown();
    this._cache = null;
  }

  async getDocData() {
    if (this._cache !== null) return this._cache;
    try {
      const snap = await getDoc(this.ref);
      this._cache = snap.exists() ? snap.data() : null;
      return this._cache;
    } catch {
      return null;
    }
  }

  // My List
  async getMyList() {
    const data = await this.getDocData();
    return data?.myList ?? [];
  }
  async addToList(movie) {
    try {
      // Read current list to avoid arrayUnion deep-equality issues with complex objects
      const current = (this._cache?.myList) ?? (await this.getMyList());
      if (current.some((m) => m.id === movie.id)) return; // Already in list
      const updated = [...current, movie];
      await updateDoc(this.ref, { myList: updated });
      if (this._cache) this._cache.myList = updated;
    } catch (e) {
      // Doc might not exist yet
      await setDoc(this.ref, { myList: [movie] }, { merge: true });
    }
  }
  async removeFromList(movie) {
    try {
      // Read current list to avoid arrayRemove deep-equality issues
      const current = (this._cache?.myList) ?? (await this.getMyList());
      const updated = current.filter((m) => m.id !== movie.id);
      await updateDoc(this.ref, { myList: updated });
      if (this._cache) this._cache.myList = updated;
    } catch {}
  }

  // Continue Watching
  async getContinueWatching() {
    const data = await this.getDocData();
    return (data?.continueWatching ?? []).sort(
      (a, b) => b.lastWatched - a.lastWatched,
    );
  }
  async updateContinueWatching(updatedList) {
    try {
      await updateDoc(this.ref, { continueWatching: updatedList });
    } catch {
      await setDoc(
        this.ref,
        { continueWatching: updatedList },
        { merge: true },
      );
    }
  }

  // Search History
  async getSearchHistory() {
    const data = await this.getDocData();
    return data?.searchHistory ?? [];
  }
  async updateSearchHistory(updatedList) {
    try {
      await updateDoc(this.ref, { searchHistory: updatedList });
    } catch {
      await setDoc(this.ref, { searchHistory: updatedList }, { merge: true });
    }
  }

  // Notifications
  async getNotifications() {
    const data = await this.getDocData();
    return data?.notifications ?? [];
  }
  async updateNotifications(updatedList) {
    try {
      await updateDoc(this.ref, { notifications: updatedList });
    } catch {
      await setDoc(this.ref, { notifications: updatedList }, { merge: true });
    }
  }
}

class LocalStorageAdapter {
  async getMyList() {
    return safeJsonParse(localStorage.getItem("aios_my_list"), []);
  }
  async addToList(movie) {
    const list = await this.getMyList();
    if (!list.find((m) => m.id === movie.id)) {
      localStorage.setItem("aios_my_list", JSON.stringify([...list, movie]));
      dispatchEvent("aios_sync_mylist");
    }
  }
  async removeFromList(movie) {
    const list = await this.getMyList();
    localStorage.setItem(
      "aios_my_list",
      JSON.stringify(list.filter((m) => m.id !== movie.id)),
    );
    dispatchEvent("aios_sync_mylist");
  }

  async getContinueWatching() {
    return safeJsonParse(localStorage.getItem("aios_continue_watching"), []);
  }
  async updateContinueWatching(updatedList) {
    localStorage.setItem("aios_continue_watching", JSON.stringify(updatedList));
    dispatchEvent("aios_sync_cw");
  }

  async getSearchHistory() {
    return safeJsonParse(localStorage.getItem("aios_search_history"), []);
  }
  async updateSearchHistory(updatedList) {
    localStorage.setItem("aios_search_history", JSON.stringify(updatedList));
    dispatchEvent("aios_sync_sh");
  }

  async getNotifications() {
    return safeJsonParse(localStorage.getItem("aios_notifications"), []);
  }
  async updateNotifications(updatedList) {
    localStorage.setItem("aios_notifications", JSON.stringify(updatedList));
    dispatchEvent("aios_sync_notif");
  }
}

// Cache adapter instances by uid to avoid creating new ones on every call
const adapterCache = new Map();
let localAdapter = null;

/** Clear cached adapter instances (call on logout) */
export function clearAdapterCache() {
  // Unsubscribe any active Firestore listeners
  for (const adapter of adapterCache.values()) {
    if (typeof adapter.destroy === "function") adapter.destroy();
    else if (adapter._snapshotUnsub) adapter._snapshotUnsub();
  }
  adapterCache.clear();
  localAdapter = null;
}

export function getStorageAdapter(user) {
  if (!user) {
    if (!localAdapter) localAdapter = new LocalStorageAdapter();
    return localAdapter;
  }
  if (!adapterCache.has(user.uid)) {
    adapterCache.set(user.uid, new CloudStorageAdapter(user.uid));
  }
  return adapterCache.get(user.uid);
}
