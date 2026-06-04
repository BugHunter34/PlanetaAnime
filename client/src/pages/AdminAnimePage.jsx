import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getValidApiUrl } from '../services/urlService';
import { checkAdmin } from '../services/CheckAdmin';

export default function AdminAnimePage() {
  const { id } = useParams(); // Gets the :id from the URL
  const navigate = useNavigate();
  
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  const [seriesNum, setSeriesNum] = useState(1);
  const [seriesTitle, setSeriesTitle] = useState('');
  
  const [epSeriesTarget, setEpSeriesTarget] = useState(1);
  const [epNum, setEpNum] = useState(1);
  const [epTitle, setEpTitle] = useState('');
  
  const [videoFile, setVideoFile] = useState(null);
  const [subCzFile, setSubCzFile] = useState(null);
  const [subEnFile, setSubEnFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // FETCH DATA ON MOUNT
  const fetchAnimeData = async () => {
    try {
      const API_URL = await getValidApiUrl();
      const res = await fetch(`${API_URL}/anime/${id}`);
      if (res.ok) {
        setAnime(await res.json());
      } else {
        alert("Anime not found.");
        navigate('/admin'); // Kick back to admin home if ID is bad
      }
    } catch (err) {
      console.error("Error fetching anime:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimeData();
  }, [id]);

  // DELETE ANIME
  const handleDelete = async () => {
    if (!window.confirm(`Delete ${anime.name}?`)) return;
    const API_URL = await getValidApiUrl();
    await fetch(`${API_URL}/anime/${anime._id}`, { 
        method: 'DELETE',
        headers:{'Authorization': `Bearer ${checkAdmin()}`}
    });
    navigate('/admin'); // Redirect away after deletion
  };

  // ADD SERIES
  const handleAddSeries = async (e) => {
    e.preventDefault();
    const API_URL = await getValidApiUrl();
    await fetch(`${API_URL}/anime/${anime._id}/series`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${checkAdmin()}` 
      },
      body: JSON.stringify({ series_number: parseInt(seriesNum), episodes: [] })
    });
    fetchAnimeData(); // Refresh UI
  };

  // ADD EPISODE
  const handleAddEpisode = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      alert("Please select an MP4 video file.");
      return;
    }

    setIsUploading(true);
    
    try {
      const API_URL = await getValidApiUrl();
      const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks to stay safely under Cloudflare's 100MB limit
      const totalChunks = Math.ceil(videoFile.size / CHUNK_SIZE);
      const fileId = Date.now().toString(); // Unique ID to keep chunks organized on the server

      // Upload chunks sequentially
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, videoFile.size);
        const chunk = videoFile.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', i);
        formData.append('totalChunks', totalChunks);
        formData.append('fileId', fileId);

        // We only need to send the text details and subtitles on the VERY LAST chunk
        if (i === totalChunks - 1) {
          formData.append('number', epNum);
          formData.append('title', epTitle);
          if (subCzFile) formData.append('sub_cz', subCzFile);
          if (subEnFile) formData.append('sub_en', subEnFile);
        }

        console.log(`Uploading chunk ${i + 1} of ${totalChunks}...`);
        
        const response = await fetch(`${API_URL}/anime/${anime._id}/series/${epSeriesTarget}/episode`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${checkAdmin()}` },
          body: formData
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(`Upload failed on chunk ${i}: ${err.detail}`);
        }
      }

      // If loop finishes successfully
      setEpNum(prev => parseInt(prev) + 1);
      setEpTitle('');
      setVideoFile(null);
      setSubCzFile(null);
      setSubEnFile(null);
      onUpdate(); // or fetchAnimeData() depending on your page structure
      alert("Episode successfully uploaded, encoded, and pushed to B2!");

    } catch (error) {
      console.error("Error uploading episode:", error);
      alert(error.message || "A network error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading Dashboard...</div>;
  if (!anime) return null;

  return (
    <article className="card" style={{ margin: '2rem auto', maxWidth: '800px', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '12px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>{anime.name} <small style={{ opacity: 0.7 }}>({anime.studio})</small></h3>
        <button className="secondary outline" onClick={handleDelete} style={{ borderColor: 'red', color: 'red', padding: '0.5rem 1rem', cursor: 'pointer' }}>Delete Anime</button>
      </header>
      
      <p style={{ marginBottom: '2rem' }}>{anime.desc}</p>

      {/* RENDER SEASONS & EPISODES */}
      <div style={{ marginBottom: '2rem' }}>
        {anime.series?.map((s) => (
          <details key={s.series_number} style={{ marginBottom: '1rem', background: '#1a1a2e', padding: '1rem', borderRadius: '8px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Season {s.series_number}</summary>
            <ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
              {s.episodes?.map(ep => (
                <li key={ep.number} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#252542', borderRadius: '4px' }}>
                  <strong>Ep {ep.number}:</strong> {ep.title} 
                  <br/>
                  <a href={ep.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#4ade80' }}>Stream (m3u8)</a>
                  {ep.sub_cz && <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#60a5fa' }}>• CZ Subs</span>}
                  {ep.sub_en && <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#60a5fa' }}>• EN Subs</span>}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <div className="grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
        {/* ADD SERIES */}
        <form onSubmit={handleAddSeries} style={{ padding: '1.5rem', background: '#6c44c2', borderRadius: '8px', color: 'white' }}>
          <h4 style={{ marginTop: 0 }}>Add Season</h4>
          <input type="number" placeholder="Season Number" value={seriesNum} onChange={e => setSeriesNum(e.target.value)} required style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
          <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer', background: '#4c2b92', color: 'white', border: 'none', borderRadius: '4px' }}>Add Season</button>
        </form>

        {/* ADD EPISODE */}
        <form onSubmit={handleAddEpisode} style={{ padding: '1.5rem', background: '#2563eb', borderRadius: '8px', color: 'white' }}>
          <h4 style={{ marginTop: 0 }}>Add Episode (HLS Upload)</h4>
          
          <select value={epSeriesTarget} onChange={e => setEpSeriesTarget(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '8px' }}>
            {anime.series?.map(s => (
              <option key={s.series_number} value={s.series_number}>Season {s.series_number}</option>
            ))}
          </select>
          
          <input type="number" placeholder="Episode Number" value={epNum} onChange={e => setEpNum(e.target.value)} required style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
          <input type="text" placeholder="Episode Title" value={epTitle} onChange={e => setEpTitle(e.target.value)} required style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.8rem', display: 'block' }}>Video File (MP4)</label>
            <input type="file" accept="video/mp4" onChange={e => setVideoFile(e.target.files[0])} required style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.8rem', display: 'block' }}>Czech Subtitles (.vtt/.srt)</label>
            <input type="file" accept=".vtt,.srt" onChange={e => setSubCzFile(e.target.files[0])} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.8rem', display: 'block' }}>English Subtitles (.vtt/.srt)</label>
            <input type="file" accept=".vtt,.srt" onChange={e => setSubEnFile(e.target.files[0])} style={{ width: '100%' }} />
          </div>

          <button type="submit" disabled={isUploading} style={{ width: '100%', padding: '10px', cursor: 'pointer', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '4px', opacity: isUploading ? 0.7 : 1 }}>
            {isUploading ? 'Encoding & Uploading...' : 'Upload to B2'}
          </button>
        </form>
      </div>
    </article>
  );
}