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

Built on a **three-tier decoupled architecture** (Node.js/Express REST API, MongoDB via Mongoose, and a decoupled modern frontend client).

---

## 📁 Project Architecture

```text
.
├── .env.example              # Template for environment configuration
├── .env                      # Local environment configuration (dangling_dice_db)
├── .gitignore                # Git exclusions (node_modules, logs, .env)
├── README.md                 # Project architecture & setup documentation
├── package.json              # ES Modules manifest, dependencies & scripts
├── seeder.js                 # Database seeder for starter beats, tutorials, and games
├── server.js                 # Central Express application entry point
├── config/
│   └── db.js                 # MongoDB connection with Mongoose ODM
├── models/
│   ├── User.js               # User/Creator schema with bcrypt hashing & JWT match
│   └── Item.js               # Studio Resource schema (Beats, Tutorials, Games, Tools)
├── controllers/
│   ├── authController.js     # Auth logic: register, login, profile, and JWT generator
│   └── itemController.js     # Resource CRUD with category filtering and media metadata
├── routes/
│   ├── api.js                # Central API router aggregating sub-routers & health check
│   ├── authRoutes.js         # Authentication endpoints (/api/auth)
│   └── itemRoutes.js         # Resource endpoints (/api/items)
├── middleware/
│   ├── authMiddleware.js     # JWT Bearer verification & req.user attachment
│   └── errorHandler.js       # 404 handler and central JSON error formatter
└── client/
    ├── images/
    │   ├── logo.jpg          # Dangling Dice Studios official emblem
    │   └── banner.jpg        # Studio workspace hero artwork
    └── index.html            # Decoupled frontend client (Interactive UI & API Inspector)
```

---

## 🛠️ Tech Stack

- **Runtime & Framework:** Node.js, Express.js (ES Modules `"type": "module"`)
- **Database & ODM:** MongoDB, Mongoose v8
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), Bcrypt password hashing (`bcryptjs`)
- **Security:** HTTP Headers hardening (`helmet`), Cross-Origin Resource Sharing (`cors`), Environment isolation (`dotenv`)
- **Developer Tooling:** `nodemon` for auto-reloading during development

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Initial Studio Content
Populates the database (`dangling_dice_db`) with sample tutorials from Dangling Dice Coding and music releases from Dangling Beats:
```bash
npm run seed
```

> **Default Seed Credentials:**
> - Email: `studio@danglingdice.com`
> - Password: `StudioPassword2026!`

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open in Browser
- **Dangling Dice Studios™ Hub:** [http://localhost:5000](http://localhost:5000)
- **REST API Base & Health Check:** [http://localhost:5000/api](http://localhost:5000/api)

---

## 📡 REST API Reference

| Endpoint | Method | Protection | Description |
| :--- | :---: | :---: | :--- |
| `GET /api` | `GET` | Public | System status and active endpoint discovery |
| `POST /api/auth/register` | `POST` | Public | Create new creator account; returns JWT |
| `POST /api/auth/login` | `POST` | Public | Authenticate creator; returns JWT |
| `GET /api/auth/profile` | `GET` | **Bearer JWT** | Get current creator profile |
| `GET /api/items` | `GET` | Public | List studio content (supports `?category=...`) |
| `GET /api/items/:id` | `GET` | Public | Get specific content item by MongoDB ID |
| `POST /api/items` | `POST` | **Bearer JWT** | Publish new tutorial, beat, or game |
| `PUT /api/items/:id` | `PUT` | **Bearer JWT** | Edit published content (creator only) |
| `DELETE /api/items/:id` | `DELETE` | **Bearer JWT** | Remove content (creator only) |

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
