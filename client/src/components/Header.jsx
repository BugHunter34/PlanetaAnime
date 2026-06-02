import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getValidApiUrl } from '../services/urlService';

export default function Header() {
  const [isBusy, setIsBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        fetchResults(searchQuery);
        setShowDropdown(true);
      } else {
        setSearchResults([]); 
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer); 
  }, [searchQuery]);

  const fetchResults = async (query) => {
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
    setShowDropdown(false);
  };

return (
    <header className="mb-5 pt-5 container">
      <div className="is-flex is-justify-content-space-between is-align-items-center px-5">
        
        {/* Logo */}
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
        
        {/* Search Form Container */}
        <div style={{ width: '100%', maxWidth: '450px' }}>
          
          {/* Removed gap, form is a standard flex container */}
          <form role="search" onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
            
            {/* WRAPPER: Takes up exactly 75% of the space */}
            <div style={{ position: 'relative', width: '75%' }}>
              <input 
                type="search" 
                placeholder="Search Anime..." 
                className="input is-rounded card"
                style={{ 
                  height: '35px', 
                  transform: 'translateY(9px)', 
                  width: '100%',
                  borderTopRightRadius: '0',    // Flattens the right side to connect to button
                  borderBottomRightRadius: '0', 
                  borderRight: 'none'           // Prevents double-thick border in the middle
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Real-time Autocomplete Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '50px', // Dropped down slightly below the input
                    left: 0,
                    width: '100%', // Matches the 75% input width perfectly
                    backgroundColor: '#1f1f1f', 
                    borderRadius: '6px',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
                    zIndex: 99,
                    maxHeight: '350px',
                    overflowY: 'auto',
                    border: '1px solid #333'
                  }}
                >
                  {searchResults.slice(0, 5).map((animeObj) => (
                    <Link
                      key={animeObj._id}
                      to={`/anime/${animeObj._id}`} 
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchQuery('');
                      }} 
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '10px',
                        borderBottom: '1px solid #2d2d2d',
                        textDecoration: 'none',
                        color: '#fff',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c2c2c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <img 
                        src={animeObj.imageUrl || 'https://via.placeholder.com/45x60?text=No+Img'} 
                        alt={animeObj.name} 
                        style={{ 
                          width: '45px', 
                          height: '60px', 
                          objectFit: 'cover', 
                          borderRadius: '4px', 
                          marginRight: '12px',
                          flexShrink: 0
                        }} 
                      />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {animeObj.name}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#b5b5b5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {animeObj.desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* BUTTON: Takes the remaining 25% */}
            <button 
              type="submit" 
              className={`button is-info ${isBusy ? 'is-loading' : ''}`}
              style={{ 
                height: '35px', 
                transform: 'translateY(9px)', 
                width: '25%',
                borderTopLeftRadius: '0', 
                borderBottomLeftRadius: '0',
                borderTopRightRadius: '9999px',    
                borderBottomRightRadius: '9999px'
              }}
              disabled={isBusy}
            >
              Search
            </button>

          </form>
        </div>
      </div>
    </header>
  );
}