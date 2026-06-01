import { useState, useEffect } from 'react';

export default function Home() {
  const [status, setStatus] = useState('Fetching...');
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const API_URL = 'http://localhost:6000';

  useEffect(() => {
    fetch('${API_URL}/')
      .then(res => res.ok ? setStatus('Server Online') : setStatus('Server Offline'))
      .catch(() => setStatus('Server Offline'));
  }, []);

  const handleSubmit = async () => {
    const res = await fetch('${API_URL}/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input })
    });
    const data = await res.json();
    setResponse(`${data.status}: ${data.received}`);
  };

  return (
    <div>
      <h1>Status: {status}</h1>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Send</button>
      <p>Response: {response}</p>
    </div>
  );
}