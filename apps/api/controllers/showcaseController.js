import DevShowcase from '../models/DevShowcase.js';
import { executeDiscordBroadcast } from './broadcastController.js';

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

    // Basic URL validation
    try {
      new URL(appUrl);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid live URL (including https://).',
      });
    }

    // Process tech stack tags
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

    // Notify Discord #studio-drops about community submission
    try {
      await executeDiscordBroadcast({
        title: `🛠️ New Community App Submitted: ${title}`,
        description: `**Creator:** ${authorName}\n**Tagline:** ${tagline}\n**Live URL:** ${appUrl}\n\n*Review and feature this app in the Admin Portal!*`,
        link: appUrl,
        category: 'Developer Tools',
      });
    } catch (err) {
      // Non-blocking if webhook fails
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
 * @desc    Get all submissions (including PENDING) for admin review
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
 * @desc    Set or unset App of the Week
 * @route   PUT /api/showcase/:id/feature
 * @access  Admin only
 */
export const setAppOfTheWeek = async (req, res) => {
  try {
    const { isAppOfTheWeek, broadcastShoutout } = req.body;
    const projectId = req.params.id;

    if (isAppOfTheWeek) {
      // Clear previous App of the Week
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

    // Optional 1-click broadcast shoutout to Discord community
    if (isAppOfTheWeek && broadcastShoutout) {
      try {
        await executeDiscordBroadcast({
          title: `🏆 APP OF THE WEEK: ${project.title} by ${project.authorName}`,
          description: `🌟 **Featured Creator Spotlight on Dangling Dice Studios!**\n\n"${project.tagline}"\n\n${project.description}\n\n🛠️ **Tech Stack:** ${project.techStack.join(', ')}\n\n👉 Test it out live: ${project.appUrl}`,
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
