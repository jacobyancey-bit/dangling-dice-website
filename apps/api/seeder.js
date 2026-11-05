import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Item from './models/Item.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seeder] Connected to MongoDB at:', mongoose.connection.host);

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    console.log('[Seeder] Cleared previous records.');

    // Create Studio Admin / Creator
    const studioAdmin = await User.create({
      name: 'Dangling Dice Studios™',
      email: 'studio@danglingdice.com',
      password: 'StudioPassword2026!',
      role: 'admin',
    });
    console.log(`[Seeder] Created lead creator account: ${studioAdmin.email}`);

    // Create studio resources
    const initialResources = [
      {
        user: studioAdmin._id,
        title: 'Building Modern Full-Stack Applications from Scratch',
        description: 'Comprehensive video course showing beginners and developers how to scaffold clean three-tier architecture with Node, Express, MongoDB, and modern decoupled clients.',
        category: 'Coding Tutorials',
        mediaUrl: 'https://www.youtube.com/@danglingdicestudios',
        imageUrl: '/images/banner.jpg',
        tags: ['JavaScript', 'Node.js', 'MongoDB', 'Architecture', 'Web Dev'],
        price: 0,
        isFeatured: true,
      },
      {
        user: studioAdmin._id,
        title: 'JavaScript Game Physics: Simulating 3D Rolling Dice',
        description: 'Step-by-step coding tutorial exploring gravity, collision detection, and procedural rotation physics in vanilla JavaScript and Canvas.',
        category: 'Coding Tutorials',
        mediaUrl: 'https://www.youtube.com/@danglingdicestudios',
        imageUrl: '/images/banner.jpg',
        tags: ['Game Dev', 'JavaScript', 'Physics', 'Canvas'],
        price: 0,
        isFeatured: true,
      },
      {
        user: studioAdmin._id,
        title: 'Neon D20 — Cyberpunk Lofi Instrumental EP',
        description: 'Atmospheric beat collection crafted for late-night coding sessions, studying, and relaxed tabletop gaming. Produced by Dangling Beats Studio.',
        category: 'Beats & Audio',
        mediaUrl: 'https://www.youtube.com/@danglingdicestudios',
        imageUrl: '/images/banner.jpg',
        tags: ['Lofi', 'Beats', 'Cyberpunk', 'Study Music', 'Coding Beats'],
        price: 0,
        isFeatured: true,
      },
      {
        user: studioAdmin._id,
        title: 'Dangling 808s Vol. 1 — Hard Hitting Trap & Hip-Hop Kit',
        description: 'High-energy studio drum kit and royalty-free stems designed for producers, YouTube creators, and gaming montage editors.',
        category: 'Beats & Audio',
        mediaUrl: 'https://www.youtube.com/@danglingdicestudios',
        imageUrl: '/images/banner.jpg',
        tags: ['808', 'Trap', 'Sample Pack', 'Production'],
        price: 19.99,
        isFeatured: false,
      },
      {
        user: studioAdmin._id,
        title: 'Dangling Dice Tabletop RPG Virtual Companion',
        description: 'Interactive digital character sheet and real-time dice roller app built with modern web technologies for tabletop campaigns.',
        category: 'Studio Games',
        mediaUrl: 'https://github.com/jacobyancey-bit',
        imageUrl: '/images/logo.png',
        tags: ['TTRPG', 'Gaming', 'Dice Roller', 'Web App'],
        price: 0,
        isFeatured: true,
      },
      {
        user: studioAdmin._id,
        title: 'AudioVisualizer Component for YouTube Streamers',
        description: 'Open-source Web Audio API visualizer template that animates frequency bars and reactive waveform graphics to your tracks.',
        category: 'Developer Tools',
        mediaUrl: 'https://github.com/jacobyancey-bit',
        imageUrl: '/images/logo.png',
        tags: ['Audio API', 'Open Source', 'Visualizer', 'Tools'],
        price: 0,
        isFeatured: false,
      },
      {
        user: studioAdmin._id,
        title: 'AI Calculator — Smart Android Mathematical Assistant',
        description: 'Next-generation Android calculator powered by artificial intelligence. Solves complex algebra, calculus, step-by-step homework problems, and visualizes mathematical graphs. Available on the Google Play Store.',
        category: 'Mobile Apps',
        mediaUrl: 'https://play.google.com/store/apps/details?id=com.danglingdicestudios.aicalculator',
        imageUrl: '/images/ai_calculator.png',
        tags: ['Android', 'AI', 'Google Play', 'Calculator', 'Mobile App'],
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
