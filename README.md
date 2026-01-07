# Kati Sajilo - NEC Exam Preparation

A fast, minimal MCQ practice website for Nepal Engineering Council exam preparation. Built with Next.js 14, TypeScript, and Tailwind CSS. Features both Learn Mode for studying concepts and Practice Mode for exam preparation. All data is stored in JSON files and browser localStorage - no database required!

## Features

### 🎓 Learn with MCQ

A dedicated learning mode designed for studying and understanding concepts:

- **Chapter-wise Learning**: Study questions from 9 chapters (Chapters 1-6, 8-10) in order
- **Always Show Explanations**: Explanations are displayed after every answer, even if correct
- **Sequential Learning**: Questions are shown in order (not randomized) for structured learning
- **Chapter Navigation**: Easily switch between chapters without losing progress
- **Question Navigation**: Jump to any question using the sidebar navigation
- **Progress Tracking**: Track how many questions you've answered in each chapter

### 📝 Practice Past Questions

Test your knowledge with various practice modes:

#### Chapter Practice

- Practice questions from specific chapters
- Access hints and detailed explanations
- Questions are randomized for varied practice
- Track your performance per chapter

#### Quick Test

- **25 questions** in **30 minutes**
- Questions randomly selected from all chapters
- Simulates a quick exam scenario
- No hints or explanations during the test (available in review)

#### Full Test

- **100 questions** in **2 hours**
- Complete exam simulation matching NEC exam format
- Questions distributed evenly across all chapters
- Timer counts down to simulate real exam pressure

### 📊 Additional Features

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
- 🔍 **Session Review**: Review completed sessions with detailed analysis
- 🌓 **Dark Mode**: Toggle between light and dark themes
- ⚡ **Fast & Minimal**: Optimized for speed with minimal animations
- ⌨️ **Keyboard Shortcuts**: Navigate and answer questions using keyboard
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

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

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import your repository in Vercel
3. Deploy!

**No database setup required!** The application uses:

- JSON files for questions (stored in `public/data/`)
- Browser localStorage for analytics and sessions (client-side only)

Questions are loaded directly from JSON files at runtime, and analytics are stored locally in each user's browser.

## Project Structure

```
MCQ/
├── public/
│   └── data/
│       ├── learn/     # JSON files for Learn mode (1.json, 2.json, etc.)
│       └── *.json     # JSON files for practice mode questions
├── src/
│   ├── app/
│   │   ├── learn/     # Learn with MCQ page
│   │   ├── practice/  # Practice Past Questions page
│   │   ├── quiz/
│   │   │   ├── learn/[chapter]/  # Learn mode quiz page
│   │   │   ├── [topic]/         # Chapter practice page
│   │   │   └── exam/[mode]/     # Quick/Full test pages
│   │   ├── analytics/ # Performance dashboard
│   │   ├── history/   # Attempts history
│   │   └── review/    # Session review
│   ├── components/    # React components
│   ├── contexts/      # React contexts (Theme, QuizStats)
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility functions
└── package.json
```

## Usage Guide

### Learn Mode

1. Click **"Learn with MCQ"** on the homepage
2. Select a chapter (1-6, 8-10)
3. Questions are displayed in order
4. Answer questions and view explanations
5. Use navigation controls to move between questions and chapters

### Practice Mode

1. Click **"Practice Past Questions"** on the homepage
2. Choose your preferred mode:
   - **Chapter Practice**: Select a chapter to practice
   - **Quick Test**: Start a 25-question test
   - **Full Test**: Start a 100-question exam simulation
3. Answer questions and track your performance
4. Review your session after completion

## Data Storage

The application uses a simple, database-free architecture:

- **Questions**: Stored in JSON files in `public/data/` and `public/data/learn/`
- **Analytics & Sessions**: Stored in browser localStorage (client-side only)
- **No database required**: Everything works out of the box!

### Adding New Questions

#### For Practice Mode

Add JSON files to `public/data/` following the format:

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

#### For Learn Mode

Add JSON files to `public/data/learn/` with two supported formats:

**Format 1: Array of chapter objects** (for chapters with multiple sets)

```json
[
  {
    "chapter": "Chapter 9: AI and Neural Networks",
    "questions": [
      {
        "id": 1,
        "question": "Your question here",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correct_answer": "Option 1",
        "hint": "Optional hint",
        "explanation": "Detailed explanation",
        "chapter": "Chapter 9: AI and Neural Networks",
        "difficulty": "easy"
      }
    ]
  }
]
```

**Format 2: Direct array of questions** (simpler format)

```json
[
  {
    "id": 1,
    "question": "Your question here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct_answer": "Option 1",
    "hint": "Optional hint",
    "explanation": "Detailed explanation",
    "chapter": "Chapter 2: Digital Logic",
    "difficulty": "easy"
  }
]
```

**File Naming:**

- Single chapter: `1.json`, `2.json`, etc.
- Split chapters: `5_1.json`, `5_2.json` (for Chapter 5 split into two files)

**No import needed!** Questions are loaded directly from JSON files at runtime. Just add your JSON files and they'll be available immediately.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charting library for analytics
- **React Hooks** - Custom hooks for session timer, exam timer
- **LocalStorage** - Client-side data storage for sessions and analytics
- **JSON Files** - Question data stored in JSON files (no database needed)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run fix` - Clean cache and rebuild

## Production Checklist

Before deploying to production, ensure:

- ✅ All JSON files in `public/data/` and `public/data/learn/` are valid
- ✅ Learn mode JSON files follow the correct format (see Adding New Questions section)
- ✅ Test all modes: Learn Mode, Chapter Practice, Quick Test, Full Test
- ✅ Verify analytics page loads correctly
- ✅ Check that dark mode works properly
- ✅ Test keyboard shortcuts in all modes
- ✅ Verify responsive design on mobile devices
- ✅ No debug logging statements in production code

## Key Features Summary

### Learn Mode

- Sequential question display (not randomized)
- Explanations always shown after answering
- Chapter navigation with progress tracking
- Question navigation sidebar
- Perfect for first-time learning

### Practice Mode

- **Chapter Practice**: Randomized questions with hints
- **Quick Test**: 25 questions in 30 minutes
- **Full Test**: 100 questions in 2 hours (exam simulation)

### Analytics

- Separate analytics for Learn and Practice modes
- Mode-specific insights and recommendations
- Focus recommendations with target goals
- Performance trends and chapter comparisons
- Exam readiness analysis

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
