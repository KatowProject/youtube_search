# Youtube Search Selenium
Simple search on youtube using selenium

## Requirements
- Node.js 22.x.x

## Installation
```bash
npm install yt-search-selenium
```

## Example
```js
const YoutubeSearch = require('yt-search-selenium');

(async () => {
    const YTS = new YoutubeSearch('edge', true);

    const o = await YTS.search('windah', 100);
    console.log(o);
})()

```