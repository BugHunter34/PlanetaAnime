import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getValidApiUrl } from '../services/urlService';
import { VideoPlayer } from '../components/VideoPlayer'; // ✅ Ensure curly braces are used

export default function AnimePage() {
  const { id } = useParams(); 
  
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [subtitleLang, setSubtitleLang] = useState('cs');

  const [apiUrl, setApiUrl] = useState(null);

useEffect(() => {
  const fetchAnimeDetails = async () => {
    try {
      const validUrl = await getValidApiUrl();
      setApiUrl(validUrl); // ✅ Save the resolved URL to state

      const response = await fetch(`${validUrl}/anime/${id}`);
      const data = await response.json();
        
        setAnime(data);
        
        if (data.series && data.series.length > 0) {
          setSelectedSeason(data.series[0].series_number);
        }
      } catch (error) {
        console.error("Failed to fetch anime:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetails();
  }, [id]);

  if (loading) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading Anime Data...</div>;
  if (!anime) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Anime not found!</div>;

  const activeSeasonData = anime.series?.find(s => s.series_number === parseInt(selectedSeason));

  // Helper function to convert CDN URLs to proxy URLs
  const getProxySubtitleUrl = (cdnUrl) => {
    if (!cdnUrl || !apiUrl) return null; 
    return `${apiUrl}/proxy-subtitle?url=${encodeURIComponent(cdnUrl)}`;
  };

  // ✅ Build the subtitle tracks dynamically for the new player
const activeSubtitles = [];
  
  if (selectedEpisode?.sub_cz && subtitleLang === 'cs') {
    activeSubtitles.push({
      src: getProxySubtitleUrl(selectedEpisode.sub_cz),
      lang: 'cs',
      label: 'Čeština',
      default: true 
    });
  } else if (selectedEpisode?.sub_en && subtitleLang === 'en') {
    activeSubtitles.push({
      src: getProxySubtitleUrl(selectedEpisode.sub_en),
      lang: 'en',
      label: 'English',
      default: true 
    });
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem', color: 'white' }}>
      
      {/* Anime Header Layout */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        {anime.imageUrl && (
          <img 
            src={anime.imageUrl} 
            alt={`${anime.name} Cover`} 
            style={{ width: '220px', height: '310px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} 
          />
        )}
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{anime.name}</h1>
          <p style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem' }}>Studio: {anime.studio}</p>
          <p style={{ lineHeight: '1.7', color: '#d1d5db' }}>{anime.desc}</p>
        </div>
      </div>

      {/* Video Player Render Block */}
{selectedEpisode && (
        <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #333' }}>
          
          {/* ✅ New Header with Subtitle Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: 'white' }}>
              Episode {selectedEpisode.number}: {selectedEpisode.title}
            </h2>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>Subtitles:</span>
              <select 
                value={subtitleLang} 
                onChange={(e) => setSubtitleLang(e.target.value)}
                style={{ background: '#252542', color: 'white', border: '1px solid #555', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
              >
                <option value="off">Off</option>
                {selectedEpisode.sub_cz && <option value="cs">Čeština</option>}
                {selectedEpisode.sub_en && <option value="en">English</option>}
              </select>
            </div>
          </div>
          
          {/* ✅ Added the `key` prop to prevent ghost tracks on episode change */}
          <VideoPlayer 
            key={selectedEpisode.link} 
            src={selectedEpisode.link}
            poster={anime.imageUrl} 
            subtitles={activeSubtitles}
          />
          
        </div>
      )}

      {/* Season and Episode Selector */}
      <div style={{ background: '#252542', padding: '2rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Select Season:</h3>
          <select 
            value={selectedSeason || ''} 
            onChange={(e) => {
              setSelectedSeason(e.target.value);
              setSelectedEpisode(null);
            }}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#1a1a2e', color: 'white', border: '1px solid #555', cursor: 'pointer' }}
          >
            {anime.series?.map(s => (
              <option key={s.series_number} value={s.series_number}>
                Season {s.series_number}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Episode Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {activeSeasonData?.episodes?.length > 0 ? (
            activeSeasonData.episodes.map(ep => (
              <button 
                key={ep.number}
                onClick={() => {
                  setSelectedEpisode(ep);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                style={{ 
                  padding: '1rem', 
                  background: selectedEpisode?.number === ep.number ? '#2563eb' : '#3b3b5c', 
                  color: 'white',
                  border: '1px solid',
                  borderColor: selectedEpisode?.number === ep.number ? '#60a5fa' : '#555',
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  Episode {ep.number}
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ep.title}
                </div>
              </button>
            ))
          ) : (
            <p style={{ color: '#888' }}>No episodes uploaded for this season yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}