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
          series: []
        })
      });
      const data = await res.json();
      console.log("Anime Created!", data);
      
      setNewName('');
      setNewDesc('');
      setNewStudio('');
    } catch (error) {
      console.error("Creation failed:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <h1>Status: {status}</h1>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Send</button>
      <p>Response: {response}</p>

            {/* CREATE NEW ANIME SECTION */}
      <section style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Add New Anime</h3>
        <form onSubmit={handleCreate}>
          <div className="grid">
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
          </div>
          <textarea 
            placeholder="Description..." 
            value={newDesc} 
            onChange={(e) => setNewDesc(e.target.value)} 
            required 
          />
          <button type="submit" aria-busy={isCreating} className="secondary">
            Save to Database
          </button>
        </form>
      </section>
    </div>
  );
}