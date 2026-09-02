import { User, UserPreferences, UserProfile, ContinueWatchingItem } from "../users.types";
export declare class FirestoreAdapter {
    private readonly logger;
    private db;
    private readonly uid;
    private user;
    init(): Promise<void>;
    getUser(): User;
    setCurrentProfile(profileId: string): UserProfile;
    getMyList(): string[];
    toggleMyList(movieId: string): {
        myList: string[];
        isSaved: boolean;
    };
    updatePreferences(preferences: any): UserPreferences;
    getContinueWatching(): ContinueWatchingItem[];
    updateContinueWatching(item: ContinueWatchingItem): ContinueWatchingItem[];
    removeContinueWatching(movieId: string): ContinueWatchingItem[];
}
