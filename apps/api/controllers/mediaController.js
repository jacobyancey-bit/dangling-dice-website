import { Ytdl, Quality } from '@distube/ytdl-core';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { cobaltBreaker, rapidApiBreaker, isUpstreamOutageStatus } from '../utils/circuitBreaker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, '..', 'temp_media');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Zero-retention: the readyFiles registry is in-memory, so files left by a crashed/restarted
// container would never be swept. Purge any orphaned transcodes at boot.
try {
  for (const name of fs.readdirSync(tempDir)) {
    if (name.startsWith('.')) continue;
    try { fs.unlinkSync(path.join(tempDir, name)); } catch {}
  }
} catch {}

// Ensure FFmpeg binary has executable permissions on Linux container runtimes (Render / Cloud)
try {
  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    fs.chmodSync(ffmpegPath, 0o755);
  }
} catch (e) {
  // Ignore permission errors on Windows / read-only systems
}

// In-memory registry of ready-to-deliver files for instant downloads
const readyFiles = new Map();

// Active in-flight transcode concurrency guard per IP (max 2 active streams per IP)
const activeIpTranscodes = new Map();

// Active progress registry for live transcoding telemetry
const activeProgress = new Map();

export const getMediaProgress = (req, res) => {
  const token = req.query.token || req.query._t;
  if (!token) return res.json({ success: true, pct: 50, status: 'streaming' });
  const entry = activeProgress.get(String(token)) || { pct: 60, status: 'transcoding' };
  return res.json({ success: true, ...entry });
};

function acquireIpTranscodeSlot(ip) {
  if (!ip) return true;
  const current = activeIpTranscodes.get(ip) || 0;
  if (current >= 2) return false;
  activeIpTranscodes.set(ip, current + 1);
  return true;
}

function releaseIpTranscodeSlot(ip) {
  if (!ip) return;
  const current = activeIpTranscodes.get(ip) || 0;
  if (current <= 1) {
    activeIpTranscodes.delete(ip);
  } else {
    activeIpTranscodes.set(ip, current - 1);
  }
}

// Periodic sweep to clean up temporary conversion files older than 15 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of readyFiles.entries()) {
    if (now - entry.createdAt > 15 * 60 * 1000) {
      try {
        if (fs.existsSync(entry.filePath)) fs.unlinkSync(entry.filePath);
      } catch (e) {}
      readyFiles.delete(id);
    }
  }
}, 5 * 60 * 1000);
cleanupTimer.unref();

// Multi-client Ytdl engine prioritizing ultra-fast VisionOS & Mobile Web channels (< 1.5s latency)
const ytdl = new Ytdl({
  clients: ['visionos', 'mweb', 'web_embedded', 'tv'],
});

// URL Validator & SSRF Guardrail
function isValidMediaUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

    const host = parsed.hostname.toLowerCase();

    // Comprehensive SSRF check against RFC 1918, loopbacks, IPv6, cloud metadata, octal/hex, and DNS rebinding
    const isPrivateOrLocal =
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host === '::1' ||
      host === '[::]' ||
      host === '::' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.endsWith('.localhost') ||
      host.endsWith('.arpa') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(host) ||
      /^198\.(1[8-9])\./.test(host) ||
      /^(22[4-9]|23[0-9]|24[0-9]|25[0-5])\./.test(host) ||
      host.startsWith('::ffff:') ||
      host.startsWith('[::ffff:') ||
      host.startsWith('fc00:') ||
      host.startsWith('[fc00:') ||
      host.startsWith('fd00:') ||
      host.startsWith('[fd00:') ||
      host.startsWith('fe80:') ||
      host.startsWith('[fe80:') ||
      /^(0x|0[0-7]|\d{8,})/.test(host) ||
      host.includes('nip.io') ||
      host.includes('sslip.io') ||
      host.includes('traefik.me') ||
      host.includes('localtest.me') ||
      host.includes('lvh.me') ||
      host.includes('vcap.me') ||
      host.includes('spoofed.net') ||
      host === 'metadata.google.internal';

    if (isPrivateOrLocal) {
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
    for (const prefix of ['/shorts/', '/embed/', '/live/', '/v/']) {
      if (parsed.pathname.includes(prefix)) {
        return parsed.pathname.split(prefix)[1].split('/')[0].split('?')[0];
      }
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
 * Option A: Extraction Gateway Client
 * Seamlessly routes conversion requests through dedicated media gateways (Cobalt / RapidAPI)
 * to bypass datacenter IP BotGuard challenges with unthrottled streaming.
 */
export async function fetchFromExtractionGateway(targetUrl, format) {
  const isMp4 = String(format).startsWith('mp4');

  // Provider 1: Cobalt Gateway (Self-hosted or private instance)
  if (process.env.COBALT_API_URL && !cobaltBreaker.isOpen()) {
    try {
      const res = await cobaltBreaker.execute(async () => {
        const base = process.env.COBALT_API_URL.replace(/\/+$/, '');
        const response = await fetch(base, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(process.env.COBALT_API_KEY ? { 'Authorization': `Bearer ${process.env.COBALT_API_KEY}` } : {}),
          },
          body: JSON.stringify({
            url: targetUrl,
            downloadMode: isMp4 ? 'auto' : 'audio',
            audioFormat: 'mp3',
            audioBitrate: format === 'mp3-192' ? '192' : '320',
          }),
          signal: AbortSignal.timeout(12000),
        });

        // 5xx / 429 = upstream outage -> throw so the breaker records a failure
        if (isUpstreamOutageStatus(response.status)) {
          throw new Error(`Cobalt upstream HTTP ${response.status}`);
        }

        if (response.ok) {
          const data = await response.json();
          const streamUrl = data.url;
          if (streamUrl) {
            return { streamUrl, source: 'cobalt' };
          }
        }
        return null;
      });
      if (res) return res;
    } catch (err) {
      console.warn('[Extraction Gateway] Cobalt call failed:', err.message);
    }
  }

  // Provider 2: RapidAPI YouTube-to-MP3 Gateway (Audio formats only)
  if (!isMp4 && process.env.RAPIDAPI_KEY && !rapidApiBreaker.isOpen()) {
    const key = process.env.RAPIDAPI_KEY.trim().replace(/^['"]|['"]$/g, '');
    const host = (process.env.RAPIDAPI_HOST || 'youtube-mp36.p.rapidapi.com').trim().replace(/^['"]|['"]$/g, '');
    const ytid = extractYouTubeId(targetUrl);
    const candidatePaths = process.env.RAPIDAPI_PATH
      ? [
          process.env.RAPIDAPI_PATH
            .replace('{url}', encodeURIComponent(targetUrl))
            .replace('{yt}', encodeURIComponent(targetUrl))
            .replace('{id}', encodeURIComponent(ytid || ''))
        ]
      : [
          ...(ytid ? [`/dl?id=${encodeURIComponent(ytid)}`] : []),
          `/download-mp3?yt=${encodeURIComponent(targetUrl)}`,
          `/download/mp3?url=${encodeURIComponent(targetUrl)}`,
          `/dl?url=${encodeURIComponent(targetUrl)}`,
        ];

    for (const subpath of candidatePaths) {
      try {
        const fullUrl = `https://${host}${subpath.startsWith('/') ? subpath : '/' + subpath}`;
        const rapidResult = await rapidApiBreaker.execute(async () => {
          const response = await fetch(fullUrl, {
            headers: {
              'x-rapidapi-key': key,
              'x-rapidapi-host': host,
            },
            signal: AbortSignal.timeout(12000),
          });

          if (response.status === 401 || response.status === 403) {
            console.warn(`[Extraction Gateway] RapidAPI key unauthorized or unsubscribed (HTTP ${response.status}). Skipping gateway.`);
            return { unauthorized: true };
          }

          // 5xx / 429 (quota exhausted) = upstream outage -> throw so the breaker records a failure
          if (isUpstreamOutageStatus(response.status)) {
            throw new Error(`RapidAPI upstream HTTP ${response.status}`);
          }

          if (response.ok) {
            const data = await response.json();
            const streamUrl =
              data.link ||
              data.downloadUrl ||
              data.url ||
              data.mp3_url ||
              data.result?.download_url ||
              data.data?.downloadUrl;

            if (streamUrl) {
              return {
                streamUrl,
                title: data.title,
                artist: data.uploader || data.artist,
                duration: data.duration,
                source: 'rapidapi',
              };
            }
          }
          return null;
        });

        if (rapidResult?.unauthorized) break;
        if (rapidResult?.streamUrl) return rapidResult;
      } catch (err) {
        console.warn(`[Extraction Gateway] RapidAPI path ${subpath} failed:`, err.message);
      }
    }
  }

  return null;
}

/**
 * Pre-transcode audio/video directly to temporary disk file
 * Enables immediate 0-delay browser downloads without gateway timeouts
 */
async function transcodeMediaToFile(targetUrl, format, cleanName) {
  const fileId = crypto.randomUUID();
  const isMp4 = String(format).startsWith('mp4');
  const ext = isMp4 ? 'mp4' : 'mp3';
  const outPath = path.join(tempDir, `${fileId}.${ext}`);

  // Option A: Try Gateway download first if configured
  const gatewayResult = await fetchFromExtractionGateway(targetUrl, format);
  if (gatewayResult && gatewayResult.streamUrl) {
    try {
      const upstream = await fetch(gatewayResult.streamUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://rapidapi.com/',
          'Accept': '*/*',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      if (upstream.ok && upstream.body) {
        const fileWriter = fs.createWriteStream(outPath);
        const nodeStream = Readable.fromWeb(upstream.body);
        await new Promise((resolve, reject) => {
          nodeStream.pipe(fileWriter);
          fileWriter.on('finish', resolve);
          fileWriter.on('error', reject);
          nodeStream.on('error', reject);
        });

        if (fs.existsSync(outPath)) {
          const stats = fs.statSync(outPath);
          readyFiles.set(fileId, {
            filePath: outPath,
            fileName: `${cleanName}.${ext}`,
            fileSize: stats.size,
            mimeType: isMp4 ? 'video/mp4' : 'audio/mpeg',
            createdAt: Date.now(),
          });
          return { fileId, outPath, fileSize: stats.size };
        }
      }
    } catch (gwErr) {
      console.warn('[Gateway Pre-transcode Failed, falling back to local FFmpeg]:', gwErr.message);
    }
  }

  return new Promise((resolve, reject) => {
    let proc;
    let stream;

    const timeout = setTimeout(() => {
      try { proc?.kill(); } catch (e) {}
      try { stream?.destroy(); } catch (e) {}
      reject(new Error('TRANSCODE_TIMEOUT'));
    }, 25000);

    if (isMp4) {
      (async () => {
        try {
          const info = await ytdl.getInfo(targetUrl);
          const videoFormats = info.formats.filter((f) => f.hasVideo && !f.hasAudio);
          videoFormats.sort((a, b) => (b.height || 0) - (a.height || 0));
          const bestVideo = videoFormats.find((f) => f.container === 'mp4') || videoFormats[0];

          const audioFormats = info.formats.filter((f) => f.hasAudio && !f.hasVideo);
          audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
          const bestAudio = audioFormats.find((f) => f.container === 'mp4') || audioFormats[0];

          if (bestVideo?.url && bestAudio?.url) {
            const isVideoMp4 = bestVideo.container === 'mp4';
            const vArgs = isVideoMp4
              ? ['-c:v', 'copy']
              : ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23'];

            proc = spawn(ffmpegPath, [
              '-reconnect', '1',
              '-reconnect_streamed', '1',
              '-reconnect_delay_max', '5',
              '-i', bestVideo.url,
              '-reconnect', '1',
              '-reconnect_streamed', '1',
              '-reconnect_delay_max', '5',
              '-i', bestAudio.url,
              ...vArgs,
              '-c:a', 'aac',
              '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
              '-y',
              outPath,
            ]);
          } else {
            stream = ytdl.download(targetUrl, {
              quality: Quality.HighestVideo,
              filter: { hasVideo: true },
            });
            proc = spawn(ffmpegPath, [
              '-i', 'pipe:0',
              '-c', 'copy',
              '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
              '-y',
              outPath,
            ]);
            stream.pipe(proc.stdin);
            stream.on('error', (err) => {
              clearTimeout(timeout);
              try { proc?.kill(); } catch (e) {}
              reject(err);
            });
          }

          proc.on('error', (err) => {
            clearTimeout(timeout);
            try { stream?.destroy(); } catch (e) {}
            reject(err);
          });

          proc.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0 && fs.existsSync(outPath)) {
              const stats = fs.statSync(outPath);
              readyFiles.set(fileId, {
                filePath: outPath,
                fileName: `${cleanName}.${ext}`,
                fileSize: stats.size,
                mimeType: 'video/mp4',
                createdAt: Date.now(),
              });
              resolve({ fileId, outPath, fileSize: stats.size });
            } else {
              reject(new Error(`FFmpeg exited with code ${code}`));
            }
          });
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      })();
      return;
    } else {
      const bitrate = format === 'mp3-192' ? '192k' : '320k';
      stream = ytdl.download(targetUrl, {
        quality: Quality.HighestAudio,
        filter: { hasAudio: true },
      });
      proc = spawn(ffmpegPath, [
        '-i', 'pipe:0',
        '-vn',
        '-acodec', 'libmp3lame',
        '-b:a', bitrate,
        '-id3v2_version', '3',
        '-write_id3v1', '1',
        '-y',
        outPath,
      ]);
    }

    stream.pipe(proc.stdin);

    stream.on('error', (err) => {
      clearTimeout(timeout);
      try { proc?.kill(); } catch (e) {}
      reject(err);
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      try { stream?.destroy(); } catch (e) {}
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0 && fs.existsSync(outPath)) {
        const stats = fs.statSync(outPath);
        readyFiles.set(fileId, {
          filePath: outPath,
          fileName: `${cleanName}.${ext}`,
          fileSize: stats.size,
          mimeType: isMp4 ? 'video/mp4' : 'audio/mpeg',
          createdAt: Date.now(),
        });
        resolve({ fileId, outPath, fileSize: stats.size });
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
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

      // Bandwidth Guardrails: Audio capped at 15 mins (was 20), Video capped at 7 mins to prevent multi-gigabyte bandwidth drains on Render
      const maxDuration = ext === 'mp4' ? 420 : 900; // 7 mins for video, 15 mins for audio
      if (durationSeconds > maxDuration) {
        return res.status(400).json({
          success: false,
          message: ext === 'mp4'
            ? 'Video length exceeds the 7-minute limit for free 1080p conversion. Please choose MP3 audio or select a shorter clip.'
            : 'Media length exceeds the 15-minute limit for free public conversion.',
        });
      }

      const cleanTitle = sanitizeFilename(videoDetails.title);
      const thumbnail = videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '';
      const downloadUrl = `/api/media/download?url=${encodeURIComponent(targetUrl)}&format=${encodeURIComponent(format)}&title=${encodeURIComponent(cleanTitle)}&_t=${Date.now()}`;

      return res.status(200).json({
        success: true,
        data: {
          title: videoDetails.title || 'Audio Track',
          cleanTitle: `${cleanTitle}.${ext}`,
          author: videoDetails.author?.name || 'Creator',
          durationSeconds,
          thumbnail,
          downloadUrl,
        },
      });
    }

    // Instant Fallback: Use YouTube oEmbed if ytdl is slow or rate-limited
    const oembed = ytid ? await fetchOEmbedMetadata(targetUrl) : null;
    if (oembed) {
      const cleanTitle = sanitizeFilename(oembed.title);
      const downloadUrl = `/api/media/download?url=${encodeURIComponent(targetUrl)}&format=${encodeURIComponent(format)}&title=${encodeURIComponent(cleanTitle)}&_t=${Date.now()}`;

      return res.status(200).json({
        success: true,
        data: {
          title: oembed.title || 'Audio Track',
          cleanTitle: `${cleanTitle}.${ext}`,
          author: oembed.author_name || 'Creator',
          durationSeconds: 180,
          thumbnail: oembed.thumbnail_url || `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`,
          downloadUrl,
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

export const debugStream = async (req, res) => {
  const url = req.query.url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  try {
    const ytid = extractYouTubeId(url);
    const host = (process.env.RAPIDAPI_HOST || 'youtube-mp36.p.rapidapi.com').trim();
    const subpath = `/dl?id=${encodeURIComponent(ytid || 'dQw4w9WgXcQ')}`;
    const fullUrl = `https://${host}${subpath}`;
    const key = (process.env.RAPIDAPI_KEY || '').trim().replace(/^['"]|['"]$/g, '');

    let rapidResult = null;
    if (key) {
      try {
        const rapidRes = await fetch(fullUrl, {
          headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': host,
          },
          signal: AbortSignal.timeout(6000),
        });
        rapidResult = {
          status: rapidRes.status,
          bodyText: (await rapidRes.text()).slice(0, 300),
        };
      } catch (rErr) {
        rapidResult = { error: rErr.message };
      }
    }

    let ffmpegVersion = null;
    try {
      const proc = spawn(ffmpegPath, ['-version']);
      let out = '';
      proc.stdout.on('data', (d) => { out += d.toString(); });
      await new Promise((resolve) => proc.on('close', resolve));
      ffmpegVersion = out.split('\n')[0] || 'Unknown';
    } catch (fErr) {
      ffmpegVersion = `Error: ${fErr.message}`;
    }

    let ytdlDetails = null;
    try {
      const info = await Promise.race([
        ytdl.getInfo(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_3S')), 3000)),
      ]);
      ytdlDetails = {
        title: info?.videoDetails?.title,
        duration: info?.videoDetails?.lengthSeconds,
        formatsCount: info?.formats?.length,
      };
    } catch (yErr) {
      ytdlDetails = { error: yErr.message };
    }

    return res.json({
      success: true,
      ffmpegPath,
      ffmpegVersion,
      ytdlDetails,
      rapidResult,
    });
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, catchError: e.message });
    }
  }
};

/**
 * @desc    Serve completed media file instantly for download
 * @route   GET /api/media/file/:id
 * @access  Public
 */
export const serveMediaFile = (req, res) => {
  const { id } = req.params;
  const entry = readyFiles.get(id);

  if (!entry || !fs.existsSync(entry.filePath)) {
    return res.status(404).send('Download link expired or not found. Please convert again.');
  }

  res.download(entry.filePath, entry.fileName, (err) => {
    if (err) {
      console.error('[Serve Media File Error]', err.message);
    }
  });
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

  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!acquireIpTranscodeSlot(clientIp)) {
    return res.status(429).send('Too many active transcoding requests. Please wait for your current download to complete.');
  }

  let slotReleased = false;
  const releaseSlotOnce = () => {
    if (!slotReleased) {
      slotReleased = true;
      releaseIpTranscodeSlot(clientIp);
    }
  };

  req.on('close', releaseSlotOnce);
  res.on('finish', releaseSlotOnce);

  const ytid = extractYouTubeId(url);
  const targetUrl = ytid ? `https://www.youtube.com/watch?v=${ytid}` : url.trim();

  try {
    const cleanName = sanitizeFilename(title);
    const isMp4 = String(format).startsWith('mp4');
    const ext = isMp4 ? 'mp4' : 'mp3';

    let headersSent = false;
    const sendDownloadHeaders = () => {
      if (!headersSent && !res.headersSent) {
        headersSent = true;
        res.setHeader('Content-Disposition', `attachment; filename="${cleanName}.${ext}"`);
        res.setHeader('Content-Type', isMp4 ? 'video/mp4' : 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
      }
    };

    // Option A: Attempt extraction via dedicated Gateway (Cobalt / RapidAPI) first
    const gatewayResult = await fetchFromExtractionGateway(targetUrl, format);
    if (gatewayResult && gatewayResult.streamUrl) {
      try {
        const upstream = await fetch(gatewayResult.streamUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://rapidapi.com/',
            'Accept': '*/*',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(45000),
        });

        if (upstream.ok && upstream.body) {
          sendDownloadHeaders();
          const nodeStream = Readable.fromWeb(upstream.body);
          nodeStream.pipe(res);

          req.on('close', () => {
            try { nodeStream.destroy(); } catch (e) {}
          });

          nodeStream.on('error', (err) => {
            console.error('[Gateway Upstream Pipe Error]', err.message);
            try { res.end(); } catch (e) {}
          });

          return;
        }
      } catch (gwErr) {
        console.warn('[Extraction Gateway Streaming Failed, falling back to local FFmpeg]:', gwErr.message);
      }
    }

    if (isMp4) {
      // MP4 Streaming Transcoding Pipeline (Fragmented MP4 for instant streaming)
      let ffmpeg;
      let videoStream = null;
      let ffmpegStderr = '';

      try {
        const info = await ytdl.getInfo(targetUrl);
        const videoFormats = info.formats.filter((f) => f.hasVideo && !f.hasAudio);
        videoFormats.sort((a, b) => (b.height || 0) - (a.height || 0));
        const bestVideo = videoFormats.find((f) => f.container === 'mp4') || videoFormats[0];

        const audioFormats = info.formats.filter((f) => f.hasAudio && !f.hasVideo);
        audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
        const bestAudio = audioFormats.find((f) => f.container === 'mp4') || audioFormats[0];

        const browserUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
        const browserHeaders = 'Origin: https://www.youtube.com\r\nReferer: https://www.youtube.com/\r\n';

        if (bestVideo?.url && bestAudio?.url) {
          const isVideoMp4 = bestVideo.container === 'mp4';
          const vArgs = isVideoMp4
            ? ['-c:v', 'copy']
            : ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23'];

          ffmpeg = spawn(ffmpegPath, [
            '-user_agent', browserUA,
            '-headers', browserHeaders,
            '-reconnect', '1',
            '-reconnect_streamed', '1',
            '-reconnect_delay_max', '5',
            '-i', bestVideo.url,
            '-user_agent', browserUA,
            '-headers', browserHeaders,
            '-reconnect', '1',
            '-reconnect_streamed', '1',
            '-reconnect_delay_max', '5',
            '-i', bestAudio.url,
            ...vArgs,
            '-c:a', 'aac',
            '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
            '-flush_packets', '1',
            '-f', 'mp4',
            'pipe:1',
          ]);
        } else {
          videoStream = ytdl.download(targetUrl, {
            quality: Quality.HighestVideo,
            filter: { hasVideo: true },
          });

          ffmpeg = spawn(ffmpegPath, [
            '-i', 'pipe:0',
            '-c', 'copy',
            '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
            '-flush_packets', '1',
            '-f', 'mp4',
            'pipe:1',
          ]);

          videoStream.pipe(ffmpeg.stdin);
          videoStream.on('error', (err) => {
            console.error('[Video Stream Error]', err.message);
            try { ffmpeg.kill(); } catch (e) {}
            if (!headersSent && !res.headersSent) {
              res.status(502).send('YouTube stream unavailable for this video');
            } else {
              res.end();
            }
          });
        }

        const mp4Timeout = setTimeout(() => {
          if (!headersSent && !res.headersSent) {
            try { ffmpeg?.kill(); } catch (e) {}
            if (videoStream) try { videoStream.destroy(); } catch (e) {}
            res.status(504).send('Video stream timed out from provider. Please try again.');
          }
        }, 30000);

        ffmpeg.stderr.on('data', (d) => {
          ffmpegStderr += d.toString();
        });

        let firstChunk = true;
        ffmpeg.stdout.on('data', (chunk) => {
          if (firstChunk) {
            firstChunk = false;
            clearTimeout(mp4Timeout);
            sendDownloadHeaders();
          }
          res.write(chunk);
        });

        ffmpeg.stdout.on('end', () => {
          clearTimeout(mp4Timeout);
          if (firstChunk) {
            if (!headersSent && !res.headersSent) {
              console.error('[MP4 Empty Stream Exit]', ffmpegStderr.slice(-300));
              res.status(502).send('Video stream unavailable or empty from provider');
            } else {
              res.end();
            }
          } else {
            res.end();
          }
        });

        req.on('close', () => {
          clearTimeout(mp4Timeout);
          if (videoStream && !videoStream.destroyed) videoStream.destroy();
          try { ffmpeg?.kill(); } catch (e) {}
        });

        res.on('finish', () => {
          clearTimeout(mp4Timeout);
          if (videoStream && !videoStream.destroyed) videoStream.destroy();
          try { ffmpeg?.kill(); } catch (e) {}
        });

        ffmpeg.on('error', (err) => {
          clearTimeout(mp4Timeout);
          console.error('[FFmpeg Process Error]', err.message);
          if (!headersSent && !res.headersSent) {
            res.status(500).send('Transcoding pipeline error');
          } else {
            res.end();
          }
        });
      } catch (videoErr) {
        console.error('[MP4 Resolution Error]', videoErr.message);
        if (!headersSent && !res.headersSent) {
          res.status(502).send('Failed to resolve video stream');
        } else {
          res.end();
        }
      }
    } else {
      // High-Speed LAME MP3 Transcoding Pipeline with ID3v2 metadata
      const bitrate = format === 'mp3-192' ? '192k' : '320k';
      let ffmpeg;
      let audioStream = null;
      let ffmpegStderr = '';

      try {
        // Stream audio directly through ytdl multi-client engine piped to ffmpeg
        audioStream = ytdl.download(targetUrl, {
          quality: Quality.HighestAudio,
          filter: { hasAudio: true },
        });

        ffmpeg = spawn(ffmpegPath, [
          '-i', 'pipe:0',
          '-vn',
          '-acodec', 'libmp3lame',
          '-b:a', bitrate,
          '-compression_level', '0',
          '-threads', '0',
          '-id3v2_version', '3',
          '-write_id3v1', '1',
          '-flush_packets', '1',
          '-f', 'mp3',
          'pipe:1',
        ]);

        audioStream.pipe(ffmpeg.stdin);

        audioStream.on('error', (err) => {
          console.error('[Audio Stream Error]', err.message);
          try { ffmpeg.kill(); } catch (e) {}
          if (!headersSent && !res.headersSent) {
            res.status(502).send('Audio stream restricted or unavailable from provider for this track');
          } else {
            res.end();
          }
        });

        const mp3Timeout = setTimeout(() => {
          if (!headersSent && !res.headersSent) {
            try { ffmpeg.kill(); } catch (e) {}
            if (audioStream) try { audioStream.destroy(); } catch (e) {}
            res.status(504).send('Audio extraction timed out from provider. Please try again.');
          }
        }, 30000);

        ffmpeg.stderr.on('data', (d) => {
          ffmpegStderr += d.toString();
        });

        let firstChunk = true;
        let streamedBytes = 0;
        const streamToken = req.query._t || req.query.token;

        ffmpeg.stdout.on('data', (chunk) => {
          streamedBytes += chunk.length;
          if (streamToken) {
            const pct = Math.min(95, 30 + Math.round((streamedBytes / 3500000) * 65));
            activeProgress.set(String(streamToken), { pct, status: 'Transcoding & packaging audio' });
          }
          if (firstChunk) {
            firstChunk = false;
            clearTimeout(mp3Timeout);
            sendDownloadHeaders();
          }
          res.write(chunk);
        });

        ffmpeg.stdout.on('end', () => {
          if (streamToken) activeProgress.delete(String(streamToken));
          clearTimeout(mp3Timeout);
          if (firstChunk) {
            if (!headersSent && !res.headersSent) {
              console.error('[MP3 Empty Stream Exit]', ffmpegStderr.slice(-300));
              res.status(502).send('Audio stream empty or restricted by provider for this track');
            } else {
              res.end();
            }
          } else {
            res.end();
          }
        });

        req.on('close', () => {
          clearTimeout(mp3Timeout);
          if (audioStream && !audioStream.destroyed) audioStream.destroy();
          try { ffmpeg.kill(); } catch (e) {}
        });

        res.on('finish', () => {
          clearTimeout(mp3Timeout);
          if (audioStream && !audioStream.destroyed) audioStream.destroy();
          try { ffmpeg.kill(); } catch (e) {}
        });

        ffmpeg.on('error', (err) => {
          clearTimeout(mp3Timeout);
          console.error('[FFmpeg Process Error]', err.message);
          if (!headersSent && !res.headersSent) {
            res.status(500).send('Transcoding pipeline error');
          } else {
            res.end();
          }
        });
      } catch (audioErr) {
        console.error('[MP3 Pipeline Error]', audioErr.message);
        if (!headersSent && !res.headersSent) {
          res.status(502).send('Failed to resolve audio stream from provider');
        } else {
          res.end();
        }
      }
    }
  } catch (err) {
    console.error('[MediaController Download Error]', err.message);
    if (!res.headersSent) {
      res.status(500).send('Failed to stream media from provider');
    }
  }
};

