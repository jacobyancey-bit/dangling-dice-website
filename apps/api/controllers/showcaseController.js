import DevShowcase, { resolveCategoryGroup } from '../models/DevShowcase.js';
import { executeDiscordBroadcast } from './broadcastController.js';

let isAutoRotationEnabled = true;

/**
 * Returns rotation status
 */
export const getRotationConfig = (req, res) => {
  res.status(200).json({
    success: true,
    autoRotation: isAutoRotationEnabled,
  });
};

/**
 * Toggle auto rotation from Admin Portal
 */
export const toggleRotationConfig = (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled === 'boolean') {
    isAutoRotationEnabled = enabled;
  }
  res.status(200).json({
    success: true,
    autoRotation: isAutoRotationEnabled,
    message: isAutoRotationEnabled
      ? 'Autonomous weekly rotation is ENABLED.'
      : 'Autonomous weekly rotation is PAUSED.',
  });
};

/**
 * Seeds initial approved projects if collection is empty or missing category spotlights
 */
export async function seedInitialShowcaseIfEmpty() {
  try {
    const count = await DevShowcase.countDocuments();
    if (count > 0) return;

    const initialSeeds = [
      // 1. Music Creator & Beatmaker Suite
      {
        title: 'Dangling Dice Media Converter',
        tagline: 'High-speed 320kbps MP3 audio extractor and stem sampler for beatmakers',
        description: 'Pulls clean studio-master audio from YouTube directly to your desktop. Zero ads, zero tracking, built for audio producers, sampling, and music creators.',
        appUrl: 'https://media.dangling-dice-studios.com/',
        githubUrl: 'https://github.com/jacobyancey-bit',
        imageUrl: 'https://dangling-dice-studios.com/images/banner.jpg',
        authorName: 'Dangling Dice Studios™',
        authorSocial: '@danglingdicestudios',
        category: 'Audio & Music',
        categoryGroup: 'music',
        techStack: ['Node.js', 'FFmpeg', 'Vite', 'REST API'],
        isAppOfTheWeek: true,
        featuredCategory: 'music',
        featuredCount: 1,
        featuredAt: new Date(),
        status: 'APPROVED',
      },
      {
        title: 'BeatForge WebAudio Stem Player',
        tagline: 'Client-side WebAudio audio stems player & tempo pitch shifter',
        description: 'Isolate drums, bass, vocals, and instruments in real-time in your web browser with zero server uploads.',
        appUrl: 'https://media.dangling-dice-studios.com/',
        githubUrl: 'https://github.com/jacobyancey-bit',
        imageUrl: 'https://dangling-dice-studios.com/images/banner.jpg',
        authorName: 'Indie Audio Hacker',
        authorSocial: '@indieaudio',
        category: 'Audio & Music',
        categoryGroup: 'music',
        techStack: ['WebAudio API', 'Wasm', 'Tailwind'],
        isAppOfTheWeek: false,
        featuredCategory: 'music',
        featuredCount: 0,
        featuredAt: null,
        status: 'APPROVED',
      },
      // 2. Social-Media & Content Creator Suite
      {
        title: 'ClipCraft Viral Caption Studio',
        tagline: 'Automated word-by-word karaoke subtitles and vertical clip generator',
        description: 'Produce viral TikToks and YouTube Shorts in seconds with automated speech-to-text, animated emoji callouts, and multi-platform presets.',
        appUrl: 'https://dangling-dice-studios.com/#socialCreatorSuite',
        githubUrl: 'https://github.com/jacobyancey-bit',
        imageUrl: 'https://dangling-dice-studios.com/images/banner.jpg',
        authorName: 'ViralMaker Community',
        authorSocial: '@viralmaker',
        category: 'Social & Creative',
        categoryGroup: 'creator',
        techStack: ['React', 'Canvas API', 'Whisper Wasm'],
        isAppOfTheWeek: true,
        featuredCategory: 'creator',
        featuredCount: 1,
        featuredAt: new Date(),
        status: 'APPROVED',
      },
      {
        title: 'ThumbnailForge A/B Tester',
        tagline: 'High-CTR YouTube thumbnail previewer, heatmapper and layout analyzer',
        description: 'Test your thumbnails against live YouTube dark mode feeds, inspect title truncations across mobile devices, and score visual contrast before publishing.',
        appUrl: 'https://dangling-dice-studios.com/#socialCreatorSuite',
        githubUrl: 'https://github.com/jacobyancey-bit',
        imageUrl: 'https://dangling-dice-studios.com/images/banner.jpg',
        authorName: 'PixelCraft Dev',
        authorSocial: '@pixelcraft',
        category: 'Social & Creative',
        categoryGroup: 'creator',
        techStack: ['Vue', 'SVG', 'IndexedDB'],
        isAppOfTheWeek: false,
        featuredCategory: 'creator',
        featuredCount: 0,
        featuredAt: null,
        status: 'APPROVED',
      },
      // 3. Developer Suite & Studio Tech Stack
      {
        title: 'Stateless Schema & Acreage Compute Gateway',
        tagline: 'Sub-15ms REST APIs for JSON-to-Zod schema inference, GIS acreage, and PII redaction',
        description: 'Serverless developer sandboxes and high-throughput REST compute endpoints for cloud engineers, Discord bots, and backend architects.',
        appUrl: 'https://dangling-dice-studios.com/#computeApiSuite',
        githubUrl: 'https://github.com/jacobyancey-bit',
        imageUrl: 'https://dangling-dice-studios.com/images/banner.jpg',
        authorName: 'Dangling Dice Studios™',
        authorSocial: '@danglingdicestudios',
        category: 'Developer Tool',
        categoryGroup: 'developer',
        techStack: ['Node.js', 'Express', 'TypeScript', 'Docker'],
        isAppOfTheWeek: true,
        featuredCategory: 'developer',
        featuredCount: 1,
        featuredAt: new Date(),
        status: 'APPROVED',
      },
      {
        title: 'MongoInspector Pro',
        tagline: 'Client-side MongoDB URI connection string analyzer, parser & query builder',
        description: 'Inspect replica sets, parse SRV records, sanitize credentials, and generate Mongoose & Native Node.js driver connection snippets.',
        appUrl: 'https://dangling-dice-studios.com/',
        githubUrl: 'https://github.com/jacobyancey-bit',
        imageUrl: 'https://dangling-dice-studios.com/images/banner.jpg',
        authorName: 'DevOps Guild',
        authorSocial: '@devopsguild',
        category: 'Developer Tool',
        categoryGroup: 'developer',
        techStack: ['JavaScript', 'MongoDB', 'CSS Grid'],
        isAppOfTheWeek: false,
        featuredCategory: 'developer',
        featuredCount: 0,
        featuredAt: null,
        status: 'APPROVED',
      },
    ];

    await DevShowcase.insertMany(initialSeeds);
    console.log('[DevShowcase] Successfully seeded initial multi-category showcase spotlights.');
  } catch (err) {
    console.error('[DevShowcase] Seed error:', err.message);
  }
}

/**
 * Autonomous Weekly Rotation Engine for a single category group:
 * - 'creator' -> Social-Media & Content Creator Suite
 * - 'music'   -> Music Creator & Beatmaker Suite
 * - 'developer' -> Developer Suite & Studio Tech Stack
 *
 * Rules:
 * 1. If there are NEW app entries (featuredCount === 0 or featuredAt === null),
 *    the cron worker ONLY selects from those new entries (first-submitted, first-served).
 * 2. If there are NO new app entries, the cron worker picks from previously featured apps
 *    using the rotation rules (not currently featured, least recently featured, lowest featuredCount).
 */
export async function rotateCategorySpotlight(categoryGroup, force = false) {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const currentSpotlight = await DevShowcase.findOne({
    status: 'APPROVED',
    categoryGroup,
    isAppOfTheWeek: true,
  });

  if (!force && currentSpotlight && currentSpotlight.featuredAt) {
    const elapsed = Date.now() - new Date(currentSpotlight.featuredAt).getTime();
    if (elapsed < SEVEN_DAYS_MS) {
      return { rotated: false, categoryGroup, reason: 'Current app has not completed 7 days yet.' };
    }
  }

  // 1. Check for brand NEW approved app submissions that have never been featured
  const newCandidateQuery = {
    status: 'APPROVED',
    categoryGroup,
    isAppOfTheWeek: false,
    $or: [
      { featuredCount: 0 },
      { featuredCount: { $exists: false } },
      { featuredAt: null },
    ],
  };
  if (currentSpotlight) {
    newCandidateQuery._id = { $ne: currentSpotlight._id };
  }

  let candidate = await DevShowcase.findOne(newCandidateQuery).sort({ createdAt: 1 });

  // 2. If NO new entries exist, pick from previously submitted apps using rotation rules
  if (!candidate) {
    const reuseQuery = {
      status: 'APPROVED',
      categoryGroup,
    };
    if (currentSpotlight) {
      reuseQuery._id = { $ne: currentSpotlight._id };
    }

    candidate = await DevShowcase.findOne(reuseQuery).sort({
      featuredAt: 1,
      featuredCount: 1,
      createdAt: 1,
    });
  }

  // Fallback if only 1 app exists in this category
  if (!candidate && currentSpotlight) {
    candidate = currentSpotlight;
  } else if (!candidate) {
    candidate = await DevShowcase.findOne({ status: 'APPROVED', categoryGroup });
  }

  if (!candidate) {
    return { rotated: false, categoryGroup, reason: `No approved apps for category: ${categoryGroup}` };
  }

  // Unset previous spotlights for this category
  await DevShowcase.updateMany(
    { categoryGroup, isAppOfTheWeek: true },
    { isAppOfTheWeek: false }
  );

  // Crown candidate
  candidate.isAppOfTheWeek = true;
  candidate.featuredAt = new Date();
  candidate.featuredCount = (candidate.featuredCount || 0) + 1;
  candidate.featuredCategory = categoryGroup;
  await candidate.save();

  console.log(`[Auto-Rotation] 🏆 Crowned new ${categoryGroup} Spotlight: "${candidate.title}" by ${candidate.authorName}`);

  // Broadcast to Discord
  try {
    const categoryLabels = {
      creator: '🎬 CREATOR & SOCIAL SUITE',
      music: '🎛️ MUSIC & BEATMAKER SUITE',
      developer: '💻 DEVELOPER & CODE SUITE',
    };
    const catLabel = categoryLabels[categoryGroup] || 'COMMUNITY';

    await executeDiscordBroadcast({
      title: `🏆 NEW ${catLabel} SPOTLIGHT: ${candidate.title}`,
      description: `🌟 **Featured this week in the ${catLabel} on Dangling Dice Studios!**\n\n"${candidate.tagline}"\n\n${candidate.description}\n\n👤 **Creator:** ${candidate.authorName} ${candidate.authorSocial ? `(${candidate.authorSocial})` : ''}\n🛠️ **Tech Stack:** ${(candidate.techStack || []).join(', ')}\n\n👉 Test live demo: ${candidate.appUrl}`,
      link: candidate.appUrl,
      category: 'Community Showcase',
    });
  } catch (err) {
    console.error(`[Auto-Rotation] Discord broadcast error for ${categoryGroup}:`, err.message);
  }

  return {
    rotated: true,
    categoryGroup,
    newApp: candidate,
  };
}

/**
 * Autonomous Weekly Rotation Engine across ALL category suites
 */
export async function triggerAutonomousRotation(force = false, targetCategory = 'all') {
  if (!isAutoRotationEnabled && !force) {
    return { rotated: false, reason: 'Auto rotation paused.' };
  }

  const categories = targetCategory === 'all'
    ? ['creator', 'music', 'developer']
    : [targetCategory];

  const results = {};
  for (const cat of categories) {
    results[cat] = await rotateCategorySpotlight(cat, force);
  }

  return {
    rotated: true,
    categories: results,
  };
}

/**
 * Background Cron Runner
 * Checks every hour if the 7-day milestone has passed for any category suite.
 */
const rotationTimer = setInterval(async () => {
  try {
    await triggerAutonomousRotation(false, 'all');
  } catch (err) {
    // Silently continue
  }
}, 60 * 60 * 1000); // 1 hour check

if (rotationTimer.unref) {
  rotationTimer.unref();
}

/**
 * @desc    Get all approved showcase projects & active spotlights for every category
 * @route   GET /api/showcase
 * @access  Public
 */
export const getPublicShowcase = async (req, res) => {
  try {
    await seedInitialShowcaseIfEmpty();

    const spotlights = {
      creator: await DevShowcase.findOne({ status: 'APPROVED', categoryGroup: 'creator', isAppOfTheWeek: true }).sort({ featuredAt: -1 }),
      music: await DevShowcase.findOne({ status: 'APPROVED', categoryGroup: 'music', isAppOfTheWeek: true }).sort({ featuredAt: -1 }),
      developer: await DevShowcase.findOne({ status: 'APPROVED', categoryGroup: 'developer', isAppOfTheWeek: true }).sort({ featuredAt: -1 }),
    };

    // If any category doesn't have isAppOfTheWeek: true, pick any approved in that category
    for (const cat of ['creator', 'music', 'developer']) {
      if (!spotlights[cat]) {
        spotlights[cat] = await DevShowcase.findOne({ status: 'APPROVED', categoryGroup: cat }).sort({ featuredAt: -1, createdAt: -1 });
        if (spotlights[cat]) {
          spotlights[cat].isAppOfTheWeek = true;
          spotlights[cat].featuredAt = new Date();
          spotlights[cat].featuredCategory = cat;
          await spotlights[cat].save();
        }
      }
    }

    const featuredProjects = await DevShowcase.find({ status: 'APPROVED' })
      .sort({ isAppOfTheWeek: -1, createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      data: {
        spotlights,
        // Legacy fallback
        appOfTheWeek: spotlights.developer || spotlights.music || spotlights.creator || null,
        projects: featuredProjects,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve developer showcase.',
      error: error.message,
    });
  }
};

/**
 * @desc    Submit a new developer / creator project for review
 * @route   POST /api/showcase/submit
 * @access  Public (Rate-limited)
 */
export const submitDevProject = async (req, res) => {
  try {
    const {
      title,
      tagline,
      description,
      appUrl,
      githubUrl,
      imageUrl,
      authorName,
      authorSocial,
      category,
      techStack,
    } = req.body || {};

    if (!title || !tagline || !description || !appUrl || !authorName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Title, Tagline, Description, Live URL, and Creator Name.',
      });
    }

    try {
      new URL(appUrl);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid live URL (including https://).',
      });
    }

    let parsedStack = ['JavaScript'];
    if (Array.isArray(techStack)) {
      parsedStack = techStack.filter(Boolean);
    } else if (typeof techStack === 'string') {
      parsedStack = techStack.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const catGroup = resolveCategoryGroup(category);

    const project = await DevShowcase.create({
      title,
      tagline,
      description,
      appUrl,
      githubUrl: githubUrl || '',
      imageUrl: imageUrl || 'https://dangling-dice-studios.com/images/banner.jpg',
      authorName,
      authorSocial: authorSocial || '',
      category: category || 'Developer Tool',
      categoryGroup: catGroup,
      techStack: parsedStack.length > 0 ? parsedStack : ['JavaScript'],
      status: 'PENDING',
      featuredCount: 0,
      featuredAt: null,
      isAppOfTheWeek: false,
    });

    try {
      await executeDiscordBroadcast({
        title: `🛠️ New Community App Submitted: ${title}`,
        description: `**Creator:** ${authorName}\n**Category:** ${category || 'Developer Tool'} (${catGroup})\n**Tagline:** ${tagline}\n**Live URL:** ${appUrl}\n\n*Review and feature this app in the Admin Portal!*`,
        link: appUrl,
        category: 'Community Submissions',
      });
    } catch (err) {
      // Non-blocking
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your project has been submitted for review and spotlight consideration.',
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit showcase project.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all submissions for admin review
 * @route   GET /api/showcase/admin
 * @access  Admin only
 */
export const getAdminShowcase = async (req, res) => {
  try {
    const submissions = await DevShowcase.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
      autoRotation: isAutoRotationEnabled,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load showcase submissions.',
      error: error.message,
    });
  }
};

/**
 * @desc    Approve / Reject project
 * @route   PUT /api/showcase/:id/status
 * @access  Admin only
 */
export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const project = await DevShowcase.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Project marked as ${status}.`,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update project status.',
      error: error.message,
    });
  }
};

/**
 * @desc    Set or unset App of the Week manually
 * @route   PUT /api/showcase/:id/feature
 * @access  Admin only
 */
export const setAppOfTheWeek = async (req, res) => {
  try {
    const { isAppOfTheWeek, broadcastShoutout } = req.body;
    const projectId = req.params.id;

    const existing = await DevShowcase.findById(projectId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (isAppOfTheWeek) {
      // Unset previous spotlight for this category group
      await DevShowcase.updateMany(
        { categoryGroup: existing.categoryGroup, isAppOfTheWeek: true },
        { isAppOfTheWeek: false }
      );
    }

    const project = await DevShowcase.findByIdAndUpdate(
      projectId,
      {
        isAppOfTheWeek: !!isAppOfTheWeek,
        status: 'APPROVED',
        featuredAt: isAppOfTheWeek ? new Date() : existing.featuredAt,
        featuredCategory: existing.categoryGroup,
        ...(isAppOfTheWeek ? { $inc: { featuredCount: 1 } } : {}),
      },
      { new: true }
    );

    if (isAppOfTheWeek && broadcastShoutout) {
      try {
        await executeDiscordBroadcast({
          title: `🏆 ${project.categoryGroup?.toUpperCase()} SPOTLIGHT: ${project.title} by ${project.authorName}`,
          description: `🌟 **Featured Creator Spotlight on Dangling Dice Studios!**\n\n"${project.tagline}"\n\n${project.description}\n\n🛠️ **Tech Stack:** ${(project.techStack || []).join(', ')}\n\n👉 Test it out live: ${project.appUrl}`,
          link: project.appUrl,
          category: 'Community Showcase',
        });
      } catch (err) {
        // Non-blocking
      }
    }

    return res.status(200).json({
      success: true,
      message: isAppOfTheWeek
        ? `"${project.title}" is now the active ${project.categoryGroup} Spotlight!`
        : `Removed from active spotlight.`,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to set spotlight.',
      error: error.message,
    });
  }
};

/**
 * @desc    Force rotation right now (Admin testing)
 * @route   POST /api/showcase/rotate-now
 * @access  Admin only
 */
export const forceRotateNow = async (req, res) => {
  try {
    const { category } = req.body || {};
    const targetCategory = category || 'all';
    const result = await triggerAutonomousRotation(true, targetCategory);
    return res.status(200).json({
      success: true,
      message: result.rotated
        ? `Rotated successfully across ${targetCategory === 'all' ? 'all categories' : targetCategory}!`
        : `Rotation skipped: ${result.reason}`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to rotate category spotlights.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete showcase entry
 * @route   DELETE /api/showcase/:id
 * @access  Admin only
 */
export const deleteShowcaseProject = async (req, res) => {
  try {
    const project = await DevShowcase.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Project removed from showcase.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project.',
      error: error.message,
    });
  }
};
