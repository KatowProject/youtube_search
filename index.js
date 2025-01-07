const yts = require('yt-search');
const ytsearch = require('@neeraj-x0/ytsearch');
const { Builder, Browser, By, until } = require('selenium-webdriver');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/search', async (req, res) => {
    const { query, max_results } = req.query;
    try {
        const result = await yts({ pageStart: 3, pageEnd: 10, query });
        const videos = result.videos.slice(0, max_results || 10);

        res.json({
            totalResults: result.videos.length,
            videos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while searching.' });
    }
});

app.get('/searchv2', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await ytsearch(query);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while searching.' });
    }
});

app.get('/search-selenium', async (req, res) => {
    const { query, max_results } = req.query;
    try {
        const videos = await seleniumYoutubeSearch(query, max_results);
        res.json({
            totalResults: videos.length,
            videos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while searching.' });
    }
});

async function getThumbnail(video) {
    const selectors = [
        '#thumbnail > yt-image > img',
        'img#img',
        '#thumbnail img'
    ];

    for (const selector of selectors) {
        try {
            const thumbnailElement = await video.findElement(By.css(selector));
            return await thumbnailElement.getAttribute('src');
        } catch (e) {
            // Continue to the next selector
        }
    }

    return 'Thumbnail not available';
}

async function seleniumYoutubeSearch(query, max_results = 25) {
    let driver;
    try {
        driver = await new Builder().forBrowser(Browser.EDGE).build();
        await driver.get('https://www.youtube.com/results?search_query=' + query);
        await driver.wait(until.elementLocated(By.id('video-title')), 10000);

        const data = [];
        let lastHeight = await driver.executeScript("return document.documentElement.scrollHeight");

        while (data.length < max_results) {
            // scroll down to load more results
            await driver.executeScript("window.scrollTo(0, document.documentElement.scrollHeight);");

            // wait for results to load
            await driver.sleep(2000); // wait for 2 seconds

            // get video titles
            const videos = await driver.findElements({ css: 'ytd-video-renderer' });

            for (const video of videos) {
                const title = await video.findElement(By.id('video-title')).getAttribute('title');
                const link = await video.findElement(By.id('video-title')).getAttribute('href');
                const thumbnail = await getThumbnail(video);
                const durations = await video.findElements(By.className('badge-shape-wiz__text'));
                const time = durations.length > 0 ? await durations[0].getText() : 'Unknown';

                data.push({
                    title,
                    url: link,
                    thumbnail,
                    duration: time
                });

                if (data.length >= max_results) {
                    break;
                }
            }

            let newHeight = await driver.executeScript("return document.documentElement.scrollHeight");
            if (newHeight === lastHeight) {
                break; // no more content to load
            }
            lastHeight = newHeight;
        }

        return data;
    } catch (error) {
        console.error('Error during Selenium YouTube search:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on http://localhost:${PORT}`));