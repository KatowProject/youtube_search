import { Builder, Browser, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import edge from 'selenium-webdriver/edge';
import safari from 'selenium-webdriver/safari';
import { load } from 'cheerio';

import { SearchResult, Thumbnail, Video } from './index.d';
class YoutubeSearch {
    private driver: WebDriver;
    private url: string = 'https://www.youtube.com/results?search_query=';

    constructor(browserOption: string, headless: boolean = true, options: Record<string, any> = {}) {
        this.driver = this.setupDriver(browserOption, headless, options);
    }

    private setupDriver(browserOption: string, headless: boolean, options: Record<string, any>): WebDriver {
        switch (browserOption.toLowerCase()) {
            case 'chrome':
                return this.setupChromeDriver(headless, options);
            case 'firefox':
                return this.setupFirefoxDriver(headless, options);
            case 'edge':
                return this.setupEdgeDriver(headless, options);
            case 'safari':
                return this.setupSafariDriver(options);
            default:
                throw new Error('Invalid browser option');
        }
    }

    private setupChromeDriver(headless: boolean, options: Record<string, any>): WebDriver {
        const chromeOptions = new chrome.Options();
        if (headless) chromeOptions.addArguments('--headless');
        for (const key in options) chromeOptions.addArguments(key);
        return new Builder().forBrowser(Browser.CHROME).setChromeOptions(chromeOptions).build();
    }

    private setupFirefoxDriver(headless: boolean, options: Record<string, any>): WebDriver {
        const firefoxOptions = new firefox.Options();
        if (headless) firefoxOptions.addArguments('--headless');
        for (const key in options) firefoxOptions.setPreference(key, options[key]);
        return new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(firefoxOptions).build();
    }

    private setupEdgeDriver(headless: boolean, options: Record<string, any>): WebDriver {
        const edgeOptions = new edge.Options();
        if (headless) edgeOptions.addArguments('--headless');
        for (const key in options) edgeOptions.set(key, options[key]);
        return new Builder().forBrowser(Browser.EDGE).setEdgeOptions(edgeOptions).build();
    }

    private setupSafariDriver(options: Record<string, any>): WebDriver {
        const safariOptions = new safari.Options();
        for (const key in options) safariOptions.set(key, options[key]);
        return new Builder().forBrowser(Browser.SAFARI).setSafariOptions(safariOptions).build();
    }

    async search(query: string, maxResults: number = 15): Promise<SearchResult> {
        await this.driver.get(`${this.url}${query}`);
        await this.driver.wait(until.elementLocated(By.id('video-title')), 10000);

        const data: Video[] = [];
        while (data.length < maxResults) {
            await this.driver.executeScript("window.scrollTo(0, document.getElementsByClassName('ytd-search')[0].scrollHeight)");
            await this.driver.sleep(2000); // wait for 2 seconds

            const videos = await this.driver.findElements(By.css('ytd-video-renderer'));
            for (const video of videos) {
                if (data.length >= maxResults) break;

                const title = await video.findElement(By.id('video-title')).getAttribute('title');
                const link = await video.findElement(By.id('video-title')).getAttribute('href');
                const URI = new URL(link);
                const idLink = URI.searchParams.get('v');

                const thumbnail: Thumbnail = {
                    default: `https://i.ytimg.com/vi/${idLink}/default.jpg`,
                    hq: `https://i.ytimg.com/vi/${idLink}/hqdefault.jpg`,
                    mq: `https://i.ytimg.com/vi/${idLink}/mqdefault.jpg`,
                    sd: `https://i.ytimg.com/vi/${idLink}/sddefault.jpg`,
                    maxres: `https://i.ytimg.com/vi/${idLink}/maxresdefault.jpg`
                }

                let time = await video.findElement(By.css('.badge-shape-wiz__text')).getText();
                if (time == "") {
                    const html = await video.getAttribute('outerHTML');
                    const $ = load(html);
                    time = $('span.style-scope.ytd-thumbnail-overlay-time-status-renderer').text().trim();
                }

                if (time === 'SHORTS') continue;

                data.push({
                    title,
                    url: `https://www.youtube.com/watch?v=${idLink}`,
                    id: idLink as string,
                    thumbnail,
                    duration: time
                });
            }
        }

        return {
            videoLength: data.length,
            videos: data
        };
    }
}

module.exports = YoutubeSearch;
export default YoutubeSearch;