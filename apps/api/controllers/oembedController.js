/**
 * Dangling Dice Studios™ - oEmbed Discovery Provider
 * Complies with the oEmbed 1.0 Specification (https://oembed.com/)
 * Powers interactive rich previews across Discord, Reddit, Twitter/X, Slack, and Telegram.
 */

export const getOEmbed = (req, res) => {
  const targetUrl = req.query.url || 'https://dangling-dice-studios.com/';
  const format = (req.query.format || 'json').toLowerCase();

  if (format !== 'json') {
    return res.status(501).json({ error: 'Unsupported format. Only JSON is supported.' });
  }

  const isMediaConverter = targetUrl.includes('media.') || targetUrl.includes('convert');
  const isVpn = targetUrl.includes('vpn');
  const isMongo = targetUrl.includes('mongo');

  let title = 'Dangling Dice Studios™ | Lo-Fi Beat Radio, Phone Apps & Dev Tools';
  let description = 'Where beat production meets code craft, phone apps, and developer tools.';
  let embedHtml = '<iframe src="https://www.youtube.com/embed/2J-U0EUATHs?list=PLAg2ptU_xF5c&autoplay=1" width="480" height="270" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';

  if (isMediaConverter) {
    title = 'Dangling Dice Media Converter | Fast YouTube to MP3 (320kbps) & MP4';
    description = 'High-speed client-side media converter. 1-click clean YouTube audio extraction without popups.';
    embedHtml = '<iframe src="https://media.dangling-dice-studios.com/" width="480" height="320" frameborder="0"></iframe>';
  } else if (isVpn) {
    title = 'Dangling Dice WireGuard VPN & Network Leak Shield';
    description = 'Instant in-kernel WireGuard client configuration generator. 100% free and client-side.';
  } else if (isMongo) {
    title = 'MongoDB Connection URI & Query Inspector';
    description = 'Client-side connection string sanitizer, password-escaping detector, and .env generator.';
  }

  const oembedResponse = {
    type: 'rich',
    version: '1.0',
    title,
    description,
    author_name: 'Jacob Yancey (Dangling Dice Studios™)',
    author_url: 'https://www.youtube.com/@danglingdicestudios',
    provider_name: 'Dangling Dice Studios™',
    provider_url: 'https://dangling-dice-studios.com/',
    thumbnail_url: 'https://dangling-dice-studios.com/images/banner.jpg',
    thumbnail_width: 1200,
    thumbnail_height: 630,
    html: embedHtml,
    width: 480,
    height: 270,
    cache_age: 86400,
  };

  res.setHeader('Content-Type', 'application/json+oembed; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).json(oembedResponse);
};
