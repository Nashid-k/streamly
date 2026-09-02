import { Response } from "express";
import { MoviesService } from "./movies.service";
import { Movie, Category } from "./movies.types";
export declare class MoviesController {
    private readonly moviesService;
    constructor(moviesService: MoviesService);
    getAllMovies(res: Response, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<Movie[]>;
    getFeatured(res: Response, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio" | "all"): Promise<Movie[]>;
    getCategories(res: Response, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio" | "all"): Promise<Category[]>;
    getTop10(res: Response, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<Movie[]>;
    searchMovies(res: Response, query?: string, genre?: string, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<{
        movies: Movie[];
        actor?: any;
    }>;
    getPerson(res: Response, personId: string): Promise<{
        id: any;
        name: any;
        biography: any;
        profileUrl: string;
        knownFor: any;
        birthday: any;
        placeOfBirth: any;
        credits: any;
    }>;
    getStreamUrl(res: Response, id: string, server?: string, season?: string, episode?: string, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<{
        url: string;
    }>;
    getMovieById(res: Response, id: string, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<Movie>;
    getSimilar(res: Response, id: string, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<Movie[]>;
    getSeasonEpisodes(res: Response, id: string, seasonNumber: string, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<import("./movies.types").Episode[]>;
    getRecommendations(res: Response, id: string, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<Movie[]>;
    getIntroTimings(res: Response, id: string, season?: string, episode?: string, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<{
        hasIntro: boolean;
        startSeconds: number;
        endSeconds: number;
    }>;
    getExternalIds(res: Response, id: string, platform?: "netflix" | "prime" | "hotstar" | "appletv" | "zee5" | "sonyliv" | "jio"): Promise<any>;
}
