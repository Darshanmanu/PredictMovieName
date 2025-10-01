import { useState } from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Sun, Moon, Search, Clipboard, Loader2 } from 'lucide-react';

/**
 * Main application component.
 *
 * This component renders a text area for the user to enter a movie plot, submits it to
 * the backend API, and displays the returned movie name, release date, rationale and
 * confidence.  A radial gauge visualizes the confidence score.  The page also includes
 * a dark/light theme toggle and basic request history.
 */
function App() {
  const [plot, setPlot] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  /**
   * Toggle between dark and light themes by adding or removing the `dark` class on
   * the document element.  This leverages Tailwind's `darkMode: 'class'` configuration.
   */
  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  /**
   * Handle submission of the plot to the backend API.  If the request succeeds the
   * returned result is stored and the history updated.  On failure a heuristic
   * fallback is returned so that the UI remains functional during development.
   */
  async function handleSubmit() {
    if (!plot.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ User_query: plot.trim() }),
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      setResult(data);
      setHistory([{ plot: plot.trim(), ...data }, ...history]);
    } catch (err) {
      console.error(err);
      setError('Unable to reach backend. Showing heuristic fallback.');
      // Provide a deterministic fallback so the UI remains usable without a server.
      setResult({
        movie_name: 'Unknown',
        release_date: 'N/A',
        rationale: 'The backend is unavailable, so no rationale could be generated.',
        confidence: 0.0,
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Copy the raw JSON result to the clipboard for easy sharing.
   */
  function copyJSON() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }

  // Prepare data for the radial gauge.  Two slices: one for the confidence value and
  // one for the remainder to complete the circle.  Multiply by 100 for percentage.
  const gaugeData = result
    ? [
        { name: 'Confidence', value: result.confidence * 100 },
        { name: 'Remaining', value: 100 - result.confidence * 100 },
      ]
    : [];

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen px-4 py-8 overflow-hidden">
      {/* Animated aurora background */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <div className="absolute -inset-0.5 bg-gradient-to-br from-aurora1 via-aurora2 to-aurora3 opacity-20 blur-3xl" />
      </motion.div>

      {/* Page header */}
      <header className="w-full max-w-4xl mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">🎬 PredictMovieName</h1>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Input card */}
      <div className="w-full max-w-4xl bg-white/70 dark:bg-gray-900/60 backdrop-blur-md shadow-glass rounded-2xl p-6 mb-6">
        <textarea
          className="w-full h-32 p-3 text-sm rounded-md border border-transparent bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          placeholder="Describe the plot of a movie..."
          value={plot}
          onChange={(e) => setPlot(e.target.value)}
        />
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !plot.trim()}
            className="inline-flex items-center px-4 py-2 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Search className="mr-2" size={16} />} 
            {loading ? 'Searching...' : 'Identify Movie'}
          </button>
          {result && (
            <button
              onClick={copyJSON}
              className="flex items-center text-sm text-purple-600 hover:underline"
            >
              <Clipboard className="mr-1" size={16} /> Copy JSON
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {/* Result card */}
      {result && (
        <div className="w-full max-w-4xl bg-white/70 dark:bg-gray-900/60 backdrop-blur-md shadow-glass rounded-2xl p-6 mb-6 flex flex-col md:flex-row gap-6">
          {/* Confidence gauge */}
          <div className="flex-shrink-0 mx-auto">
            <RadialBarChart
              width={200}
              height={200}
              cx={100}
              cy={100}
              innerRadius={60}
              outerRadius={100}
              barSize={20}
              data={gaugeData}
              startAngle={90}
              endAngle={450}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                minAngle={15}
                background
                clockWise
                dataKey="value"
                cornerRadius={10}
                fill="#8b5cf6"
              />
            </RadialBarChart>
            <p className="text-center mt-2 text-sm">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          </div>
          {/* Text details */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">{result.movie_name}</h2>
            <p className="text-sm italic mb-4">Released: {result.release_date}</p>
            <p className="leading-relaxed text-sm whitespace-pre-line">{result.rationale}</p>
          </div>
        </div>
      )}

      {/* History list */}
      {history.length > 1 && (
        <div className="w-full max-w-4xl bg-white/70 dark:bg-gray-900/60 backdrop-blur-md shadow-glass rounded-2xl p-4 mb-6">
          <h3 className="font-medium mb-3">History</h3>
          <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
            {history.slice(1).map((item, idx) => (
              <li key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                <div className="font-semibold">{item.movie_name} <span className="text-xs text-gray-500">({item.release_date})</span></div>
                <div className="line-clamp-2 text-gray-600 dark:text-gray-400">{item.plot}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;