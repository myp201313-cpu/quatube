"use client";

import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setResults(data.results ?? []);
  };

  return (
    <div className="relative w-full max-w-xl">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleSearch();
        }}
        placeholder="Search titles, genres, or keywords"
        className="w-full rounded-full border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
      />

      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-white/10 bg-slate-900 p-3 shadow-2xl">
          {results.map((result) => (
            <div key={result.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-800">
              <span className="text-sm text-slate-100">{result.title}</span>
              <span className="text-xs text-slate-400">{result.releaseYear ?? "Movie"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
