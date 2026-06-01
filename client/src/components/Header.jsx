import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getValidApiUrl } from '../services/urlService';
import AnimeCard from './AnimeCard';

export default function Header() {
  const [isBusy, setIsBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const fetchResults = async (query) => {
    if (!query) return; 
    
    setIsBusy(true);
    try {
      const API_URL = await getValidApiUrl();
      const res = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query })
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResults(searchQuery);
  };

  return (
    <header className="mb-5 pt-5 container">
      
      {/* --- Header --- */}
      <div className="is-flex is-justify-content-space-between is-align-items-center px-5">
        <div>
          <Link 
            to="/"
            className="title is-4 has-text-white mb-0" 
            style={{ 
              textShadow: `
                0 0 10px rgba(255, 255, 255, 0.25), 
                0 0 20px rgba(0, 209, 178, 0.4), 
                0 0 35px rgba(0, 209, 178, 0.2)
              `,
              textDecoration: 'none'
            }}
          >
            PlanetaAnime
          </Link>
        </div>
        <div>
          <form role="search" onSubmit={handleSearch}>
            <input 
              type="search" 
              placeholder="Search Anime..." 
              className="input is-rounded card"
              style={{ height: '35px', transform: 'translateY(9px)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className={`button is-info ${isBusy ? 'is-loading' : ''}`}
              style={{ height: '35px', transform: 'translateY(9px)' }}
              disabled={isBusy}
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* --- Results --- */}
      {searchResults.length > 0 && (
        <section style={{ marginTop: '3rem', padding: '0 1.25rem' }}>
          <h3 className="title is-5 has-text-white" style={{ marginBottom: '1.5rem' }}>
            Search Results
          </h3>
          <div className="results-grid">
            {searchResults.map((animeObj) => (
              <AnimeCard 
                key={animeObj._id} 
                anime={animeObj} 
                onUpdate={() => fetchResults(searchQuery)} 
              />
            ))}
          </div>
        </section>
      )}
      
    </header>
  );
}