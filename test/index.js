const YoutubeSearch = require('../dist/index').default;

(async () => {
    const YTS = new YoutubeSearch('chrome', true);

    const o = await YTS.search('test', 15);
    console.log(o);
})()