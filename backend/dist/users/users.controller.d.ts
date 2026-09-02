import { UsersService } from "./users.service";
import { ContinueWatchingItem } from "./users.types";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUser(): import("./users.types").User;
    switchProfile(profileId: string): import("./users.types").UserProfile;
    getMyList(): string[];
    toggleMyList(movieId: string): {
        myList: string[];
        isSaved: boolean;
    };
    updatePreferences(prefs: any): import("./users.types").UserPreferences;
    getContinueWatching(): ContinueWatchingItem[];
    updateContinueWatching(item: ContinueWatchingItem): ContinueWatchingItem[];
    removeContinueWatching(movieId: string): ContinueWatchingItem[];
}
