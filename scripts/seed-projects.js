/**
 * Seed & Upsert Script: Connects completed studio & developer projects into MongoDB.
 * Idempotently updates or inserts projects in Item and DevShowcase collections.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment files.');
  process.exit(1);
}

const PROJECTS_TO_SEED = [
  {
    title: 'Titrate-Health — Clinical Telehealth & GLP-1 Titration Platform',
    description: 'Production clinical weight-management platform featuring automated FDA BMI & contraindication intake triage, deterministic GLP-1 titration state machine, Recurly subscription lifecycle, and HIPAA-compliant server-side PHI firewall.',
    category: 'Developer Tools',
    tags: ['Next.js 16', 'TypeScript', 'PostgreSQL', 'Prisma', 'Redis', 'HIPAA', 'Telehealth'],
    isTool: true,
    toolType: 'web-utility',
    price: 0,
    isFeatured: true,
    isAvailable: true,
    liveUrl: 'https://github.com/jacobyancey-bit/titrate-health',
    mediaUrl: 'https://github.com/jacobyancey-bit/titrate-health',
    imageUrl: '/images/banner.jpg',
    showcase: {
      tagline: 'Clinical weight management, GLP-1 titration state machine, & HIPAA PHI firewall',
      appUrl: 'https://github.com/jacobyancey-bit/titrate-health',
      githubUrl: 'https://github.com/jacobyancey-bit/titrate-health',
      authorName: 'Jacob Yancey',
      authorSocial: 'https://github.com/jacobyancey-bit',
      category: 'Developer Tool',
      categoryGroup: 'developer',
      status: 'approved',
      techStack: ['Next.js 16', 'TypeScript', 'Prisma', 'PostgreSQL', 'Redis'],
    },
  },
  {
    title: 'daas-scraper — Distributed Web Scraping & AI Extraction Engine',
    description: 'High-throughput, distributed browser automation engine powered by BullMQ, Playwright Stealth, Supabase, and Next.js. Features automated residential proxy failover and job queue orchestration for reliable web extraction at scale.',
    category: 'Developer Tools',
    tags: ['Playwright', 'BullMQ', 'Redis', 'Supabase', 'Next.js', 'Web Scraping', 'Automation'],
    isTool: true,
    toolType: 'api-service',
    price: 0,
    isFeatured: true,
    isAvailable: true,
    liveUrl: 'https://github.com/jacobyancey-bit/daas-scraper',
    mediaUrl: 'https://github.com/jacobyancey-bit/daas-scraper',
    imageUrl: '/images/banner.jpg',
    showcase: {
      tagline: 'Distributed headless browser scraping engine with BullMQ and automated proxy rotation',
      appUrl: 'https://github.com/jacobyancey-bit/daas-scraper',
      githubUrl: 'https://github.com/jacobyancey-bit/daas-scraper',
      authorName: 'Jacob Yancey',
      authorSocial: 'https://github.com/jacobyancey-bit',
      category: 'Developer Tool',
      categoryGroup: 'developer',
      status: 'approved',
      techStack: ['Playwright', 'BullMQ', 'Redis', 'Supabase', 'Next.js'],
    },
  },
  {
    title: 'Local AI Service Engine & 24/7 Model Training Gateway',
    description: 'High-speed standalone API Gateway for running local LLMs (Ollama Qwen 2.5 & Llama 3.1), Kokoro-TTS neural speech synthesis, ComfyUI visual generation, and RAG vector memory via FastAPI and Uvicorn.',
    category: 'Developer Tools',
    tags: ['FastAPI', 'Python', 'Ollama', 'LLM', 'Kokoro-TTS', 'RAG', 'AI'],
    isTool: true,
    toolType: 'api-service',
    price: 0,
    isFeatured: true,
    isAvailable: true,
    liveUrl: 'https://github.com/jacobyancey-bit/local-ai-engine',
    mediaUrl: 'https://github.com/jacobyancey-bit/local-ai-engine',
    imageUrl: '/images/banner.jpg',
  },
  {
    title: 'Dangling Dice WireGuard VPN & Zero-Log Infrastructure',
    description: 'Zero-log, in-kernel Linux WireGuard VPN gateway with Caddy 2.8 automated SSL, Go control plane microservices, WebRTC/DNS leak diagnostics, and instant 1-click QR profile provisioning.',
    category: 'Developer Tools',
    tags: ['WireGuard', 'Go', 'Golang', 'Caddy', 'Next.js 14', 'Security', 'VPN'],
    isTool: true,
    toolType: 'standalone-app',
    price: 0,
    isFeatured: true,
    isAvailable: true,
    liveUrl: 'https://github.com/jacobyancey-bit/dangling-dice-vpn',
    mediaUrl: 'https://github.com/jacobyancey-bit/dangling-dice-vpn',
    imageUrl: '/images/banner.jpg',
  },
  {
    title: 'QuoteHubDotNet — Enterprise C# REST API & AWS Container Platform',
    description: 'High-performance quote management microservice built on C# and .NET 8 Web API, fully containerized with Docker and configured for automated Amazon Web Services (AWS) deployment pipelines.',
    category: 'Developer Tools',
    tags: ['C#', '.NET 8', 'Docker', 'AWS', 'Microservices', 'REST API'],
    isTool: true,
    toolType: 'api-service',
    price: 0,
    isFeatured: false,
    isAvailable: true,
    liveUrl: 'https://github.com/jacobyancey-bit/QuoteHubDotNet',
    mediaUrl: 'https://github.com/jacobyancey-bit/QuoteHubDotNet',
    imageUrl: '/images/banner.jpg',
  },
  {
    title: 'Travlr Getaways — Full-Stack MEAN Travel Platform',
    description: 'Full-stack travel booking application featuring clear architectural separation between backend REST endpoints and server-rendered Handlebars views with MongoDB persistence and Dockerized services.',
    category: 'Developer Tools',
    tags: ['Node.js', 'Express', 'MongoDB', 'Handlebars', 'Docker', 'REST API'],
    isTool: true,
    toolType: 'web-utility',
    price: 0,
    isAvailable: true,
    liveUrl: 'https://github.com/jacobyancey-bit/travlr',
    mediaUrl: 'https://github.com/jacobyancey-bit/travlr',
    imageUrl: '/images/banner.jpg',
  },
  {
    title: 'OmniFPS — 3D Unity First-Person Shooter & Physics Sandbox',
    description: 'Interactive 3D first-person shooter physics engine built in Unity and C#, featuring raycast ballistic weapon mechanics, procedural camera recoil, kinematic player movement, and arena level design.',
    category: 'Studio Games',
    tags: ['Unity 3D', 'C#', 'Game Dev', 'Physics', 'FPS', 'Shader Graph'],
    isTool: true,
    toolType: 'standalone-app',
    price: 0,
    isFeatured: true,
    isAvailable: true,
    liveUrl: 'https://games.dangling-dice-studios.com',
    mediaUrl: 'https://games.dangling-dice-studios.com',
    imageUrl: '/images/banner.jpg',
  },
];

async function seed() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  const conn = await mongoose.connect(MONGODB_URI);
  const db = conn.connection.db;

  const adminUser = await db.collection('users').findOne({ role: 'admin' });
  const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();
  console.log(`👤 Using Admin Creator ID: ${adminId}`);

  console.log('📦 Upserting completed projects into `items` collection...');
  let itemsUpserted = 0;
  for (const proj of PROJECTS_TO_SEED) {
    const filter = { title: proj.title };
    const doc = {
      user: adminId,
      title: proj.title,
      description: proj.description,
      category: proj.category,
      tags: proj.tags,
      isTool: proj.isTool,
      toolType: proj.toolType,
      price: proj.price,
      isFeatured: proj.isFeatured,
      isAvailable: proj.isAvailable,
      liveUrl: proj.liveUrl,
      mediaUrl: proj.mediaUrl,
      imageUrl: proj.imageUrl,
      updatedAt: new Date(),
    };

    const res = await db.collection('items').updateOne(
      filter,
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    if (res.upsertedCount > 0 || res.modifiedCount > 0) {
      itemsUpserted++;
    }
    console.log(`  ✅ Item: ${proj.title}`);
  }

  console.log('🌟 Upserting hero projects into `devshowcases` collection...');
  let showcasesUpserted = 0;
  for (const proj of PROJECTS_TO_SEED) {
    if (!proj.showcase) continue;
    const filter = { title: proj.title };
    const doc = {
      title: proj.title,
      tagline: proj.showcase.tagline,
      description: proj.description,
      appUrl: proj.showcase.appUrl,
      githubUrl: proj.showcase.githubUrl,
      imageUrl: 'https://dangling-dice-studios.com/images/banner.jpg',
      authorName: proj.showcase.authorName,
      authorSocial: proj.showcase.authorSocial,
      category: proj.showcase.category,
      categoryGroup: proj.showcase.categoryGroup,
      status: proj.showcase.status,
      techStack: proj.showcase.techStack,
      updatedAt: new Date(),
    };

    const res = await db.collection('devshowcases').updateOne(
      filter,
      { $set: doc, $setOnInsert: { createdAt: new Date(), votes: 0, views: 0 } },
      { upsert: true }
    );
    if (res.upsertedCount > 0 || res.modifiedCount > 0) {
      showcasesUpserted++;
    }
    console.log(`  ⭐ Showcase: ${proj.title}`);
  }

  console.log(`\n🎉 Success! Upserted ${itemsUpserted} items and ${showcasesUpserted} showcases.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
