export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">About Kati Sajilo</h1>

        <div className="space-y-12">
          {/* Introduction */}
          <section>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Kati Sajilo is a casual side project built to help prepare for the Nepal Engineering Council (NEC) exam. 
              This is an open-source project that anyone can use and contribute to.
            </p>
            <div className="mt-4">
              <a
                href="https://github.com/bibhushansaakha/MCQ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#ea580c] hover:text-[#c2410c] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </section>

          {/* How to Use */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">How to Use</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Chapter Practice</h3>
                <p className="leading-relaxed">
                  Select a chapter from the Chapter Practice mode to practice questions from that specific chapter. 
                  You can use hints and view explanations for each question. Correct answers automatically advance 
                  to the next question, while incorrect answers show an explanation.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Quick Test</h3>
                <p className="leading-relaxed">
                  Take a 25-question test in 30 minutes with questions randomly selected from all chapters. 
                  This mode simulates a quick exam scenario without hints or explanations during the test.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Full Test</h3>
                <p className="leading-relaxed">
                  Complete a full 100-question exam in 2 hours, simulating the actual NEC exam format. 
                  Questions are distributed evenly across all chapters.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Keyboard Shortcuts</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">1-4</kbd> - Select answer options</li>
                  <li><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">H</kbd> - Toggle hint (Chapter Practice only)</li>
                  <li><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">E</kbd> - Toggle explanation (Chapter Practice only)</li>
                  <li><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">N</kbd> - Next question</li>
                  <li><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">← →</kbd> - Navigate questions (Exam mode)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Tracking Progress</h3>
                <p className="leading-relaxed">
                  View your performance in the Performance dashboard, which shows statistics per chapter and overall. 
                  Review all your attempts in the Attempts section to revisit questions and learn from mistakes.
                </p>
              </div>
            </div>
          </section>

          {/* Terms of Use */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Terms of Use</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                <strong className="text-foreground">Open Source:</strong> This project is open source and available under the MIT License. 
                You are free to use, modify, and distribute this software for personal or commercial purposes.
              </p>
              <p>
                <strong className="text-foreground">No Warranty:</strong> This software is provided &quot;as is&quot; without warranty of any kind. 
                The authors and contributors are not responsible for any errors, omissions, or outcomes resulting from the use of this application.
              </p>
              <p>
                <strong className="text-foreground">Data Privacy:</strong> All data is stored locally in your browser. No personal information 
                is collected or transmitted to external servers. Your practice sessions and analytics are stored only on your device.
              </p>
              <p>
                <strong className="text-foreground">Educational Purpose:</strong> This tool is designed for educational purposes to help 
                prepare for the Nepal Engineering Council exam. It is not affiliated with or endorsed by the Nepal Engineering Council.
              </p>
              <p>
                <strong className="text-foreground">Contributions:</strong> Contributions, suggestions, and feedback are welcome! 
                Please visit the GitHub repository to contribute or report issues.
              </p>
            </div>
          </section>

          {/* Author */}
          <section className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Author</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Made by{' '}
              <a
                href="https://www.linkedin.com/in/bibhushansaakha"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ea580c] hover:text-[#c2410c] underline transition-colors"
              >
                Bibhushan Saakha
              </a>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              This is a casual side project made for personal use. Feel free to use it, modify it, or contribute to make it better!
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

