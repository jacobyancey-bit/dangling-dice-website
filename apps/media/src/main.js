/**
 * Dangling Dice Media Converter Client Application
 * 1-Click Fast URL to MP3 Transcoder
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
  }, 4000);
}

// Format Selection Logic
let selectedFormat = 'mp3-320';
const formatPills = document.querySelectorAll('.format-pill');

formatPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    formatPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    selectedFormat = pill.getAttribute('data-format');
    const title = pill.querySelector('.format-title')?.textContent || selectedFormat;
    showToast(`Format set to: ${title}`);
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
        mediaUrlInput.focus();
      }
    } catch (err) {
      mediaUrlInput.focus();
      showToast('Please press Ctrl+V to paste your URL', 'info');
    }
  });
}

// Enter key triggers immediate conversion
if (mediaUrlInput) {
  mediaUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('convertBtn')?.click();
    }
  });
}

// URL Validation Guardrail
function validateMediaUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return { valid: false, error: 'Please enter a valid YouTube or audio URL' };
  }
  let parsed;
  try {
    parsed = new URL(urlStr.trim());
  } catch (e) {
    return { valid: false, error: 'Invalid URL. Ensure it begins with https://' };
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

// Trigger direct browser download into Downloads folder using standard HTML5 anchor element
function triggerBrowserDownload(downloadUrl, filename = '') {
  try {
    const tempLink = document.createElement('a');
    tempLink.href = downloadUrl;
    if (filename) tempLink.setAttribute('download', filename);
    tempLink.style.display = 'none';
    document.body.appendChild(tempLink);
    tempLink.click();
    setTimeout(() => {
      if (tempLink.parentNode) tempLink.parentNode.removeChild(tempLink);
    }, 1500);
  } catch (err) {
    console.warn('[Auto-Download Notice]', err);
  }
}

// 1-Click Convert & Download Action
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
const downloadNotice = document.getElementById('downloadNotice');
const downloadStatusText = document.getElementById('downloadStatusText');
const fallbackDownloadLink = document.getElementById('fallbackDownloadLink');

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
      showToast('Please check the fair use confirmation checkbox to proceed', 'error');
      fairUseCheckbox?.focus();
      return;
    }

    // Lock UI and show active progress
    convertBtn.disabled = true;
    convertBtn.textContent = '⏳ Converting & Routing to Downloads...';
    if (progressContainer) progressContainer.style.display = 'block';
    if (resultBox) resultBox.style.display = 'none';

    try {
      if (progressBarFill) progressBarFill.style.width = '25%';
      if (progressPercent) progressPercent.textContent = '25%';
      if (progressStatusText) progressStatusText.textContent = 'Resolving media track...';
      if (engineLog) engineLog.textContent = 'Stream Resolver: Handshake established';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      let progressVal = 30;
      const ticker = setInterval(() => {
        if (progressVal < 80) {
          progressVal += 10;
          if (progressBarFill) progressBarFill.style.width = `${progressVal}%`;
          if (progressPercent) progressPercent.textContent = `${progressVal}%`;
        }
      }, 500);

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
        clearInterval(ticker);
        if (fetchErr.name === 'AbortError') {
          throw new Error('Stream resolution timed out. The provider took too long to respond.');
        }
        throw new Error(`Connection error (${fetchErr.message}). Check your network connection.`);
      } finally {
        clearInterval(ticker);
        clearTimeout(timeoutId);
      }

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to extract media from provider');
      }

      const media = resData.data;

      // Finalizing & 100% Ready
      if (progressBarFill) progressBarFill.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressStatusText) progressStatusText.textContent = 'Track ready! Downloading now...';
      if (engineLog) engineLog.textContent = 'Status: Direct download stream dispatched';

      const downloadEndpoint = media.downloadUrl;

      // Populate Result Card with genuine title (No rename editing friction)
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
        resultMeta.textContent = `Format: ${selectedFormat.toUpperCase()}`;
      }

      // Automatically trigger download directly into user's Downloads folder
      triggerBrowserDownload(downloadEndpoint, media.cleanTitle);

      if (downloadBtn) {
        downloadBtn.href = downloadEndpoint;
        downloadBtn.setAttribute('download', media.cleanTitle);
        downloadBtn.innerHTML = '📥 Download Now';
        // Allow the browser to natively follow the link and manage the download stream
        downloadBtn.onclick = () => {
          downloadBtn.innerHTML = '⏳ Downloading...';
          showToast(`Downloading ${media.cleanTitle}! Check your browser downloads bar.`, 'success');
          setTimeout(() => {
            downloadBtn.innerHTML = '📥 Download Again';
          }, 3500);
        };
      }

      if (fallbackDownloadLink) {
        fallbackDownloadLink.href = downloadEndpoint;
        fallbackDownloadLink.setAttribute('download', media.cleanTitle);
      }

      if (downloadNotice) {
        downloadNotice.style.display = 'block';
        if (downloadStatusText) {
          downloadStatusText.textContent = `✅ ${media.cleanTitle} sent to your Downloads folder!`;
        }
      }

      if (resultBox) resultBox.style.display = 'block';
      showToast(`✅ Download started: ${media.title || 'Media File'}!`, 'success');
    } catch (err) {
      console.error(err);
      if (progressContainer) progressContainer.style.display = 'none';
      showToast(err.message || 'Stream extraction error. Please check URL.', 'error');
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = '⚡ Convert & Download to Computer';
    }
  });
}
