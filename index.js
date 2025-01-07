const yts = require('yt-search');
const ytsearch = require('@neeraj-x0/ytsearch');
const { Builder, Browser, By, Key, until } = require('selenium-webdriver')
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cheerio = require('cheerio');

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


async function seleniumYoutubeSearch(query, max_results = 25) {
    let driver;
    try {
        driver = await new Builder().forBrowser(Browser.EDGE).build();
        await driver.get('https://www.youtube.com/results?search_query=' + query);
        await driver.wait(until.elementLocated(By.id('video-title')), 10000);

        const data = [];
        while (data.length < max_results) {
            await driver.executeScript("window.scrollTo(0, document.getElementsByClassName('ytd-search')[0].scrollHeight)");

            await driver.sleep(2000); // wait for 2 seconds

            const videos = await driver.findElements({ css: 'ytd-video-renderer' });
            console.log(videos.length);
            if (videos.length >= max_results) {
                for (const video of videos) {
                    const title = await video.findElement(By.id('video-title')).getAttribute('title');

                    const links = await video.findElements(By.id('video-title'));
                    const link = await links[0].getAttribute('href');
                    const URI = new URL(link);
                    const idLink = URI.searchParams.get('v');

                    const thumbnail = `https://i.ytimg.com/vi/${idLink}/hqdefault.jpg`;

                    await driver.wait(until.elementLocated(By.css('.badge-shape-wiz__text')), 5000);
                    let time = await video.findElement(By.css('.badge-shape-wiz__text')).getText();
                    if (!time) {
                        const html = await video.getAttribute('outerHTML');
                        const $ = cheerio.load(html);

                        time = $('span.style-scope.ytd-thumbnail-overlay-time-status-renderer').text().trim();
                    }

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
            // for (const video of videos) {

            //     const title = await video.findElement(By.id('video-title')).getAttribute('title');

            //     const links = await video.findElements(By.id('video-title'));
            //     const link = await links[0].getAttribute('href');
            //     const URI = new URL(link);
            //     const idLink = URI.searchParams.get('v');

            //     const thumbnail = `https://i.ytimg.com/vi/${idLink}/hqdefault.jpg`;

            //     await driver.wait(until.elementLocated(By.css('.badge-shape-wiz__text')), 5000);
            //     let time = await video.findElement(By.css('.badge-shape-wiz__text')).getText();
            //     if (!time) time = await video.findElement(By.xpath("//span[@class='style-scope ytd-thumbnail-overlay-time-status-renderer']")).getText();

            //     data.push({
            //         title,
            //         url: `https://www.youtube.com/watch?v=${idLink}`,
            //         id: idLink,
            //         thumbnail,
            //         duration: time
            //     });

            //     if (data.length >= max_results) {
            //         break;
            //     }
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

// ...existing code...
app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on http://localhost:${PORT}`));