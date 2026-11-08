import DevShowcase from '../models/DevShowcase.js';
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
 * Autonomous Weekly Rotation Engine
 * Checks if 7 days have passed since the last App of the Week was crowned.
 * If so, promotes the least-recently-featured approved project and broadcasts to Discord!
 */
export async function triggerAutonomousRotation(force = false) {
  if (!isAutoRotationEnabled && !force) {
    return { rotated: false, reason: 'Auto rotation paused.' };
  }

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const currentAotw = await DevShowcase.findOne({
    status: 'APPROVED',
    isAppOfTheWeek: true,
  });

  // Check if 7 days elapsed (unless manually forced)
  if (!force && currentAotw && currentAotw.featuredAt) {
    const elapsed = Date.now() - new Date(currentAotw.featuredAt).getTime();
    if (elapsed < SEVEN_DAYS_MS) {
      return { rotated: false, reason: 'Current app has not completed 7 days yet.' };
    }
  }

  // Find candidate: Any approved app, sorted by featuredAt ascending (nulls/oldest first), excluding current
  const query = { status: 'APPROVED' };
  if (currentAotw) {
    query._id = { $ne: currentAotw._id };
  }

  let nextCandidate = await DevShowcase.findOne(query).sort({
    featuredAt: 1,
    createdAt: 1,
  });

  // If no other candidate exists, retain current or pick any approved
  if (!nextCandidate) {
    nextCandidate = await DevShowcase.findOne({ status: 'APPROVED' });
  }

  if (!nextCandidate) {
    return { rotated: false, reason: 'No approved community apps available in database.' };
  }

  // Clear existing AOTWs
  await DevShowcase.updateMany({}, { isAppOfTheWeek: false });

  // Crown next candidate
  nextCandidate.isAppOfTheWeek = true;
  nextCandidate.featuredAt = new Date();
  await nextCandidate.save();

  console.log(`[Auto-Rotation] 🏆 Crowned new App of the Week: "${nextCandidate.title}" by ${nextCandidate.authorName}`);

  // Broadcast to Discord
  try {
    await executeDiscordBroadcast({
      title: `🏆 NEW APP OF THE WEEK: ${nextCandidate.title} by ${nextCandidate.authorName}`,
      description: `🌟 **This week's featured community spotlight on Dangling Dice Studios!**\n\n"${nextCandidate.tagline}"\n\n${nextCandidate.description}\n\n🛠️ **Tech Stack:** ${(nextCandidate.techStack || []).join(', ')}\n\n👉 Test it out live: ${nextCandidate.appUrl}`,
      link: nextCandidate.appUrl,
      category: 'Developer Tools',
    });
  } catch (err) {
    console.error('[Auto-Rotation] Discord broadcast notice error:', err.message);
  }

  return {
    rotated: true,
    newApp: nextCandidate,
  };
}

/**
 * Background Cron Runner
 * Checks every hour if the 7-day milestone has passed.
 */
const rotationTimer = setInterval(async () => {
  try {
    await triggerAutonomousRotation(false);
  } catch (err) {
    // Silently continue
  }
}, 60 * 60 * 1000); // 1 hour check

if (rotationTimer.unref) {
  rotationTimer.unref();
}

/**
 * @desc    Get all approved showcase projects & current App of the Week
 * @route   GET /api/showcase
 * @access  Public
 */
export const getPublicShowcase = async (req, res) => {
  try {
    const appOfTheWeek = await DevShowcase.findOne({
      status: 'APPROVED',
      isAppOfTheWeek: true,
    }).sort({ featuredAt: -1, updatedAt: -1 });

    const featuredProjects = await DevShowcase.find({
      status: 'APPROVED',
    })
      .sort({ isAppOfTheWeek: -1, createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: {
        appOfTheWeek: appOfTheWeek || null,
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
 * @desc    Submit a new developer project for review
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
      techStack: parsedStack.length > 0 ? parsedStack : ['JavaScript'],
      status: 'PENDING',
    });

    try {
      await executeDiscordBroadcast({
        title: `🛠️ New Community App Submitted: ${title}`,
        description: `**Creator:** ${authorName}\n**Tagline:** ${tagline}\n**Live URL:** ${appUrl}\n\n*Review and feature this app in the Admin Portal!*`,
        link: appUrl,
        category: 'Developer Tools',
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
      message: 'Failed to submit developer showcase project.',
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

    if (isAppOfTheWeek) {
      await DevShowcase.updateMany({}, { isAppOfTheWeek: false });
    }

    const project = await DevShowcase.findByIdAndUpdate(
      projectId,
      {
        isAppOfTheWeek: !!isAppOfTheWeek,
        status: 'APPROVED',
        featuredAt: isAppOfTheWeek ? new Date() : null,
      },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (isAppOfTheWeek && broadcastShoutout) {
      try {
        await executeDiscordBroadcast({
          title: `🏆 APP OF THE WEEK: ${project.title} by ${project.authorName}`,
          description: `🌟 **Featured Creator Spotlight on Dangling Dice Studios!**\n\n"${project.tagline}"\n\n${project.description}\n\n🛠️ **Tech Stack:** ${(project.techStack || []).join(', ')}\n\n👉 Test it out live: ${project.appUrl}`,
          link: project.appUrl,
          category: 'Developer Tools',
        });
      } catch (err) {
        // Non-blocking
      }
    }

    return res.status(200).json({
      success: true,
      message: isAppOfTheWeek
        ? `"${project.title}" is now the App of the Week!`
        : `Removed from App of the Week.`,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to set App of the Week.',
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
    const result = await triggerAutonomousRotation(true);
    return res.status(200).json({
      success: true,
      message: result.rotated
        ? `Rotated successfully! New App of the Week: "${result.newApp?.title}"`
        : `Rotation skipped: ${result.reason}`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to rotate App of the Week.',
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
