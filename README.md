# Dangling Dice Studios™ — Full-Stack Platform

The official full-stack web application for **Dangling Dice Studios™**, serving as the central hub for:
- 🎧 **Dangling Beats Studio** — Music production, lofi, dark trap, and synth beats for YouTube and content creators.
- 📱 **Mobile Apps & AI** — Smart Android productivity utilities, including the **AI Calculator** on Google Play.
- 💻 **Dangling Dice Coding** — Coding masterclasses, full-stack web development tutorials, and game engineering.
- 🎲 **Studio Games & Tools** — Custom tabletop RPG companions, digital dice rollers, and developer assets.

### 🔗 Official Channels & Founder Links
- **Google Play Store:** [AI Calculator on Google Play](https://play.google.com/store/apps/details?id=com.danglingdicestudios.aicalculator)
- **YouTube:** [@danglingdicestudios](https://www.youtube.com/@danglingdicestudios)
- **GitHub:** [@jacobyancey-bit](https://github.com/jacobyancey-bit)
- **LinkedIn:** [Jacob Yancey](https://www.linkedin.com/in/jacob-yancey-085151372)

Built on a **modern monorepo architecture** (`apps/api`, `apps/web`, and `packages/shared`) utilizing npm workspaces.

---

## 📁 Monorepo Architecture

```text
.
├── .env.example              # Template for environment configuration
├── .env                      # Local environment configuration (dangling_dice_db)
├── .gitignore                # Git exclusions (node_modules, dist, logs, .env)
├── README.md                 # Project architecture & setup documentation
├── package.json              # Root workspace coordinator (workspaces: ["apps/*", "packages/*"])
├── apps/
│   ├── api/                  # Dedicated Express REST API Service (Port 5000)
│   │   ├── package.json      # @dangling-dice/api
│   │   ├── server.js         # Dedicated API entry point
│   │   ├── seeder.js         # Database seeder for starter beats, tutorials, games
│   │   ├── config/           # MongoDB connection with Mongoose ODM
│   │   ├── models/           # Mongoose schemas (User, Item)
│   │   ├── controllers/      # Auth & Item CRUD logic
│   │   ├── routes/           # Central /api router & endpoints
│   │   ├── middleware/       # JWT auth, rate limiter, error handling
│   │   └── tests/            # Automated security regression suite
│   │
│   └── web/                  # Decoupled Frontend Client Service (Port 3000)
│       ├── package.json      # @dangling-dice/web (powered by Vite)
│       ├── vite.config.js    # Dev server & reverse proxy (/api -> :5000)
│       ├── index.html        # Public studio catalog & cinema viewer UI
│       ├── admin.html        # Creator management portal UI
│       ├── css/main.css      # Studio styling & design system
│       ├── js/app.js         # Public catalog client script
│       ├── js/admin.js       # Admin portal client script
│       └── images/           # Studio branding, logos, app artwork
│
└── packages/
    └── shared/               # Single Source of Truth (SSOT)
        ├── package.json      # @dangling-dice/shared
        └── index.js          # Shared categories, roles, divisions, API endpoints
```

---

## 🛠️ Tech Stack

- **Monorepo Architecture:** npm Workspaces (`apps/*`, `packages/*`)
- **Backend API (`apps/api`):** Node.js, Express.js (ES Modules), MongoDB & Mongoose v8, JWT, Bcryptjs, Helmet, CORS, Rate-Limiting
- **Frontend Web (`apps/web`):** Decoupled static UI built and served with Vite, reverse-proxied to API
- **Shared Layer (`packages/shared`):** Single Source of Truth for studio domain constants and route definitions
- **Developer Tooling:** `nodemon`, `vite`, Node.js native test runner

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Installs dependencies across all workspaces and links shared packages:
```bash
npm install
```

### 2. Seed Initial Studio Content
Populates MongoDB (`dangling_dice_db`) with sample tutorials from Dangling Dice Coding and music releases from Dangling Beats. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in your local `.env` before running on a blank database:
```bash
npm run seed
```

### 3. Start Development Services

**Start API Server (Port 5000):**
```bash
npm run dev:api
```

**Start Web Client (Port 3000):**
```bash
npm run dev:web
```

### 4. Run Test Suite
```bash
npm run test
```

### 5. Build Web Client for Production
```bash
npm run build:web
```

### 4. Open in Browser
- **Dangling Dice Studios™ Hub:** [http://localhost:5000](http://localhost:5000)
- **REST API Base & Health Check:** [http://localhost:5000/api](http://localhost:5000/api)

---

## 📡 REST API Reference

| Endpoint | Method | Protection | Description |
| :--- | :---: | :---: | :--- |
| `GET /api` | `GET` | Public | System status and active endpoint discovery |
| `POST /api/auth/register` | `POST` | Public (Turnstile) | Create new creator account; returns JWT |
| `POST /api/auth/login` | `POST` | Public (Turnstile) | Authenticate creator; returns JWT |
| `GET /api/auth/profile` | `GET` | **Bearer JWT** | Get current creator profile |
| `GET /api/items` | `GET` | Public | List studio content (supports `?category=...`) |
| `GET /api/items/:id` | `GET` | Public | Get specific content item by MongoDB ID |
| `POST /api/items` | `POST` | **Bearer JWT** | Publish new tutorial, beat, or game |
| `PUT /api/items/:id` | `PUT` | **Bearer JWT** | Edit published content (creator only) |
| `DELETE /api/items/:id` | `DELETE` | **Bearer JWT** | Remove content (creator only) |
| `POST /api/checkout/create-session` | `POST` | Public / Optional Auth | Create Stripe Checkout Session for beats & digital assets |
| `POST /api/checkout/webhook` | `POST` | Stripe Signature | Fulfill orders and generate digital license keys |
| `GET /api/checkout/order/:sessionId` | `GET` | Public | Retrieve order fulfillment status post-checkout |
| `GET /api/orders` | `GET` | Public / Optional Auth | List customer orders and verified license keys |

---

## 📮 Testing with Postman

A pre-built Postman Collection has been generated for you in the repository root:
`Dangling_Dice_Studios.postman_collection.json`

### How to Import & Run:
1. Open **Postman**.
2. Click **Import** (top left) and select [Dangling_Dice_Studios.postman_collection.json](file:///c:/Users/jacob/Dangling_Dice_Website/Dangling_Dice_Studios.postman_collection.json).
3. The collection includes 3 folders:
   - **01. Health & Database Verification:** Tests `GET /api` to confirm MongoDB is connected (`database.connected: true`).
   - **02. Authentication & Creator Portal:** Tests login and profile; automatically captures the `{{jwtToken}}` for subsequent requests.
   - **03. Studio Resources & MongoDB Queries:** Tests MongoDB CRUD, queries, and filters (including the Google Play AI Calculator).
4. Click **Run collection** to execute all tests automatically or test endpoints individually.
