# Youtube Search Selenium
Simple search on youtube using selenium

## Requirements
- Node.js 22.x.x

## Installation
```bash
npm install
```

## Example
```js
const YoutubeSearch = require('youtube_search').default;

(async () => {
    const YTS = new YoutubeSearch('edge', true);

    const o = await YTS.search('windah', 100);
    console.log(o);
})()

```