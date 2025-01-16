import { WebDriver } from 'selenium-webdriver';

interface Thumbnail {
    default: string;
    hq: string;
    mq: string;
    sd: string;
    maxres: string;
}

interface Video {
    title: string;
    url: string;
    id: string;
    thumbnail: Thumbnail;
    duration: string;
}

interface SearchResult {
    videoLength: number;
    videos: Video[];
}

declare module 'yt-search-selenium' {
    class YoutubeSearch {
        private driver: WebDriver;
        private url: string;

        constructor(browserOption: string, headless?: boolean, options?: Record<string, any>);

        private setupDriver(browserOption: string, headless: boolean, options: Record<string, any>): WebDriver;
        private setupChromeDriver(headless: boolean, options: Record<string, any>): WebDriver;
        private setupFirefoxDriver(headless: boolean, options: Record<string, any>): WebDriver;
        private setupEdgeDriver(headless: boolean, options: Record<string, any>): WebDriver;
        private setupSafariDriver(options: Record<string, any>): WebDriver;

        search(query: string, maxResults?: number): Promise<SearchResult>;
    }

    export = YoutubeSearch;
}