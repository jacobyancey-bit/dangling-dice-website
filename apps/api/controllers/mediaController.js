import { Ytdl, Quality } from '@distube/ytdl-core';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

// Multi-client Ytdl engine configured for TV, Mobile Web, and Embedded pathways
// (Bypasses YouTube datacenter bot detection & Cloudflare timeouts)
const ytdl = new Ytdl({
  clients: ['tv', 'mweb', 'web_embedded', 'web_music'],
});

// URL Validator & SSRF Guardrail
function isValidMediaUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    const host = parsed.hostname.toLowerCase();
    
    // Check against localhost, internal IPs, and metadata endpoints
    const forbidden = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
    if (forbidden.includes(host) || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local')) {
      return false;
    }
    
    // Allow YouTube, SoundCloud, or direct audio/video links
    const isYouTube = host.includes('youtube.com') || host.includes('youtu.be');
    const isSoundCloud = host.includes('soundcloud.com');
    const isDirectMedia = parsed.pathname.match(/\.(mp3|mp4|wav|m4a|aac|ogg|webm)$/i);

    return isYouTube || isSoundCloud || isDirectMedia;
  } catch {
    return false;
  }
}

function sanitizeFilename(name) {
  if (!name) return 'media_export';
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 80) || 'media_export';
}

function extractYouTubeId(urlStr) {
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('/')[0].split('?')[0];
    }
    if (parsed.pathname.includes('/shorts/')) {
      return parsed.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

async function fetchOEmbedMetadata(canonicalUrl) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * @desc    Resolve media metadata (title, duration, thumbnail) from URL
 * @route   POST /api/media/resolve
 * @access  Public
 */
export const resolveMediaInfo = async (req, res) => {
  const { url, format = 'mp3' } = req.body || {};

  if (!url || !isValidMediaUrl(url)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or unsupported media URL. Please provide a valid YouTube or creator audio URL.',
    });
  }

  // Normalize YouTube URLs to clean canonical format
  const ytid = extractYouTubeId(url);
  const targetUrl = ytid ? `https://www.youtube.com/watch?v=${ytid}` : url.trim();
  const ext = String(format).startsWith('mp4') ? 'mp4' : 'mp3';

  try {
    // Race ytdl.getInfo against a 5-second timeout with fallback to instant oEmbed
    const infoPromise = ytdl.getInfo(targetUrl);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('RESOLVE_TIMEOUT')), 5000)
    );

    let info;
    try {
      info = await Promise.race([infoPromise, timeoutPromise]);
    } catch {
      info = null;
    }

    if (info && info.videoDetails) {
      const videoDetails = info.videoDetails;
      const durationSeconds = parseInt(videoDetails.lengthSeconds, 10) || 0;

      if (durationSeconds > 1200) {
        return res.status(400).json({
          success: false,
          message: 'Media duration exceeds maximum allowed length of 20 minutes for free public conversion.',
        });
      }

      const cleanTitle = sanitizeFilename(videoDetails.title);
      const thumbnail = videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '';

      return res.status(200).json({
        success: true,
        data: {
          title: videoDetails.title || 'Audio Track',
          cleanTitle: `${cleanTitle}.${ext}`,
          author: videoDetails.author?.name || 'Creator',
          durationSeconds,
          thumbnail,
          downloadUrl: `/api/media/download?url=${encodeURIComponent(targetUrl)}&format=${encodeURIComponent(format)}&title=${encodeURIComponent(cleanTitle)}`,
        },
      });
    }

    // Instant Fallback: Use YouTube oEmbed if ytdl is slow or rate-limited
    const oembed = ytid ? await fetchOEmbedMetadata(targetUrl) : null;
    if (oembed) {
      const cleanTitle = sanitizeFilename(oembed.title);
      return res.status(200).json({
        success: true,
        data: {
          title: oembed.title || 'Audio Track',
          cleanTitle: `${cleanTitle}.${ext}`,
          author: oembed.author_name || 'Creator',
          durationSeconds: 180,
          thumbnail: oembed.thumbnail_url || `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`,
          downloadUrl: `/api/media/download?url=${encodeURIComponent(targetUrl)}&format=${encodeURIComponent(format)}&title=${encodeURIComponent(cleanTitle)}`,
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to extract media information from provider. Please check the URL or try another link.',
    });
  } catch (err) {
    console.error('[MediaController Resolve Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to extract media information from provider. Please check the URL or try another link.',
    });
  }
};

/**
 * @desc    Stream extracted audio/video directly to client download
 * @route   GET /api/media/download
 * @access  Public
 */
export const streamMediaDownload = async (req, res) => {
  const { url, format = 'mp3', title = 'media_export' } = req.query || {};

  if (!url || !isValidMediaUrl(url)) {
    return res.status(400).send('Invalid or unauthorized media URL');
  }

  const ytid = extractYouTubeId(url);
  const targetUrl = ytid ? `https://www.youtube.com/watch?v=${ytid}` : url.trim();

  try {
    const cleanName = sanitizeFilename(title);
    const isMp4 = String(format).startsWith('mp4');
    const ext = isMp4 ? 'mp4' : 'mp3';

    // Set download headers immediately
    res.setHeader('Content-Disposition', `attachment; filename="${cleanName}.${ext}"`);
    res.setHeader('Content-Type', isMp4 ? 'video/mp4' : 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');

    if (isMp4) {
      // MP4 Streaming Transcoding Pipeline (Fragmented MP4 for clean browser stream)
      const videoStream = ytdl.download(targetUrl, {
        quality: Quality.HighestVideo,
        filter: { hasVideo: true },
      });

      const ffmpeg = spawn(ffmpegPath, [
        '-i', 'pipe:0',
        '-c', 'copy',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-f', 'mp4',
        'pipe:1',
      ]);

      videoStream.pipe(ffmpeg.stdin);
      ffmpeg.stdout.pipe(res);

      req.on('close', () => {
        if (!videoStream.destroyed) videoStream.destroy();
        try { ffmpeg.kill(); } catch (e) {}
      });

      videoStream.on('error', (err) => {
        console.error('[Video Stream Error]', err.message);
        try { ffmpeg.kill(); } catch (e) {}
        if (!res.headersSent) res.status(500).send('Stream error');
      });

      ffmpeg.on('error', (err) => {
        console.error('[FFmpeg Error]', err.message);
        if (!res.headersSent) res.status(500).send('Transcoding pipeline error');
      });
    } else {
      // Genuine LAME MP3 Transcoding Pipeline with ID3v2 metadata
      const bitrate = format === 'mp3-192' ? '192k' : '320k';
      const audioStream = ytdl.download(targetUrl, {
        quality: Quality.HighestAudio,
        filter: { hasAudio: true },
      });

      const ffmpeg = spawn(ffmpegPath, [
        '-i', 'pipe:0',
        '-vn',
        '-acodec', 'libmp3lame',
        '-b:a', bitrate,
        '-id3v2_version', '3',
        '-write_id3v1', '1',
        '-f', 'mp3',
        'pipe:1',
      ]);

      audioStream.pipe(ffmpeg.stdin);
      ffmpeg.stdout.pipe(res);

      req.on('close', () => {
        if (!audioStream.destroyed) audioStream.destroy();
        try { ffmpeg.kill(); } catch (e) {}
      });

      audioStream.on('error', (err) => {
        console.error('[Audio Stream Error]', err.message);
        try { ffmpeg.kill(); } catch (e) {}
        if (!res.headersSent) res.status(500).send('Stream error');
      });

      ffmpeg.on('error', (err) => {
        console.error('[FFmpeg Error]', err.message);
        if (!res.headersSent) res.status(500).send('Transcoding pipeline error');
      });
    }
  } catch (err) {
    console.error('[MediaController Download Error]', err.message);
    if (!res.headersSent) {
      res.status(500).send('Failed to stream media from provider');
    }
  }
};

