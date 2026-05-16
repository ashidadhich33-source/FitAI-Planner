# FitAI Planner

FitAI Planner is being built as an India-first AI fitness planning platform. The current repository starts with **Phase 0 validation**: a static landing page, free BMI/calorie/protein calculator, and waitlist capture experience.

## Phase 0 scope

- Landing page with clear India-first positioning.
- Free calculator for BMI, BMR, TDEE, goal calories, and protein target.
- Indian food and budget-aware sample plan preview.
- Beta waitlist form that stores entries in browser local storage for the demo.
- Validation pricing cards for Free, ₹99 Starter, and ₹199/month beta.

## Run locally

Because Phase 0 is a static MVP, it can be opened directly in a browser or served with any static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Validation goal

Use this page to collect early feedback before Phase 1 implementation:

1. Send traffic from Instagram, WhatsApp, and gym QR codes.
2. Track calculator completions and waitlist intent.
3. Interview early users about food preference, budget, goal, and gym/home constraints.
4. Build the first paid ₹99 PDF flow only after enough Phase 0 signal.

## Research

See [`docs/INDIA_MARKET_STUDY.md`](docs/INDIA_MARKET_STUDY.md) for the full India market and product study.
