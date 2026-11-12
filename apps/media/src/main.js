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
        resetConversionState();
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

  // Automatically reset previous conversion results as soon as the user edits or inputs a new URL
  mediaUrlInput.addEventListener('input', () => {
    resetConversionState();
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

// DOM Elements
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
const convertAnotherBtn = document.getElementById('convertAnotherBtn');

// Modal Elements
const downloadOverlay = document.getElementById('downloadOverlay');
const closeOverlayBtn = document.getElementById('closeOverlayBtn');
const modalTrackThumb = document.getElementById('modalTrackThumb');
const modalTrackTitle = document.getElementById('modalTrackTitle');
const modalTrackAuthor = document.getElementById('modalTrackAuthor');
const modalTrackFormat = document.getElementById('modalTrackFormat');
const modalStatusText = document.getElementById('modalStatusText');
const modalPercentText = document.getElementById('modalPercentText');
const modalProgressBarFill = document.getElementById('modalProgressBarFill');
const modalSubstatus = document.getElementById('modalSubstatus');
const modalConvertAgainBtn = document.getElementById('modalConvertAgainBtn');
const modalDoneControls = document.getElementById('modalDoneControls');
const modalDirectDownloadLink = document.getElementById('modalDirectDownloadLink');
const modalWarningCard = document.getElementById('modalWarningCard');
const modalWarningMessage = document.getElementById('modalWarningMessage');
const modalRetryBtn = document.getElementById('modalRetryBtn');
const modalTryAnotherBtn = document.getElementById('modalTryAnotherBtn');

let currentActiveMedia = null;

function resetConversionState() {
  if (resultBox) resultBox.style.display = 'none';
  if (downloadNotice) downloadNotice.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'none';
  if (progressBarFill) progressBarFill.style.width = '0%';
  if (progressPercent) progressPercent.textContent = '0%';
  if (modalWarningCard) modalWarningCard.style.display = 'none';
  if (downloadBtn) {
    downloadBtn.removeAttribute('href');
    downloadBtn.removeAttribute('download');
    downloadBtn.innerHTML = '📥 Download Now';
  }
}

if (convertAnotherBtn) {
  convertAnotherBtn.addEventListener('click', () => {
    if (mediaUrlInput) {
      mediaUrlInput.value = '';
      mediaUrlInput.focus();
    }
    resetConversionState();
    showToast('Ready for your next track! Paste any YouTube link.', 'info');
  });
}

if (closeOverlayBtn) {
  closeOverlayBtn.addEventListener('click', () => {
    if (downloadOverlay) downloadOverlay.style.display = 'none';
  });
}

if (modalConvertAgainBtn) {
  modalConvertAgainBtn.addEventListener('click', () => {
    if (downloadOverlay) downloadOverlay.style.display = 'none';
    if (mediaUrlInput) {
      mediaUrlInput.value = '';
      mediaUrlInput.focus();
    }
    resetConversionState();
    showToast('Ready for your next track! Paste any YouTube link.', 'info');
  });
}

// In-Browser Blob Download Engine (Prevents "Site Unavailable" and navigations)
async function startDownloadWithOverlay(media) {
  if (!media || !media.downloadUrl) return;
  currentActiveMedia = media;

  if (downloadOverlay) {
    downloadOverlay.style.display = 'flex';
  }

  // Populate Track Details in Modal
  if (modalTrackThumb) modalTrackThumb.src = media.thumbnail || '/images/banner.jpg';
  if (modalTrackTitle) modalTrackTitle.textContent = media.title || media.cleanTitle;
  if (modalTrackAuthor) modalTrackAuthor.textContent = `By ${media.author || 'Creator'}`;
  if (modalTrackFormat) {
    modalTrackFormat.textContent = selectedFormat.toUpperCase().replace('-', ' ');
  }

  // Reset Modal Progress
  if (modalProgressBarFill) {
    modalProgressBarFill.style.background = 'linear-gradient(90deg, #ec4899, #06b6d4, #10b981)';
    modalProgressBarFill.style.width = '15%';
  }
  if (modalPercentText) modalPercentText.textContent = '15%';
  if (modalStatusText) modalStatusText.textContent = '⏳ Connecting to audio stream pipeline...';
  if (modalSubstatus) modalSubstatus.textContent = 'Transcoding & streaming directly to your device';
  if (modalConvertAgainBtn) {
    modalConvertAgainBtn.textContent = '✨ Convert Another Track';
    modalConvertAgainBtn.style.display = 'none';
  }
  if (modalDoneControls) modalDoneControls.style.display = 'none';
  if (modalWarningCard) modalWarningCard.style.display = 'none';
  const modalContextualPerks = document.getElementById('modalContextualPerks');
  if (modalContextualPerks) modalContextualPerks.style.display = 'none';

  // Incremental visual progress ticker
  let currentPct = 15;
  const progressTimer = setInterval(() => {
    if (currentPct < 85) {
      currentPct += (85 - currentPct) * 0.15;
      const rounded = Math.round(currentPct);
      if (modalProgressBarFill) modalProgressBarFill.style.width = `${rounded}%`;
      if (modalPercentText) modalPercentText.textContent = `${rounded}%`;
      if (rounded > 40 && rounded < 70 && modalStatusText) {
        modalStatusText.textContent = '⚡ Transcoding master audio stream...';
      } else if (rounded >= 70 && modalStatusText) {
        modalStatusText.textContent = '📦 Packaging file for Downloads folder...';
      }
    }
  }, 400);

  const freshDownloadUrl = media.downloadUrl.includes('&_t=')
    ? media.downloadUrl.replace(/&_t=\d+/, `&_t=${Date.now()}`)
    : `${media.downloadUrl}&_t=${Date.now()}`;

  try {
    const res = await fetch(freshDownloadUrl);
    clearInterval(progressTimer);

    if (!res.ok) {
      throw new Error(`Media stream error (HTTP ${res.status}). Server could not extract this video.`);
    }

    if (modalProgressBarFill) modalProgressBarFill.style.width = '95%';
    if (modalPercentText) modalPercentText.textContent = '95%';
    if (modalStatusText) modalStatusText.textContent = '💾 Saving to Downloads folder...';

    const blob = await res.blob();
    if (!blob || blob.size < 2048) {
      throw new Error('Downloaded file was incomplete or empty (0 bytes received from provider).');
    }
    const blobUrl = URL.createObjectURL(blob);

    // Trigger local browser file download
    const tempLink = document.createElement('a');
    tempLink.href = blobUrl;
    tempLink.setAttribute('download', media.cleanTitle);
    document.body.appendChild(tempLink);
    tempLink.click();

    setTimeout(() => {
      tempLink.remove();
    }, 2000);

    // 100% Complete & Reveal Convert Again Button
    if (modalProgressBarFill) {
      modalProgressBarFill.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
      modalProgressBarFill.style.width = '100%';
    }
    if (modalPercentText) modalPercentText.textContent = '100%';
    if (modalStatusText) modalStatusText.textContent = '✅ Download Complete!';
    if (modalSubstatus) modalSubstatus.textContent = `Saved: ${media.cleanTitle} in your Downloads folder`;
    if (modalWarningCard) modalWarningCard.style.display = 'none';

    if (modalConvertAgainBtn) {
      modalConvertAgainBtn.textContent = '✨ Convert Another Track';
      modalConvertAgainBtn.style.display = 'block';
    }
    if (modalDoneControls) {
      modalDoneControls.style.display = 'block';
    }
    if (modalDirectDownloadLink) {
      modalDirectDownloadLink.href = blobUrl;
      modalDirectDownloadLink.setAttribute('download', media.cleanTitle);
    }

    showToast(`✅ Downloaded ${media.cleanTitle}!`, 'success');
    
    // Reveal high-converting partner creator perks inside modal
    const modalContextualPerks = document.getElementById('modalContextualPerks');
    if (modalContextualPerks) {
      modalContextualPerks.style.display = 'block';
    }

    checkDownloadMilestoneForTip();
  } catch (err) {
    clearInterval(progressTimer);
    console.error('[Download Stream Error]', err);

    if (modalProgressBarFill) {
      modalProgressBarFill.style.background = '#ef4444';
      modalProgressBarFill.style.width = '100%';
    }
    if (modalPercentText) modalPercentText.textContent = 'FAILED';
    if (modalStatusText) modalStatusText.textContent = '⚠️ Download Incomplete — File Not Saved';
    if (modalSubstatus) modalSubstatus.textContent = 'The track could not be saved to your Downloads folder';

    if (modalWarningCard) {
      modalWarningCard.style.display = 'flex';
    }
    if (modalWarningMessage) {
      modalWarningMessage.textContent = `Warning: The download failed (${err.message || 'connection interrupted'}). The upstream provider may have temporarily throttled this stream. Please try again.`;
    }

    if (modalRetryBtn) {
      modalRetryBtn.onclick = () => {
        showToast('Retrying download...', 'info');
        startDownloadWithOverlay(media);
      };
    }

    if (modalTryAnotherBtn) {
      modalTryAnotherBtn.onclick = () => {
        if (downloadOverlay) downloadOverlay.style.display = 'none';
        if (mediaUrlInput) {
          mediaUrlInput.value = '';
          mediaUrlInput.focus();
        }
        resetConversionState();
      };
    }

    if (modalConvertAgainBtn) {
      modalConvertAgainBtn.textContent = '🔄 Try Another Track';
      modalConvertAgainBtn.style.display = 'block';
    }
    showToast(err.message || 'Download failed — please try again', 'error');
  }
}

// 1-Click Convert & Download Action
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
    convertBtn.textContent = '⏳ Resolving & Preparing Download...';
    if (progressContainer) progressContainer.style.display = 'block';
    if (resultBox) resultBox.style.display = 'none';

    try {
      if (progressBarFill) progressBarFill.style.width = '35%';
      if (progressPercent) progressPercent.textContent = '35%';
      if (progressStatusText) progressStatusText.textContent = 'Resolving media track...';
      if (engineLog) engineLog.textContent = 'Stream Resolver: Handshake established';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

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

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to extract media from provider');
      }

      const media = resData.data;

      // Finalizing & 100% Ready
      if (progressBarFill) progressBarFill.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressStatusText) progressStatusText.textContent = 'Track ready! Launching download...';
      if (engineLog) engineLog.textContent = 'Status: Direct download stream dispatched';

      // Populate Result Card with genuine title
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

      if (downloadBtn) {
        downloadBtn.onclick = (e) => {
          e.preventDefault();
          startDownloadWithOverlay(media);
        };
      }

      if (fallbackDownloadLink) {
        fallbackDownloadLink.onclick = (e) => {
          e.preventDefault();
          startDownloadWithOverlay(media);
        };
      }

      if (downloadNotice) {
        downloadNotice.style.display = 'block';
        if (downloadStatusText) {
          downloadStatusText.textContent = `✅ Ready to download: ${media.cleanTitle}`;
        }
      }

      if (resultBox) resultBox.style.display = 'block';

      // Automatically launch download modal overlay & stream immediately!
      startDownloadWithOverlay(media);
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

// Milestone Download Helper (Respectful, non-intrusive Buy Me a Coffee prompt on 3rd download)
function checkDownloadMilestoneForTip() {
  if (localStorage.getItem('dds_bmc_dismissed') === 'true') return;

  const cooldownUntil = Number(localStorage.getItem('dds_bmc_cooldown')) || 0;
  if (Date.now() < cooldownUntil) return;

  const currentCount = (Number(localStorage.getItem('dds_dl_count')) || 0) + 1;
  localStorage.setItem('dds_dl_count', currentCount);

  // Trigger on milestone: 3rd download, or every 10 downloads if not dismissed
  if (currentCount === 3 || (currentCount > 3 && currentCount % 10 === 0)) {
    setTimeout(() => {
      showGentleMilestoneTipCard(currentCount);
    }, 1500);
  }
}

function showGentleMilestoneTipCard(count) {
  const existing = document.getElementById('bmcGentleTipCard');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.id = 'bmcGentleTipCard';
  card.className = 'bmc-gentle-card';
  card.innerHTML = `
    <div class="bmc-gentle-header">
      <span class="bmc-gentle-title">🎉 Track #${count} Downloaded!</span>
      <button type="button" class="bmc-gentle-close" onclick="window.dismissBmcTip(false)" aria-label="Close">&times;</button>
    </div>
    <p class="bmc-gentle-body">
      Enjoying clean 320kbps audio without popup ads or paywalls? If our converter saved you time, consider dropping a tip in the studio coffee jar to help cover bandwidth!
    </p>
    <div class="bmc-gentle-actions">
      <a href="https://buymeacoffee.com/danglingdicestudios" target="_blank" rel="noopener noreferrer" class="btn btn-coffee btn-sm" onclick="window.dismissBmcTip(true)">
        ☕ Buy a Coffee ($5 or Custom) ↗
      </a>
      <button type="button" class="btn btn-secondary btn-sm" onclick="window.dismissBmcTip(false)">
        Maybe Later
      </button>
    </div>
  `;

  document.body.appendChild(card);

  setTimeout(() => {
    if (document.getElementById('bmcGentleTipCard')) {
      window.dismissBmcTip(false);
    }
  }, 18000);
}

function dismissBmcTip(isSupporter) {
  const card = document.getElementById('bmcGentleTipCard');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.3s ease';
    setTimeout(() => card.remove(), 300);
  }

  if (isSupporter) {
    localStorage.setItem('dds_bmc_dismissed', 'true');
  } else {
    // 14-day silence cooldown
    localStorage.setItem('dds_bmc_cooldown', Date.now() + 1209600000);
  }
}

window.dismissBmcTip = dismissBmcTip;
