import { AuthService } from "./auth.service";
import { ContinueWatchingItem } from "./auth.types";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getMe(authorization?: string): Promise<{
        uid: string;
        email: string;
        displayName: string;
        photoURL: string;
        createdAt: string;
    }>;
    getMyList(authorization?: string): Promise<any[]>;
    toggleMyList(authorization: string, movie: any): Promise<{
        myList: any[];
        isSaved: boolean;
    }>;
    getContinueWatching(authorization?: string): Promise<ContinueWatchingItem[]>;
    updateContinueWatching(authorization: string, item: ContinueWatchingItem): Promise<ContinueWatchingItem[]>;
    removeContinueWatching(authorization: string, movieId: string): Promise<ContinueWatchingItem[]>;
}
