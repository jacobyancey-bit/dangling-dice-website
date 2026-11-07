import { Ytdl, Quality } from '@distube/ytdl-core';

const ytdl = new Ytdl();

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

  try {
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails || {};

    const durationSeconds = parseInt(videoDetails.lengthSeconds, 10) || 0;
    // Guardrail: Max 20 minutes to prevent resource exhaustion
    if (durationSeconds > 1200) {
      return res.status(400).json({
        success: false,
        message: 'Media duration exceeds maximum allowed length of 20 minutes for free public conversion.',
      });
    }

    const cleanTitle = sanitizeFilename(videoDetails.title);
    const ext = String(format).startsWith('mp4') ? 'mp4' : 'mp3';
    const thumbnail = videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '';

    return res.status(200).json({
      success: true,
      data: {
        title: videoDetails.title || 'Audio Track',
        cleanTitle: `${cleanTitle}.${ext}`,
        author: videoDetails.author?.name || 'Creator',
        durationSeconds,
        thumbnail,
        downloadUrl: `/api/media/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}&title=${encodeURIComponent(cleanTitle)}`,
      },
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

  try {
    const info = await ytdl.getInfo(url);
    const cleanName = sanitizeFilename(title);
    const isMp4 = String(format).startsWith('mp4');
    const ext = isMp4 ? 'mp4' : 'mp3';

    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${cleanName}.${ext}"`);
    res.setHeader('Content-Type', isMp4 ? 'video/mp4' : 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');

    let downloadFilter;
    let downloadQuality;

    if (isMp4) {
      const hasCombined = info.formats.some((f) => f.hasAudio && f.hasVideo);
      downloadFilter = hasCombined
        ? { hasAudio: true, hasVideo: true }
        : { hasVideo: true };
      downloadQuality = Quality.HighestVideo;
    } else {
      downloadFilter = { hasAudio: true, hasVideo: false };
      downloadQuality = Quality.HighestAudio;
    }

    const stream = ytdl.download(info, {
      quality: downloadQuality,
      filter: downloadFilter,
    });

    req.on('close', () => {
      if (stream && !stream.destroyed) {
        stream.destroy();
      }
    });

    stream.on('error', (err) => {
      console.error('[Stream Error]', err.message);
      if (!res.headersSent) {
        res.status(500).send('Media stream extraction error');
      }
    });

    stream.pipe(res);
  } catch (err) {
    console.error('[MediaController Download Error]', err.message);
    if (!res.headersSent) {
      res.status(500).send('Failed to stream media from provider');
    }
  }
};

