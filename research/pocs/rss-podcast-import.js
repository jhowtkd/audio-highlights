const Parser = require('rss-parser');

async function poc() {
  const parser = new Parser();
  // Example podcast RSS feed
  const feedUrl = 'https://feeds.simplecast.com/qm_9xx0g';

  try {
    const feed = await parser.parseURL(feedUrl);
    console.log(`Successfully parsed: ${feed.title}`);

    // In the real app, we'd list the episodes
    const latestEpisode = feed.items[0];
    console.log(`Latest Episode: ${latestEpisode.title}`);

    // And this is the URL we'd use for the audio source
    if (latestEpisode.enclosure && latestEpisode.enclosure.url) {
       console.log(`Audio URL ready for import: ${latestEpisode.enclosure.url}`);
    } else {
       console.log('No audio enclosure found for this episode.');
    }
  } catch (error) {
    console.error('Error parsing RSS feed:', error.message);
  }
}

poc();
