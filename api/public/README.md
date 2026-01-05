# Culturata Landing Page

A sophisticated, premium landing page for the Culturata Brand Suitability Platform featuring a **Premium Editorial Data Visualization** aesthetic.

## Design Direction

**Aesthetic**: Premium Editorial / Data-Driven Luxury

**Color Palette**:
- Primary: Burgundy/Wine (#8B1538) - VIP "velvet rope" exclusivity
- Base: Charcoal (#1a1a1a) and Cream (#FAF9F6)
- Accents: Gold (#D4AF37) and Silver (#C0C0C0)

**Typography**:
- Display: Playfair Display (elegant serif for headings)
- Body: Work Sans (refined sans-serif for readability)

**Key Features**:
- Bold editorial magazine-style layouts
- Interactive risk assessment visualization
- Smooth scroll animations with staggered reveals
- Responsive design for all devices
- Premium card designs with hover effects

## Structure

```
public/
├── index.html          # Main landing page
├── css/
│   └── styles.css      # All styles and animations
└── README.md           # This file
```

## Sections

1. **Hero** - Bold headline with interactive risk meter visualization
2. **Stats** - Key metrics (12 GARM categories, 98% accuracy, <2s response)
3. **Features** - 6 feature cards with icons and descriptions
4. **How It Works** - 3-step timeline with large numbered steps
5. **Pricing** - 3 pricing tiers (Free, Pro, Enterprise)
6. **CTA** - Final call-to-action with dark background
7. **Footer** - Links and company information

## Development

The landing page is served by the Express API server from the `/public` directory.

### Running Locally

```bash
cd api
npm install
npm run dev
```

Visit http://localhost:3000 to see the landing page.

### Production Deployment

The static files are automatically served when the API server runs:

```bash
npm start
```

## Design Principles

- **No Generic AI Aesthetics**: Avoids typical SaaS blue/purple gradients
- **Premium Feel**: Sophisticated burgundy color evokes trust and exclusivity
- **Editorial Layout**: Large typography and generous whitespace
- **Data Visualization**: Risk meter shows all 12 GARM categories at a glance
- **Professional Trust**: Clean, refined design for enterprise B2B audience

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- Pure CSS animations (no JavaScript animation libraries)
- Intersection Observer for scroll animations
- Optimized fonts from Google Fonts
- Minimal dependencies

---

Built with ❤️ by Culturata Labs
