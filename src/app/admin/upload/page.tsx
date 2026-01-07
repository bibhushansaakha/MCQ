'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UploadResults {
  success: boolean;
  message: string;
  results: {
    topicsCreated: number;
    topicsUpdated: number;
    questionsImported: number;
    questionsUpdated: number;
    errors: string[];
  };
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/json' || droppedFile.name.endsWith('.json')) {
        setFile(droppedFile);
        if (!sourceName) {
          setSourceName(droppedFile.name.replace('.json', ''));
        }
      } else {
        setError('Please upload a JSON file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setFile(selectedFile);
        if (!sourceName) {
          setSourceName(selectedFile.name.replace('.json', ''));
        }
        setError(null);
      } else {
        setError('Please upload a JSON file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (sourceName) {
        formData.append('sourceName', sourceName);
      }

      const response = await fetch('/api/admin/upload-questions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to upload questions');
    } finally {
      setUploading(false);
    }
  };

  const formatExample = {
    example: [
      {
        chapter: "Chapter 1: Electrical & Electronics",
        questions: [
          {
            id: 1,
            question: "What is Ohm's law?",
            options: ["V = IR", "I = VR", "R = IV", "V = I/R"],
            correct_answer: "V = IR",
            hint: "Think about the relationship between voltage, current, and resistance.",
            explanation: "Ohm's law states that voltage (V) equals current (I) multiplied by resistance (R).",
            chapter: "chapter-01",
            difficulty: "easy",
            source: "Custom Source"
          }
        ]
      }
    ]
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Questions</h1>
          <p className="text-gray-500 dark:text-gray-500">
            Upload a JSON file to import questions into the database
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-gray-50/30 dark:bg-gray-100/5 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="space-y-4">
            {/* File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-[#ea580c] bg-[#ea580c]/5'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              {file ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setSourceName('');
                    }}
                    className="text-xs text-[#ea580c] hover:underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-[#ea580c]">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    JSON file only
                  </div>
                </div>
              )}
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-block mt-4 px-4 py-2 text-sm bg-[#ea580c] text-white rounded hover:bg-[#c2410c] transition-colors"
              >
                {file ? 'Change File' : 'Select File'}
              </label>
            </div>

            {/* Source Name Input */}
            <div>
              <label htmlFor="sourceName" className="block text-sm font-medium text-foreground mb-2">
                Source Name (optional)
              </label>
              <input
                type="text"
                id="sourceName"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g., Custom Questions, Practice Set 1"
                className="w-full px-4 py-2 rounded border border-gray-200 dark:border-gray-800 bg-background text-foreground placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full px-4 py-2 bg-[#ea580c] text-white rounded hover:bg-[#c2410c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {uploading ? 'Uploading...' : 'Upload Questions'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-sm font-medium text-red-800 dark:text-red-200">Error</div>
            <div className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-4">
              {results.message}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs text-green-600 dark:text-green-400">Topics Created</div>
                <div className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {results.results.topicsCreated}
                </div>
              </div>
              <div>
                <div className="text-xs text-green-600 dark:text-green-400">Topics Updated</div>
                <div className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {results.results.topicsUpdated}
                </div>
              </div>
              <div>
                <div className="text-xs text-green-600 dark:text-green-400">Questions Imported</div>
                <div className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {results.results.questionsImported}
                </div>
              </div>
              <div>
                <div className="text-xs text-green-600 dark:text-green-400">Questions Updated</div>
                <div className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {results.results.questionsUpdated}
                </div>
              </div>
            </div>
            {results.results.errors.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-red-800 dark:text-red-200 mb-2">
                  Errors ({results.results.errors.length}):
                </div>
                <div className="text-xs text-red-600 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto">
                  {results.results.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Format Guide */}
        <div className="bg-gray-50/30 dark:bg-gray-100/5 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">JSON Format Guide</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your JSON file should be an array of chapter objects. Each chapter should contain an array of questions.
          </p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-[#ea580c] hover:underline">
              View Example Format
            </summary>
            <pre className="mt-4 p-4 bg-gray-900 dark:bg-gray-800 rounded text-xs text-gray-300 overflow-x-auto">
              {JSON.stringify(formatExample, null, 2)}
            </pre>
          </details>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">Required fields for each question:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">question</code> - The question text</li>
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">options</code> - Array of answer options</li>
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">correct_answer</code> - The correct answer</li>
            </ul>
            <p className="font-medium mt-4 mb-2">Optional fields:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">id</code> or <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">question_number</code> - Question number</li>
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">hint</code> - Hint text</li>
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">explanation</code> - Explanation text</li>
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">chapter</code> - Chapter tag (e.g., &quot;chapter-01&quot;)</li>
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">difficulty</code> - &quot;easy&quot; or &quot;difficult&quot;</li>
              <li><code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">source</code> - Source name</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

