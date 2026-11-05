/**
 * Partner & Affiliate Redirection Controller
 * 
 * Provides privacy-preserving outbound attribution redirects.
 * - Protects user PII by stripping all client-side query parameters and headers.
 * - Appends verified marketing UTM/subID tracking without exposing user identity.
 * - Enforces Referrer-Policy: strict-origin-when-cross-origin.
 */

const PARTNER_DIRECTORY = {
  atlas: {
    name: 'MongoDB Atlas',
    targetUrl: 'https://www.mongodb.com/cloud/atlas/register',
    category: 'Cloud Hosting & Databases',
  },
  digitalocean: {
    name: 'DigitalOcean Cloud Droplets',
    targetUrl: 'https://www.digitalocean.com',
    category: 'Cloud Hosting & Databases',
  },
  vpn: {
    name: 'Dangling Dice Secure Dev VPN',
    targetUrl: 'https://vpn.danglingdice.com',
    category: 'Developer Tools',
  },
  calculator: {
    name: 'AI Calculator Google Play',
    targetUrl: 'https://play.google.com/store/apps/details?id=com.danglingdicestudios.aicalculator',
    category: 'Mobile Apps',
  },
  youtube: {
    name: 'Dangling Dice Studios YouTube',
    targetUrl: 'https://www.youtube.com/@danglingdicestudios',
    category: 'Official Channels',
  },
};

/**
 * @desc    Redirect to verified partner URL with clean, anonymous subID attribution
 * @route   GET /go/:slug
 * @access  Public
 */
export const redirectPartner = (req, res) => {
  const { slug } = req.params;
  const partner = PARTNER_DIRECTORY[slug?.toLowerCase()];

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: `Partner destination '${slug}' not recognized or no longer active`,
    });
  }

  // Sanitize source identifier (alpha-numeric only, max 30 chars, NO PII)
  const rawSource = req.query.src || req.query.source || 'hub';
  const cleanSource = String(rawSource).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);

  // Construct target URL with clean campaign parameters
  const target = new URL(partner.targetUrl);
  target.searchParams.set('utm_source', 'danglingdice');
  target.searchParams.set('utm_medium', 'affiliate');
  target.searchParams.set('utm_campaign', cleanSource);

  // Set privacy and security headers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Anonymous metric logging (zero personal information recorded)
  console.log(`[Affiliate Redirect] partner=${slug} src=${cleanSource} time=${new Date().toISOString()}`);

  return res.redirect(302, target.toString());
};

/**
 * @desc    Get public directory of verified partners & active deals
 * @route   GET /api/affiliates
 * @access  Public
 */
export const getPartnerDirectory = (req, res) => {
  const directory = Object.entries(PARTNER_DIRECTORY).map(([slug, data]) => ({
    slug,
    name: data.name,
    category: data.category,
    redirectUrl: `/go/${slug}`,
  }));

  res.status(200).json({
    success: true,
    count: directory.length,
    data: directory,
  });
};

