import { useState } from 'react';
import { getValidApiUrl } from '../services/urlService';
import { checkAdmin } from '../services/CheckAdmin';

export default function AnimeCard({ anime, onUpdate }) {
  const [seriesNum, setSeriesNum] = useState(1);
  const [seriesTitle, setSeriesTitle] = useState('');
  
  const [epSeriesTarget, setEpSeriesTarget] = useState(1);
  const [epNum, setEpNum] = useState(1);
  const [epTitle, setEpTitle] = useState('');
  const [epLink, setEpLink] = useState('');

  // DELETE ANIME
  const handleDelete = async () => {
    if (!window.confirm(`Delete ${anime.name}?`)) return;
    const API_URL = await getValidApiUrl();
    await fetch(`${API_URL}/anime/${anime._id}`, { 
        method: 'DELETE',
        headers:{'Authorization': `Bearer ${checkAdmin()}`}});
    onUpdate(); 
  };

  // ADD SERIES
  const handleAddSeries = async (e) => {
    e.preventDefault();
    const API_URL = await getValidApiUrl();
    await fetch(`${API_URL}/anime/${anime._id}/series`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${checkAdmin()}` },
      body: JSON.stringify({ series_number: parseInt(seriesNum), title: seriesTitle, episodes: [] })
    });
    onUpdate();
  };

  // ADD EPISODE
  const handleAddEpisode = async (e) => {
    e.preventDefault();
    const API_URL = await getValidApiUrl();
    await fetch(`${API_URL}/anime/${anime._id}/series/${epSeriesTarget}/episode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${checkAdmin()}` },
      body: JSON.stringify({ number: parseInt(epNum), title: epTitle, link: epLink })
    });
    onUpdate();
  };

  return (
    <article className="card" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>{anime.name} <small>({anime.studio})</small></h3>
        <button className="secondary outline" onClick={handleDelete} style={{ borderColor: 'red', color: 'red' }}>Delete</button>
      </header>
      
      <p>{anime.desc}</p>

      {/* RENDER */}
      <div style={{ marginBottom: '1rem' }}>
        {anime.series?.map((s) => (
          <details key={s.series_number}>
            <summary>Season {s.series_number}: {s.title}</summary>
            <ul>
              {s.episodes?.map(ep => (
                <li key={ep.number}>
                  Ep {ep.number}: {ep.title} - <a href={ep.link} target="_blank" rel="noreferrer">Watch</a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <div className="grid">
        {/* ADD SERIES */}
        <form onSubmit={handleAddSeries} style={{ padding: '1rem', background: '#6c44c2', borderRadius: '8px' }}>
          <h4>Add Season</h4>
          <input type="number" placeholder="Season Number" value={seriesNum} onChange={e => setSeriesNum(e.target.value)} required />
          <input type="text" placeholder="Season Title" value={seriesTitle} onChange={e => setSeriesTitle(e.target.value)} required />
          <button type="submit" className="secondary">Add Season</button>
        </form>

        {/* ADD EPISODE */}
        <form onSubmit={handleAddEpisode} style={{ padding: '1rem', background: '#6c44c2', borderRadius: '8px' }}>
          <h4>Add Episode</h4>
          <select value={epSeriesTarget} onChange={e => setEpSeriesTarget(e.target.value)}>
            {anime.series?.map(s => (
              <option key={s.series_number} value={s.series_number}>Season {s.series_number}</option>
            ))}
          </select>
          <input type="number" placeholder="Episode Number" value={epNum} onChange={e => setEpNum(e.target.value)} required />
          <input type="text" placeholder="Episode Title" value={epTitle} onChange={e => setEpTitle(e.target.value)} required />
          <input type="url" placeholder="Video Link" value={epLink} onChange={e => setEpLink(e.target.value)} required />
          <button type="submit" className="secondary">Add Episode</button>
        </form>
      </div>
    </article>
  );
}