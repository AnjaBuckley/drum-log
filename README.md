# 🥁 DrumLog

**Track your drumming practice. Visualize your progress. Stay consistent.**

DrumLog is a web app built for drummers who want to take their practice seriously. Log every session, track tempo gains, and see your consistency over time — all in one place.

![DrumLog](https://img.shields.io/badge/Built_with-Lovable-e05c3a?style=for-the-badge)

---

## ✨ Features

- **🔐 Authentication** — Sign up with email or Google (Gmail)
- **📝 Session Logging** — Record duration, focus area, BPM range, feel rating (1–5 stars), tags, exercise name, notes, and an optional audio URL
- **📊 Dashboard** — At-a-glance stats: monthly practice time, weekly session count, average BPM gain, and a 30-day practice chart
- **📋 Session History** — Browse, search, filter, edit, and delete past sessions
- **🤖 AI Schedule Generator** — Answer questions about your skill level, available time, genre preferences, and goals to get a personalized weekly practice plan powered by AI, exportable as PDF
- **📅 Practice Calendar** — View your AI-generated schedule on a calendar, track completion, and log sessions directly from scheduled events
- **🎨 Dark Theme** — A clean, drummer-friendly UI with a warm orange accent on a deep dark background

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| Backend | Lovable Cloud (Supabase) |
| Auth | Email + Google OAuth |
| Routing | React Router v6 |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/<your-username>/drumlog.git
cd drumlog

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components (AppLayout, StarRating, TagInput)
│   └── ui/           # shadcn/ui primitives
├── hooks/            # Custom hooks (useAuth, use-mobile)
├── integrations/     # Supabase client & types (auto-generated)
├── lib/              # Constants, utilities
└── pages/            # Route pages (Auth, Dashboard, LogSession, Sessions, Calendar, ScheduleGenerator)
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Made with 🧡 by a drummer, for drummers.</p>
