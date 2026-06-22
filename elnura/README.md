# Elnura — Psychology & Therapy site

A calm, editorial landing page for the psychologist **Elnura**
(`@elnura_psycology`), built to match the **Spread** (joinspread.app) design
system: warm paper palette, big confident grotesque type, frosted pill nav,
full-bleed cinematic sections, scattered parallax gallery, and buttery smooth
scrolling.

## Stack
- **Vite + React + TypeScript**
- **Tailwind CSS v4** (design tokens in `src/index.css`)
- **Framer Motion** — scroll reveals, parallax, count-ups
- **Lenis** — smooth scrolling
- Subtle gradient accent derived from the provided **ShaderGradient** config
  (`#ff5005 / #dbba95 / #d0bce1`), implemented lightly in `GradientField.tsx`

## Run
```bash
cd elnura
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the build
```

## ⚠️ Content is placeholder
All copy, imagery and links live in **`src/lib/content.ts`**. They are sensible
psychology placeholders so the design can be reviewed. Replace them with
Elnura's real details from the Instagram profile:

- `brand` — name, role, booking/WhatsApp/Telegram/email/Instagram links
- `img` — swap Unsplash URLs for Elnura's own photos
- `plans`, `focusAreas`, `stats`, `testimonials` — real services & prices

The visual design does **not** depend on any placeholder value — only the words
and pictures change.

## Sections
Hero → floating gallery → approach (+ session-plan panel) → dark stats →
progress showcase card → testimonial → big statement → focus chips + search →
pricing (3 tiers) → final CTA + image strip → footer.
