import { useState, useEffect } from 'react';
import { getValidApiUrl } from '../services/urlService';
import { checkAdmin } from '../services/CheckAdmin';

export default function Home() {
  const [status, setStatus] = useState('Fetching...');
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
    // --- Create Anime ---
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStudio, setNewStudio] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const API_URL = await getValidApiUrl();
        const res = await fetch(`${API_URL}/`);
        res.ok ? setStatus('Server Online') : setStatus('Server Offline');
      } catch (error) {
        setStatus('Server Offline');
      }
    };
    checkServerStatus();
  }, []);

  const handleSubmit = async () => {
    try {
      const API_URL = await getValidApiUrl(); 
      const res = await fetch(`${API_URL}/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      
      const data = await res.json();
      setResponse(`${data.status}: ${data.received}`);
    } catch (error) {
      setResponse('Error: Failed to connect to server');
    }
  };
    const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const API_URL = await getValidApiUrl();
      const res = await fetch(`${API_URL}/anime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${checkAdmin()}` },
        body: JSON.stringify({
          name: newName,
          desc: newDesc,
          studio: newStudio,
          series: [],
          imageUrl: newImgUrl,
        })
      });
      const data = await res.json();
      console.log("Anime Created!", data);
      
      setNewName('');
      setNewDesc('');
      setNewStudio('');
      setNewImgUrl('');
    } catch (error) {
      console.error("Creation failed:", error);
    } finally {
      setIsCreating(false);
    }
  };
return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1>Status: {status}</h1>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Send</button>
      <p>Response: {response}</p>

      {/* CREATE NEW ANIME SECTION */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', gap: '2rem' }}>
        
        {/* LEFT COLUMN: Image Preview & URL Input */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '220px', flexShrink: 0, gap: '1rem' }}>
          {newImgUrl ? (
            <img 
              src={newImgUrl} 
              alt="Cover Preview" 
              style={{ width: '100%', height: '310px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #666' }} 
            />
          ) : (
            <div style={{ width: '100%', height: '310px', border: '2px dashed #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', textAlign: 'center', padding: '1rem' }}>
              Image Preview
            </div>
          )}
          <input 
            type="url" 
            placeholder="Cover Image URL" 
            value={newImgUrl} 
            onChange={(e) => setNewImgUrl(e.target.value)} 
            style={{ width: '100%' }}
          />
        </div>

        {/* RIGHT COLUMN: Anime Details Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Add New Anime</h3>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <input 
              type="text" 
              placeholder="Anime Name (e.g., Tsukimichi)" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              required 
            />
            
            <input 
              type="text" 
              placeholder="Studio (e.g., C2C)" 
              value={newStudio} 
              onChange={(e) => setNewStudio(e.target.value)} 
              required 
            />
            
            <textarea 
              placeholder="Description..." 
              value={newDesc} 
              onChange={(e) => setNewDesc(e.target.value)} 
              required 
              style={{ flex: 1, minHeight: '150px', resize: 'vertical' }}
            />
            
            <button type="submit" aria-busy={isCreating} className="secondary" style={{ marginTop: 'auto' }}>
              Save to Database
            </button>
          </form>
        </div>

      </section>
    </div>
  );
}