# NEC Exam Preparation - MCQ Practice Website

A fast, minimal MCQ practice website for Nepal Engineering Council exam preparation. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 📚 **Multiple Topics**: Practice questions from different chapters and sections
- 🎯 **Random Questions**: Get random MCQs from selected topics
- ✅ **Instant Feedback**: Immediate feedback on correct/incorrect answers
- 💡 **Hints & Explanations**: Access hints and detailed explanations for each question
- 📊 **Analytics Dashboard**: Track your performance with comprehensive analytics
  - Overall statistics (accuracy, time spent, hints used)
  - Per-chapter statistics
  - Performance trends over time
  - Time distribution analysis
  - Hints usage trends
  - Chapter comparison charts
  - Daily activity tracking
- 📖 **History**: Review all attempted questions with full details
- 🌓 **Dark Mode**: Toggle between light and dark themes
- ⚡ **Fast & Minimal**: Optimized for speed with minimal animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
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

## Project Structure

```
MCQ/
├── public/
│   └── data/          # JSON files containing questions
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── contexts/      # React contexts (Theme)
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility functions
└── package.json
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charting library for analytics
- **localStorage** - Client-side data persistence

## License

This project is open source and available for personal use.

## Author

**Bibhushan Saakha**
- LinkedIn: [@bibhushansaakha](https://www.linkedin.com/in/bibhushansaakha)
