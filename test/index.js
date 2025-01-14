const YoutubeSearch = require('../dist/index').default;

(async () => {
    const YTS = new YoutubeSearch('edge', true);

    const o = await YTS.search('windah', 100);
    console.log(o);
})()