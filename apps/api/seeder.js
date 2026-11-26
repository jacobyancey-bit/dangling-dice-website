import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Item from './models/Item.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seeder] Connected to MongoDB at:', mongoose.connection.host);

    // Clear existing catalog items (preserving existing admin user accounts)
    await Item.deleteMany({});
    console.log('[Seeder] Cleared previous catalog records.');

    // Find or create Studio Admin / Creator (requires env vars when bootstrapping a new DB)
    let studioAdmin = await User.findOne({ role: 'admin' });
    if (!studioAdmin) {
      const seedEmail = process.env.SEED_ADMIN_EMAIL;
      const seedPassword = process.env.SEED_ADMIN_PASSWORD;
      if (!seedEmail || !seedPassword) {
        throw new Error(
          '[Seeder] No admin account exists. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your local .env before seeding.'
        );
      }
      studioAdmin = await User.create({
        name: 'Dangling Dice Studios™',
        email: seedEmail,
        password: seedPassword,
        role: 'admin',
      });
      console.log(`[Seeder] Created lead creator account: ${studioAdmin.email}`);
    } else {
      console.log(`[Seeder] Using existing admin account: ${studioAdmin.email}`);
    }

    // Create studio resources (100% Dangling Dice Studios™ In-House Products & Releases)
    const initialResources = [
      {
        user: studioAdmin._id,
        title: 'AI Calculator — Smart Android Mathematical Assistant',
        description: 'Next-generation Android calculator powered by artificial intelligence. Solves complex algebra, calculus, step-by-step homework problems, and visualizes mathematical graphs. Available on Google Play Store.',
        category: 'Mobile Apps',
        mediaUrl: 'https://play.google.com/store/apps/details?id=com.danglingdicestudios.aicalculator',
        imageUrl: '/images/ai_calculator.png',
        tags: ['Android', 'AI', 'Google Play', 'Calculator', 'Mobile App'],
        price: 0,
        isFeatured: true,
      },
      {
        user: studioAdmin._id,
        title: 'Dangling Dice Media Converter — URL to 320kbps MP3 & 1080p MP4',
        description: 'Our high-speed, zero-ad media transcoder. Extract clean 320kbps MP3 audio tracks, samples, reference stems, and 1080p MP4 video directly to your local Downloads folder.',
        category: 'Developer Tools',
        mediaUrl: 'https://media.dangling-dice-studios.com/',
        imageUrl: '/images/thumb_media_converter.svg',
        tags: ['MP3 Converter', 'MP4 Video', 'Audio Sampling', 'Web App', 'Studio Tool'],
        price: 0,
        isFeatured: true,
        isTool: true,
        toolType: 'standalone-app',
        liveUrl: 'https://media.dangling-dice-studios.com/',
      },
      {
        user: studioAdmin._id,
        title: 'Dangling Beats — Lo-Fi Drive & Cyberpunk Focus Radio',
        description: 'Original lofi, dark trap, and synthwave instrumental stream crafted for late-night programming sessions, studying, and focus. Produced in-house by Dangling Beats Studio.',
        category: 'Beats & Audio',
        mediaUrl: 'https://www.youtube.com/watch?v=2J-U0EUATHs&list=PLAg2ptU_xF5c',
        imageUrl: 'https://i.ytimg.com/vi/2J-U0EUATHs/maxresdefault.jpg',
        tags: ['Lofi', 'Beats', 'Cyberpunk', 'Study Music', 'Coding Beats'],
        price: 0,
        isFeatured: true,
      },
      {
        user: studioAdmin._id,
        title: 'Dangling Dice Central REST API & 13 Developer Sandboxes',
        description: '21 production REST API endpoints and 13 interactive browser sandboxes covering JSON-to-Zod schema inference, GIS polygon acreage math, Luhn PII redaction, and financial amortization.',
        category: 'Developer Tools',
        mediaUrl: 'https://rapidapi.com/user/JacobYancey-zSna1bjQ-',
        imageUrl: '/images/thumb_compute_api.svg',
        tags: ['REST API', 'RapidAPI', 'TypeScript', 'Sandboxes', 'DevTools'],
        price: 0,
        isFeatured: true,
        isTool: true,
        toolType: 'web-utility',
        liveUrl: '#computeApiSuite',
      },
      {
        user: studioAdmin._id,
        title: 'Building Modern Full-Stack Applications from Scratch',
        description: 'Hands-on software engineering masterclasses and open-source repositories showing how to architect production Node.js, Fastify, Express, MongoDB, and React/Next.js systems.',
        category: 'Coding Tutorials',
        mediaUrl: 'https://www.youtube.com/@danglingdicestudios',
        imageUrl: '/images/thumb_fullstack_coding.svg',
        tags: ['JavaScript', 'Node.js', 'MongoDB', 'Architecture', 'Web Dev'],
        price: 0,
        isFeatured: true,
      },
    ];

    await Item.insertMany(initialResources);
    console.log(`[Seeder] Seeded ${initialResources.length} studio resources successfully!`);

    await mongoose.disconnect();
    console.log('[Seeder] Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error]:', err.message);
    process.exit(1);
  }
};

seedData();
