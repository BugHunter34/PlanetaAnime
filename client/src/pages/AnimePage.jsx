import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getValidApiUrl } from '../services/urlService';

export default function AnimePage() {
  const { id } = useParams(); 
  
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      try {
        const API_URL = await getValidApiUrl();
        const response = await fetch(`${API_URL}/anime/${id}`);
        const data = await response.json();
        setAnime(data);
      } catch (error) {
        console.error("Failed to fetch anime:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetails();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!anime) return <div>Anime not found!</div>;

  return (
    <div className="container mt-5 has-text-white">
      <h1 className="title has-text-white">{anime.name}</h1>
      <p><strong>Studio:</strong> {anime.studio}</p>
      <p className="mt-3">{anime.desc}</p>
    </div>
  );
}