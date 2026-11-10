/**
 * Marketing & Omnipost Syndication Controller
 * 
 * Provides unified, single-click marketing broadcasts directly to
 * Discord channels and scheduled drop queues without third-party tools.
 */

import ScheduledPost from '../models/ScheduledPost.js';

/**
 * Core helper to dispatch visual embed to Discord webhook
 */
export async function executeDiscordBroadcast({ title, description, link, category, customImageUrl }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('DISCORD_WEBHOOK_URL is not configured in server environment');
  }
  const targetLink = link || 'https://dangling-dice-studios.com';

  // Color theme based on category
  let embedColor = 0xec4899; // Default: Neon Pink
  if (category === 'Developer Tools' || category === 'Code') embedColor = 0x06b6d4; // Cyan
  if (category === 'Beats & Audio' || category === 'Music') embedColor = 0xa855f7; // Purple
  if (category === 'Affiliate Deals' || category === 'Discounts') embedColor = 0x10b981; // Emerald

  const discordPayload = {
    username: 'Dangling Dice Studios™',
    avatar_url: 'https://dangling-dice-studios.com/images/logo.png',
    content: `📢 **NEW STUDIO DROP & UPDATE** @everyone\nCheck out the latest from Dangling Dice Studios™:`,
    embeds: [
      {
        title: title || 'Dangling Dice Studios™ Release',
        url: targetLink,
        description: description || 'New studio release, creator tools, and media updates are live!',
        color: embedColor,
        author: {
          name: 'Dangling Dice Studios™ Official',
          icon_url: 'https://dangling-dice-studios.com/images/logo.png',
          url: 'https://dangling-dice-studios.com'
        },
        thumbnail: {
          url: 'https://dangling-dice-studios.com/images/logo.png'
        },
        image: {
          url: customImageUrl || 'https://dangling-dice-studios.com/images/banner.jpg'
        },
        fields: [
          {
            name: '🔗 Direct Link',
            value: `[Launch ${category || 'Platform'}](${targetLink})`,
            inline: true
          },
          {
            name: '🎧 Dangling Beats',
            value: '[Stream Lo-Fi](https://dangling-dice-studios.com/#beatsStudio)',
            inline: true
          },
          {
            name: '⚡ Developer API',
            value: '[RapidAPI Hub](https://rapidapi.com/jacob-yancey-z5na1bjQ/api/dangling-dice-studios-central-api)',
            inline: true
          }
        ],
        footer: {
          text: 'Dangling Dice Studios™ • In-House Broadcast Engine',
          icon_url: 'https://dangling-dice-studios.com/images/logo.png'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const discordRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordPayload)
  });

  if (!discordRes.ok) {
    const errText = await discordRes.text();
    throw new Error(`Discord rejected webhook (${discordRes.status}): ${errText}`);
  }

  return true;
}

/**
 * @desc    Send rich visual marketing broadcast immediately
 * @route   POST /api/broadcast/discord
 */
export const sendDiscordBroadcast = async (req, res) => {
  try {
    const { title, description, link, category, customImageUrl } = req.body || {};

    if (!title && !description) {
      return res.status(400).json({
        success: false,
        message: 'Broadcast requires at least a title or description.'
      });
    }

    await executeDiscordBroadcast({ title, description, link, category, customImageUrl });

    return res.status(200).json({
      success: true,
      message: 'Broadcast successfully published to Discord channel!',
      channel: '📢・studio-drops',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Broadcast Error]:', error.message);
    return res.status(502).json({
      success: false,
      message: 'Failed to dispatch marketing broadcast.',
      error: error.message
    });
  }
};

/**
 * @desc    Get all scheduled posts
 * @route   GET /api/broadcast/scheduled
 */
export const getScheduledPosts = async (req, res) => {
  try {
    const posts = await ScheduledPost.find().sort({ scheduledFor: 1 }).limit(50);
    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled posts',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new scheduled post
 * @route   POST /api/broadcast/scheduled
 */
export const createScheduledPost = async (req, res) => {
  try {
    const { title, description, link, category, scheduledFor } = req.body || {};

    if (!title || !description || !scheduledFor) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and scheduledFor date are required.'
      });
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduled date/time format.'
      });
    }

    const post = await ScheduledPost.create({
      title,
      description,
      link: link || 'https://dangling-dice-studios.com',
      category: category || 'Studio Update',
      scheduledFor: scheduledDate,
      status: 'PENDING'
    });

    return res.status(201).json({
      success: true,
      message: 'Post queued for automated broadcast!',
      data: post
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to schedule post',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel/Delete a scheduled post
 * @route   DELETE /api/broadcast/scheduled/:id
 */
export const deleteScheduledPost = async (req, res) => {
  try {
    const post = await ScheduledPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled post not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Scheduled post removed from queue.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled post',
      error: error.message
    });
  }
};

/**
 * Background Queue Worker: polls every 30s for due posts and broadcasts them
 */
async function processScheduledQueue() {
  try {
    const now = new Date();
    const duePosts = await ScheduledPost.find({
      status: 'PENDING',
      scheduledFor: { $lte: now }
    }).limit(5);

    for (const post of duePosts) {
      try {
        await executeDiscordBroadcast({
          title: post.title,
          description: post.description,
          link: post.link,
          category: post.category
        });
        post.status = 'SENT';
        post.sentAt = new Date();
        await post.save();
        console.log(`[Scheduled Worker] Broadcasted: "${post.title}"`);
      } catch (err) {
        post.status = 'FAILED';
        post.error = err.message;
        await post.save();
        console.error(`[Scheduled Worker] Failed to send "${post.title}":`, err.message);
      }
    }
  } catch (err) {
    // Silently continue if database is disconnected
  }
}

// Start queue runner (unref'd interval so tests/scripts exit cleanly)
const queueInterval = setInterval(processScheduledQueue, 30 * 1000);
if (queueInterval.unref) {
  queueInterval.unref();
}
