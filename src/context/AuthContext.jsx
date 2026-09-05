/**
 * AuthContext — provides { user, loading, register, login, logout,
 *                          myList, toggleMyList, isInList,
 *                          continueWatching, updateProgress,
 *                          removeFromContinueWatching }
 *
 * Wrap your app with <AuthProvider> and consume with useAppAuth().
 */
import { createContext, useContext, useMemo } from "react";
import {
  useAuth,
  useMyList,
  useContinueWatching,
  useSearchHistory,
  useNotifications,
} from "../hooks/useUserData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuth();
  const myListData = useMyList(auth.user);
  const cwData = useContinueWatching(auth.user);
  const shData = useSearchHistory(auth.user);
  const notifData = useNotifications(auth.user);

  // Fix C10: memoize to prevent context value from being a new object every render,
  // which causes all consumers to re-render unnecessarily
  const value = useMemo(
    () => ({ ...auth, ...myListData, ...cwData, ...shData, ...notifData }),
    [auth, myListData, cwData, shData, notifData],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook shares a module with its provider so consumers get both from one import
export function useAppAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAppAuth must be used inside <AuthProvider>");
  return ctx;
}
