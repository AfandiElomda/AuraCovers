# AuraCovers

AI-powered book cover generator using Google Gemini AI. Create professional book covers with a simple form and download them instantly.

## Features

- **AI-Generated Covers**: Uses Google Gemini to create unique book covers
- **Freemium Model**: 5 free downloads, then $1 for 10 additional covers
- **Customizable**: Title, author, genre, keywords, mood, and color preferences
- **Instant Download**: High-quality PNG covers ready for use
- **Session Tracking**: Persistent download counts across sessions

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Google Gemini 2.0 Flash Image Generation
- **Payments**: Paystack integration
- **Build**: Vite + ESBuild

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Run development server: `npm run dev`
5. Open http://localhost:5000

## Environment Variables

```
DATABASE_URL=your_postgresql_url
GEMINI_API_KEY=your_gemini_api_key
PAYSTACK_SECRET_KEY=your_paystack_secret
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## License

MIT License - see LICENSE file for details.