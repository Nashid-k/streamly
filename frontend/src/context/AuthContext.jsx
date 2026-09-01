/**
 * AuthContext — provides { user, loading, register, login, logout,
 *                          myList, toggleMyList, isInList,
 *                          continueWatching, updateProgress,
 *                          removeFromContinueWatching }
 *
 * Wrap your app with <AuthProvider> and consume with useAppAuth().
 */
import { createContext, useContext } from "react";
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

  return (
    <AuthContext.Provider
      value={{ ...auth, ...myListData, ...cwData, ...shData, ...notifData }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAppAuth must be used inside <AuthProvider>");
  return ctx;
}
