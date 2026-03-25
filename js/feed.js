/**
 * Git-Stream Feed Module
 * Fetches GitHub Topics RSS feeds via a CORS proxy and parses them.
 */

// CORS proxy for RSS fetching
const PROXY = 'https://api.allorigins.win/get?url=';

// GitHub Topics RSS endpoint template
function topicFeedUrl(topic) {
  return `https://github.com/topics/${encodeURIComponent(topic)}.atom`;
}

// GitHub Explore feeds (trending repos) — uses GitHub's trending page
const EXPLORE_FEEDS = {
  ai:   'https://github.com/topics/artificial-intelligence.atom',
  ml:   'https://github.com/topics/machine-learning.atom',
  os:   'https://github.com/topics/operating-system.atom',
  games:'https://github.com/topics/game.atom',
  tools:'https://github.com/topics/developer-tools.atom',
  web:  'https://github.com/topics/web.atom',
  mobile:'https://github.com/topics/android.atom',
  crypto:'https://github.com/topics/blockchain.atom',
  music:'https://github.com/topics/music.atom',
  art:  'https://github.com/topics/generative-art.atom',
};

/**
 * Fetch and parse an Atom/RSS feed URL.
 * @param {string} feedUrl - The feed URL to fetch
 * @returns {Promise<Array>} Array of feed item objects
 */
async function fetchFeed(feedUrl) {
  const proxyUrl = PROXY + encodeURIComponent(feedUrl);
  const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  if (!data.contents) throw new Error('Empty proxy response');

  return parseFeed(data.contents);
}

/**
 * Parse XML feed string (Atom or RSS) into items array.
 * @param {string} xmlStr - Raw XML string
 * @returns {Array} Parsed items
 */
function parseFeed(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'text/xml');

  if (doc.querySelector('parsererror')) {
    throw new Error('Feed parse error');
  }

  // Detect Atom vs RSS
  const isAtom = !!doc.querySelector('feed');
  const items = [];

  if (isAtom) {
    const entries = doc.querySelectorAll('entry');
    entries.forEach((entry) => {
      const link = entry.querySelector('link[rel="alternate"]')?.getAttribute('href')
        || entry.querySelector('link')?.getAttribute('href') || '#';
      const summary = entry.querySelector('summary')?.textContent || '';
      const content = entry.querySelector('content')?.textContent || summary;
      const updated = entry.querySelector('updated')?.textContent || '';

      // Extract repo language from content
      const langMatch = content.match(/Primary language:\s*<[^>]*>([^<]+)/i);
      const starsMatch = content.match(/([\d,]+)\s*stars/i);

      items.push({
        id:      entry.querySelector('id')?.textContent || link,
        title:   entry.querySelector('title')?.textContent?.trim() || 'Untitled',
        link,
        desc:    stripHtml(summary || content).slice(0, 280),
        date:    updated ? new Date(updated) : null,
        lang:    langMatch ? langMatch[1].trim() : null,
        stars:   starsMatch ? starsMatch[1] : null,
      });
    });
  } else {
    const entries = doc.querySelectorAll('item');
    entries.forEach((entry) => {
      const link = entry.querySelector('link')?.textContent || '#';
      const desc = entry.querySelector('description')?.textContent || '';
      const pubDate = entry.querySelector('pubDate')?.textContent || '';

      items.push({
        id:      link,
        title:   entry.querySelector('title')?.textContent?.trim() || 'Untitled',
        link,
        desc:    stripHtml(desc).slice(0, 280),
        date:    pubDate ? new Date(pubDate) : null,
        lang:    null,
        stars:   null,
      });
    });
  }

  return items;
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Relative time formatter.
 * @param {Date|null} date
 * @returns {string}
 */
function relativeTime(date) {
  if (!date || isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Load feed for a category key.
 * @param {string} cat - Category key (must exist in EXPLORE_FEEDS)
 * @returns {Promise<Array>}
 */
async function loadCategory(cat) {
  const url = EXPLORE_FEEDS[cat] || topicFeedUrl(cat);
  return fetchFeed(url);
}

export { loadCategory, relativeTime, EXPLORE_FEEDS };
