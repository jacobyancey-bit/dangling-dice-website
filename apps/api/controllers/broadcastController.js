/**
 * Marketing & Omnipost Syndication Controller
 * 
 * Provides unified, single-click marketing broadcasts directly to
 * Discord channels and syndicated RSS/JSON feeds without third-party tools.
 */

const DEFAULT_WEBHOOK_URL = 'https://discord.com/api/webhooks/1568692839745851473/XBozMpoKsI99j1DTg8iBkqK1gBkhU-obOyXZoaMrocS0t0vU6rzM7rAe6xY3zoGh3TLN';

/**
 * @desc    Send rich visual marketing broadcast to Discord Webhook
 * @route   POST /api/broadcast/discord
 * @access  Public / Admin
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

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
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
            text: 'Dangling Dice Studios™ &bull; In-House Broadcast Engine',
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
      return res.status(502).json({
        success: false,
        message: `Discord rejected webhook: ${discordRes.status} ${errText}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Broadcast successfully published to Discord channel!',
      channel: '📢・studio-drops',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Broadcast Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch marketing broadcast.',
      error: error.message
    });
  }
};
