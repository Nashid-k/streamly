import { FirebaseAdminService } from "../firebase/firebase.module";
import type { DecodedIdToken } from "firebase-admin/auth";
import { ContinueWatchingItem } from "./auth.types";
export declare class AuthService {
    private readonly firebase;
    private readonly logger;
    constructor(firebase: FirebaseAdminService);
    verifyToken(idToken: string): Promise<DecodedIdToken>;
    getProfile(uid: string): Promise<{
        uid: string;
        email: string;
        displayName: string;
        photoURL: string;
        createdAt: string;
    }>;
    private userRef;
    getContinueWatching(uid: string): Promise<ContinueWatchingItem[]>;
    updateContinueWatching(uid: string, item: ContinueWatchingItem): Promise<ContinueWatchingItem[]>;
    removeContinueWatching(uid: string, movieId: string): Promise<ContinueWatchingItem[]>;
    getMyList(uid: string): Promise<any[]>;
    toggleMyList(uid: string, movie: any): Promise<{
        myList: any[];
        isSaved: boolean;
    }>;
}
