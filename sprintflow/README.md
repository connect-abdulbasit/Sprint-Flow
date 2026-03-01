# SprintFlow — Landing Page

A professional Next.js 14 + Tailwind CSS landing page for SprintFlow, a Jira-style sprint management tool.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS v3**
- **Google Fonts** — Syne (display) + DM Sans (body)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
sprintflow/
├── app/
│   ├── globals.css       # Tailwind base + custom utilities
│   ├── layout.tsx        # Root layout with metadata
│   └── page.tsx          # Main page — assembles all sections
├── components/
│   ├── Navbar.tsx        # Fixed navbar with scroll effect
│   ├── Hero.tsx          # Hero section with headline + actions
│   ├── BoardMockup.tsx   # Detailed Kanban board UI mockup
│   ├── StatsStrip.tsx    # Social proof stats bar
│   ├── Features.tsx      # 6-card feature grid
│   ├── HowItWorks.tsx    # 3-step process section
│   ├── CTA.tsx           # Bottom call-to-action
│   ├── Footer.tsx        # Footer with links
│   └── ScrollReveal.tsx  # Client-side scroll animation hook
├── tailwind.config.ts    # Extended Tailwind config
├── postcss.config.js
├── next.config.ts
└── tsconfig.json
```

## Design System

| Token     | Value       |
|-----------|-------------|
| bg        | `#0a0a0f`   |
| surface   | `#111118`   |
| surface2  | `#18181f`   |
| accent    | `#4f7cff`   |
| accent2   | `#a259ff`   |
| accent3   | `#00d4aa`   |
| muted     | `#6b6b80`   |
| muted2    | `#9090a8`   |

## Customization

- Swap the board mockup in `components/BoardMockup.tsx` with a real screenshot once your app is built
- Update stats numbers in `components/StatsStrip.tsx`
- Adjust colors in `tailwind.config.ts` under `theme.extend.colors`
- Font imports are in `app/globals.css`
