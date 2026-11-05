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
        title: 'Neon D20 — Cyberpunk Lofi Instrumental EP',
        description: 'Atmospheric beat collection crafted for late-night coding sessions, studying, and focus. Produced by Dangling Beats Studio.',
        category: 'Beats & Audio',
        mediaUrl: 'https://www.youtube.com/@danglingdicestudios',
        imageUrl: '/images/banner.jpg',
        tags: ['Lofi', 'Beats', 'Cyberpunk', 'Study Music', 'Coding Beats'],
        price: 0,
        isFeatured: true,
      },
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
      // --- STANDALONE & BROWSER DEVELOPER TOOLS ---
      {
        user: studioAdmin._id,
        title: 'MongoDB Connection URI & Query Inspector',
        description: 'Interactive client-side developer utility. Validates SRV connection strings, encodes credentials, highlights syntax errors, and generates clean .env environment variable configs.',
        category: 'Developer Tools',
        mediaUrl: '#mongoInspector',
        imageUrl: '/images/logo.png',
        tags: ['MongoDB', 'DevTools', 'Database', 'Utility'],
        price: 0,
        isFeatured: true,
        isTool: true,
        toolType: 'web-utility',
        liveUrl: '#mongoInspector',
      },
      {
        user: studioAdmin._id,
        title: 'Dangling Dice Secure Dev VPN & Proxy',
        description: 'High-speed, encrypted WireGuard VPN built specifically for developers. Geolocation testing, static IP whitelisting for cloud databases, and privacy protection.',
        category: 'Developer Tools',
        mediaUrl: 'https://vpn.danglingdice.com',
        imageUrl: '/images/logo.png',
        tags: ['VPN', 'WireGuard', 'Privacy', 'Android', 'DevTools'],
        price: 0,
        isFeatured: true,
        isTool: true,
        toolType: 'standalone-app',
        liveUrl: 'https://vpn.danglingdice.com',
      },
      // --- CURATED PARTNER & AFFILIATE RECOMMENDATIONS ---
      {
        user: studioAdmin._id,
        title: 'MongoDB Atlas — Multi-Cloud Managed Database',
        description: 'Deploy fully managed MongoDB clusters across AWS, Google Cloud, and Azure. Free shared cluster tier with automated backups, monitoring, and seamless scaling.',
        category: 'Developer Tools',
        mediaUrl: 'https://www.mongodb.com/cloud/atlas/register',
        imageUrl: '/images/logo.png',
        tags: ['MongoDB', 'Atlas', 'Cloud Database', 'Recommended'],
        price: 0,
        isFeatured: true,
        isAffiliate: true,
        affiliateCategory: 'Cloud Hosting & Databases',
        affiliateBadge: 'Official Cloud Partner • Free Tier Available',
        affiliateUrl: 'https://www.mongodb.com/cloud/atlas/register',
      },
      {
        user: studioAdmin._id,
        title: 'DigitalOcean — Cloud Compute & Dedicated Droplets',
        description: 'Developer-friendly cloud computing, scalable VPS droplets, managed Kubernetes, and databases. Simple pricing with zero hidden egress fees.',
        category: 'Developer Tools',
        mediaUrl: 'https://www.digitalocean.com',
        imageUrl: '/images/logo.png',
        tags: ['Cloud', 'VPS', 'Hosting', 'Droplets', 'Recommended'],
        price: 0,
        isFeatured: true,
        isAffiliate: true,
        affiliateCategory: 'Cloud Hosting & Databases',
        affiliateBadge: 'Partner Deal • $200 Free 60-Day Credit',
        affiliateUrl: 'https://www.digitalocean.com',
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
