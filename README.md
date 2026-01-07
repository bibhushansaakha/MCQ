# Kati Sajilo - NEC Exam Preparation

A fast, minimal MCQ practice website for Nepal Engineering Council exam preparation. Built with Next.js 14, TypeScript, Tailwind CSS, and SQLite.

## Features

- 📚 **Chapter Practice**: Practice questions from 10 different chapters with hints and explanations
- 🎯 **Quick Test**: 25 questions in 30 minutes from all chapters
- 🏆 **Full Test**: 100 questions in 2 hours - complete exam simulation
- ✅ **Instant Feedback**: Immediate feedback on correct/incorrect answers
- 💡 **Hints & Explanations**: Access hints and detailed explanations for each question
- 📊 **Performance Dashboard**: Track your performance with comprehensive analytics
  - Overall statistics (accuracy, time spent, hints used)
  - Per-chapter statistics
  - Performance trends over time
  - Time distribution analysis
  - Hints usage trends
  - Chapter comparison charts
- 📖 **Attempts History**: Review all attempted questions with full details
- 🌓 **Dark Mode**: Toggle between light and dark themes
- ⚡ **Fast & Minimal**: Optimized for speed with minimal animations
- ⌨️ **Keyboard Shortcuts**: Navigate and answer questions using keyboard

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bibhushansaakha/MCQ.git
cd MCQ
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

The `.env` file should contain:
```env
# For local development with PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mcq_db"

# Or use your Vercel Prisma Postgres connection string for testing
# DATABASE_URL="postgres://..."
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run database migrations:
```bash
npx prisma migrate deploy
```

6. Import questions from JSON files:
```bash
npm run migrate-data
```

This will create the database and import all questions from the JSON files in `public/data/`.

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import your repository in Vercel
3. **Database is already configured!** 
   - Vercel Prisma Postgres automatically sets `DATABASE_URL`
   - No need to manually add environment variables
   - The connection string is automatically available
4. Deploy!

5. **Initialize the database** (IMPORTANT):
   After deployment, visit your Vercel URL and go to:
   ```
   https://your-app.vercel.app/api/init-db
   ```
   Or make a POST request to initialize:
   ```bash
   curl -X POST https://your-app.vercel.app/api/init-db
   ```
   
   This will:
   - Create all topics from `topics.json`
   - Import all questions from JSON files in `public/data/`
   - Set up the database for use

The build process will:
- Generate Prisma client during build
- Run database migrations
- Create the database file on first run

**Note**: The database initialization only needs to be done once. After that, the database will persist across deployments.

**Alternative**: For production deployments, consider using a hosted database (PostgreSQL) instead of SQLite for better performance and reliability.

## Project Structure

```
MCQ/
├── public/
│   └── data/          # JSON files containing questions
├── prisma/
│   ├── schema.prisma  # Database schema
│   ├── migrate-data.ts # Script to import questions from JSON
│   └── migrations/    # Database migrations
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── contexts/      # React contexts (Theme, QuizStats)
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility functions
└── package.json
```

## Database Setup

The application uses PostgreSQL (Vercel Prisma Postgres) with Prisma ORM. The database is persistent and works perfectly with Vercel's serverless architecture.

### Adding New Questions

You can add questions in two ways:

1. **Upload via UI**: Go to `/admin/upload` and upload a JSON file
2. **Add JSON files**: Place JSON files in `public/data/` following the format:
```json
[
  {
    "chapter": "Chapter 1: Electrical & Electronics",
    "questions": [
      {
        "id": 1,
        "question": "Your question here",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correct_answer": "Option 1",
        "hint": "Optional hint",
        "explanation": "Optional explanation",
        "chapter": "chapter-01",
        "difficulty": "easy"
      }
    ]
  }
]
```

Then run `npm run migrate-data` to import them.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Prisma** - ORM for database management
- **SQLite** - File-based database
- **Recharts** - Charting library for analytics

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate-data` - Import questions from JSON files into database
- `npm run update-topics` - Update topic names from topics.json
- `npm run fix` - Clean cache and rebuild

## License

This project is open source and available under the MIT License. Feel free to use, modify, and distribute.

## Author

**Bibhushan Saakha**
- GitHub: [@bibhushansaakha](https://github.com/bibhushansaakha)
- LinkedIn: [@bibhushansaakha](https://www.linkedin.com/in/bibhushansaakha)

## Contributing

Contributions, suggestions, and feedback are welcome! This is a casual side project, so feel free to fork, modify, or contribute as you see fit.

## Acknowledgments

Built as a personal project to help prepare for the Nepal Engineering Council exam. Open source and free to use.
