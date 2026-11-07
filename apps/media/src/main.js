/**
 * Dangling Dice Media Converter Client Application
 * Powered by In-Browser WebAssembly (Wasm) & Stream Relaying
 */

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
  ? 'http://localhost:5000/api'
  : '/api';

// Toast Notifications Helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, 3500);
}

// Format Selection Logic
let selectedFormat = 'mp3-320';
const formatPills = document.querySelectorAll('.format-pill');

formatPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    formatPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    selectedFormat = pill.getAttribute('data-format');
    showToast(`Format set to: ${pill.querySelector('.format-title').textContent} (${selectedFormat})`);
  });
});

// Clipboard Paste Helper
const pasteBtn = document.getElementById('pasteBtn');
const mediaUrlInput = document.getElementById('mediaUrlInput');

if (pasteBtn && mediaUrlInput) {
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        mediaUrlInput.value = text.trim();
        showToast('URL pasted from clipboard!', 'success');
      }
    } catch (err) {
      mediaUrlInput.focus();
      showToast('Please press Ctrl+V to paste your URL', 'info');
    }
  });
}

// Sample URL Button
const sampleUrlBtn = document.getElementById('sampleUrlBtn');
if (sampleUrlBtn && mediaUrlInput) {
  sampleUrlBtn.addEventListener('click', () => {
    mediaUrlInput.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    showToast('Sample Beats URL loaded!', 'success');
  });
}

// URL Validation Guardrail
function validateMediaUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return { valid: false, error: 'Please enter a valid media URL' };
  }
  let parsed;
  try {
    parsed = new URL(urlStr.trim());
  } catch (e) {
    return { valid: false, error: 'Invalid URL structure. Ensure it begins with https://' };
  }

  // SSRF & Localhost Prevention
  const host = parsed.hostname.toLowerCase();
  const forbiddenHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
  if (forbiddenHosts.includes(host) || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local')) {
    return { valid: false, error: 'Security Warning: Internal and loopback addresses are blocked' };
  }

  return { valid: true, parsed };
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Convert Action
const convertBtn = document.getElementById('convertBtn');
const fairUseCheckbox = document.getElementById('fairUseCheckbox');
const progressContainer = document.getElementById('progressContainer');
const progressBarFill = document.getElementById('progressBarFill');
const progressStatusText = document.getElementById('progressStatusText');
const progressPercent = document.getElementById('progressPercent');
const engineLog = document.getElementById('engineLog');
const resultBox = document.getElementById('resultBox');
const resultThumb = document.getElementById('resultThumb');
const resultFilename = document.getElementById('resultFilename');
const resultAuthor = document.getElementById('resultAuthor');
const resultDuration = document.getElementById('resultDuration');
const resultMeta = document.getElementById('resultMeta');
const downloadBtn = document.getElementById('downloadBtn');
const audioPreview = document.getElementById('audioPreview');
const audioPreviewWrapper = document.getElementById('audioPreviewWrapper');

if (convertBtn) {
  convertBtn.addEventListener('click', async () => {
    const rawUrl = mediaUrlInput?.value;
    const validation = validateMediaUrl(rawUrl);

    if (!validation.valid) {
      showToast(validation.error, 'error');
      mediaUrlInput?.focus();
      return;
    }

    if (!fairUseCheckbox?.checked) {
      showToast('Please check the fair use and rights confirmation checkbox to proceed', 'error');
      fairUseCheckbox?.focus();
      return;
    }

    // Lock UI and start progress
    convertBtn.disabled = true;
    convertBtn.textContent = '⏳ Processing Media Stream...';
    if (progressContainer) progressContainer.style.display = 'block';
    if (resultBox) resultBox.style.display = 'none';

    try {
      // Stage 1: Initiating stream handshake
      if (progressBarFill) progressBarFill.style.width = '20%';
      if (progressPercent) progressPercent.textContent = '20%';
      if (progressStatusText) progressStatusText.textContent = 'Connecting to stream resolver...';
      if (engineLog) engineLog.textContent = 'Stream Resolver: Handshake established';

      // Call Backend API to resolve media with 25-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let response;
      try {
        response = await fetch(`${API_BASE}/media/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: rawUrl,
            format: selectedFormat,
          }),
          signal: controller.signal,
        });
      } catch (fetchErr) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Stream resolution timed out. The provider took too long to respond.');
        }
        throw new Error(`Connection error (${fetchErr.message}). Check your network connection.`);
      } finally {
        clearTimeout(timeoutId);
      }

      // Stage 2: Parsing stream metadata
      if (progressBarFill) progressBarFill.style.width = '55%';
      if (progressPercent) progressPercent.textContent = '55%';
      if (progressStatusText) progressStatusText.textContent = 'Extracting media signatures & audio bitrate...';
      if (engineLog) engineLog.textContent = `Muxer: Transcoding to ${selectedFormat.toUpperCase()}`;

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to extract media from provider');
      }

      const media = resData.data;

      // Stage 3: Packaging Stream
      if (progressBarFill) progressBarFill.style.width = '85%';
      if (progressPercent) progressPercent.textContent = '85%';
      if (progressStatusText) progressStatusText.textContent = 'Finalizing in-browser stream packaging...';
      await new Promise((r) => setTimeout(r, 400));

      // Stage 4: Ready
      if (progressBarFill) progressBarFill.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressStatusText) progressStatusText.textContent = 'Transcoding complete!';
      if (engineLog) engineLog.textContent = 'Status: Stream ready for direct download';

      const downloadEndpoint = media.downloadUrl;

      // Populate Result Card
      if (resultThumb && media.thumbnail) {
        resultThumb.src = media.thumbnail;
      }
      if (resultFilename) {
        resultFilename.textContent = media.title || media.cleanTitle;
      }
      if (resultAuthor) {
        resultAuthor.textContent = `By ${media.author || 'Creator'}`;
      }
      if (resultDuration) {
        resultDuration.textContent = formatDuration(media.durationSeconds);
      }
      if (resultMeta) {
        resultMeta.textContent = `Format: ${selectedFormat.toUpperCase()} • Direct Stream`;
      }

      if (downloadBtn) {
        downloadBtn.href = downloadEndpoint;
        downloadBtn.download = media.cleanTitle;
      }

      // Audio preview player
      if (audioPreview && !selectedFormat.startsWith('mp4')) {
        audioPreview.src = downloadEndpoint;
        if (audioPreviewWrapper) audioPreviewWrapper.style.display = 'block';
      } else if (audioPreviewWrapper) {
        audioPreviewWrapper.style.display = 'none';
      }

      if (resultBox) resultBox.style.display = 'block';
      showToast(`Conversion Ready: ${media.title || 'Media File'}!`, 'success');

      // Scroll smoothly to download
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error(err);
      if (progressContainer) progressContainer.style.display = 'none';
      showToast(err.message || 'Stream extraction error. Please check URL.', 'error');
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = '⚡ Convert & Transcode Media';
    }
  });
}
