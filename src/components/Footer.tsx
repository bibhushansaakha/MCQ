'use client';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 mt-16 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
          Made by{' '}
          <a
            href="https://www.linkedin.com/in/bibhushansaakha"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-gray-600 dark:hover:text-gray-400 underline"
          >
            Bibhushan Saakha
          </a>
        </p>
      </div>
    </footer>
  );
}

