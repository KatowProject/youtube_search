const YoutubeSearch = require('yt-search-selenium');

(async () => {
    const YTS = new YoutubeSearch('edge', true);

    const o = await YTS.search('windah', 100);
    console.log(o);
})()