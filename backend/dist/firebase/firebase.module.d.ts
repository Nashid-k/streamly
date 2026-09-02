import type { DecodedIdToken } from "firebase-admin/auth";
export declare class FirebaseAdminService {
    readonly auth: import("firebase-admin/auth").Auth;
    readonly firestore: FirebaseFirestore.Firestore;
    verifyIdToken(idToken: string): Promise<DecodedIdToken>;
}
export declare class FirebaseModule {
}
