import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import '@picocss/pico/css/pico.min.css'; 

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<Home />} />
        
      </Routes>
    </Router>
  );
}

export default App;