import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Hentai from './pages/Hentai';

function App() {
  return (
    <Router>
      <header>
        <Link to="/">Home</Link>
      </header>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hentai" element={<Hentai />} />
        
      </Routes>
    </Router>
  );
}

export default App;