import { User, UserPreferences, UserProfile, ContinueWatchingItem } from "../users.types";
export declare class JsonAdapter {
    private readonly logger;
    private isWriting;
    private pendingWrite;
    private readonly statePath;
    private readonly user;
    init(): Promise<void>;
    private persist;
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
