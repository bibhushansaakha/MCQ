# NEC Exam Preparation - MCQ Practice Website

A fast, simple MCQ practice website for Nepal Engineering Council exam preparation built with Next.js.

## Features

- **Topic Selection**: Choose from different exam sections (SETI Section A, SETI Section B, SETII Section A)
- **Random Questions**: Questions appear in random order with no repeats until all are shown
- **Smart Answer Flow**:
  - Correct answer → Auto-advance to next question
  - Wrong answer → Show explanation, manual next
  - Request hints or explanations anytime
- **Session Tracking**: Real-time score, time tracking, and hint usage
- **Analytics Dashboard**: Comprehensive statistics including:
  - Overall performance metrics
  - Per-chapter breakdown
  - Visual charts and graphs
  - Time spent per question
  - Accuracy tracking

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
MCQ/
├── public/
│   └── data/              # Question JSON files
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── page.tsx     # Home page
│   │   ├── analytics/   # Analytics dashboard
│   │   └── quiz/        # Quiz pages
│   ├── components/      # React components
│   ├── lib/             # Utilities and types
│   └── hooks/           # Custom React hooks
```

## Data Format

Questions are stored in JSON files in `public/data/`. Each file contains:
- Section name
- Array of questions with:
  - Question number
  - Question text
  - Options array
  - Correct answer
  - Hint
  - Explanation

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Chart visualizations
- **localStorage** - Client-side data persistence

## Features in Detail

### Quiz Flow
1. Select a topic from the home page
2. Questions appear randomly
3. Select an answer:
   - Correct → Auto-advance after 1 second
   - Wrong → Show explanation, click "Next Question"
4. Use hints or view explanations anytime
5. All progress is tracked automatically

### Analytics
- View analytics anytime via the "View Analytics" button
- See overall statistics and per-chapter breakdown
- Track accuracy, time spent, and hint usage
- Visual charts for better insights

## License

MIT

