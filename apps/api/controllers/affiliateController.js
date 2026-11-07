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
    name: 'MongoDB Atlas Cloud',
    targetUrl: 'https://www.mongodb.com/cloud/atlas/register',
    category: 'Cloud Hosting & Databases',
    description: 'Fully managed cloud document database with auto-scaling, global clusters, and vector search.',
    perkBadge: 'Free 512MB M0 Cluster',
    icon: '🍃',
    featured: true,
  },
  digitalocean: {
    name: 'DigitalOcean Droplets',
    targetUrl: 'https://www.digitalocean.com',
    category: 'Cloud Hosting & Databases',
    description: 'Simple, scalable cloud computing and virtual machines built for developers and startups.',
    perkBadge: '$200 Free 60-Day Credit',
    icon: '🌊',
    featured: true,
  },
  vpn: {
    name: 'Dangling Dice WireGuard VPN',
    targetUrl: 'https://vpn.dangling-dice-studios.com',
    category: 'Developer Tools',
    description: 'Ultra-fast in-kernel WireGuard encrypted tunnel with zero activity logs and leak protection.',
    perkBadge: '100% Free Developer Tool',
    icon: '🛡️',
    featured: true,
  },
  calculator: {
    name: 'AI Calculator on Google Play',
    targetUrl: 'https://play.google.com/store/apps/details?id=com.danglingdicestudios.aicalculator',
    category: 'Mobile Apps',
    description: 'Smart Android homework solver with step-by-step arithmetic, scientific calculation, and AI OCR scanning.',
    perkBadge: 'Official Google Play App',
    icon: '📱',
    featured: true,
  },
  youtube: {
    name: 'Dangling Beats Official Channel',
    targetUrl: 'https://www.youtube.com/@danglingdicestudios',
    category: 'Official Channels',
    description: 'Original lofi, dark trap, and synthwave instrumentals crafted for code sessions and content creators.',
    perkBadge: '24/7 Focus Beats & Masterclasses',
    icon: '🎧',
    featured: true,
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
    description: data.description,
    perkBadge: data.perkBadge,
    icon: data.icon,
    featured: data.featured,
    redirectUrl: `/go/${slug}`,
  }));

  res.status(200).json({
    success: true,
    count: directory.length,
    data: directory,
  });
};

