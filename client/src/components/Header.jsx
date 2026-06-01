import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  const [isBusy, setIsBusy] = useState(false);
  
  const handleSearch = (e) => {
    e.preventDefault();
    setIsBusy(true);

  };

return (
  <header className="header-container">
      <div className="header-content">
      <div>
          <h2 class="logo">PlanetaAnime</h2>
          </div>
          <div class="slim-search">
          <form role="search" onSubmit={handleSearch}>
            <input type="search" placeholder="Search" />
              <button type="submit" aria-busy={isBusy}>
                Search
              </button>
          </form>
          </div>
        </div>
      </header>
);
}