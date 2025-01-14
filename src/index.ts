import { Builder, Browser, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import edge from 'selenium-webdriver/edge';

import { load } from 'cheerio';

class YoutubeSearch {
    private driver: any;
    private url: string = 'https://www.youtube.com/results?search_query=';

    constructor(browserOption: string, headless: boolean = true, options: Record<any, any> = {}) {
        switch (browserOption) {
            case 'chrome':
                const chromeOptions = new chrome.Options();

                if (headless)
                    chromeOptions.addArguments('--headless');

                for (const key in options) {
                    chromeOptions.addArguments(key);
                }

                this.driver = new Builder()
                    .forBrowser(Browser.CHROME)
                    .setChromeOptions(chromeOptions)
                    .build();
                break;
            case 'firefox':
                const firefoxOptions = new firefox.Options();

                if (headless)
                    firefoxOptions.addArguments('--headless');

                for (const key in options) {
                    firefoxOptions.setPreference(key, options[key]);
                }

                this.driver = new Builder()
                    .forBrowser(Browser.FIREFOX)
                    .setFirefoxOptions(firefoxOptions)
                    .build();
                break;
            case 'edge':
                const edgeOptions = new edge.Options();

                if (headless)
                    edgeOptions.addArguments('--headless');

                for (const key in options) {
                    edgeOptions.set(key, options[key]);
                }

                this.driver = new Builder()
                    .forBrowser(Browser.EDGE)
                    .setEdgeOptions(edgeOptions)
                    .build();
                break;
            default:
                throw new Error('Invalid browser option');
        }
    }

    async search(query: string, max_results: number = 15) {
        await this.driver.get(`${this.url}${query}`);
        await this.driver.wait(until.elementLocated(By.id('video-title')), 10000);

        const data = [];
        while (data.length < max_results) {
            await this.driver.executeScript("window.scrollTo(0, document.getElementsByClassName('ytd-search')[0].scrollHeight)");

            await this.driver.sleep(2000); // wait for 2 seconds

            const videos = await this.driver.findElements({ css: 'ytd-video-renderer' });
            if (videos.length >= max_results) {
                for (const video of videos) {
                    const title = await video.findElement(By.id('video-title')).getAttribute('title');

                    const links = await video.findElements(By.id('video-title'));
                    const link = await links[0].getAttribute('href');
                    const URI = new URL(link);
                    const idLink = URI.searchParams.get('v');

                    const thumbnail = {
                        default: `https://i.ytimg.com/vi/${idLink}/default.jpg`,
                        hq: `https://i.ytimg.com/vi/${idLink}/hqdefault.jpg`,
                        mq: `https://i.ytimg.com/vi/${idLink}/mqdefault.jpg`,
                        sd: `https://i.ytimg.com/vi/${idLink}/sddefault.jpg`,
                        maxres: `https://i.ytimg.com/vi/${idLink}/maxresdefault.jpg`
                    };

                    await this.driver.wait(until.elementLocated(By.css('.badge-shape-wiz__text')), 5000);
                    let time = await video.findElement(By.css('.badge-shape-wiz__text')).getText();
                    if (!time) {
                        const html = await video.getAttribute('outerHTML');
                        const $ = load(html);

                        time = $('span.style-scope.ytd-thumbnail-overlay-time-status-renderer').text().trim();
                    }
                    if (time == 'SHORTS') continue;

                    data.push({
                        title,
                        url: `https://www.youtube.com/watch?v=${idLink}`,
                        id: idLink,
                        thumbnail,
                        duration: time
                    });

                    if (data.length >= max_results)
                        break;
                }
            }
        }

        return {
            videoLength: data.length,
            videos: data
        };
    }
}

export default YoutubeSearch;