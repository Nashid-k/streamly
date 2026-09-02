import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { clearAdapterCache } from "./storageAdapter";

export class AuthAdapter {
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  static async register(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Create initial user doc
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

    await setDoc(doc(db, "users", cred.user.uid), {
      myList: [],
      continueWatching: [],
      searchHistory: [],
      notifications: welcomeNotif,
      createdAt: Date.now(),
    });

    return cred.user;
  }

  static async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  static async logout() {
    clearAdapterCache();
    return signOut(auth);
  }
}
