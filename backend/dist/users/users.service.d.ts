import { OnModuleInit } from "@nestjs/common";
import { User, UserProfile, ContinueWatchingItem, UserPreferences } from "./users.types";
export declare class UsersService implements OnModuleInit {
    private readonly logger;
    private adapter;
    onModuleInit(): Promise<void>;
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
