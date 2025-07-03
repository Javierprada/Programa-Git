// src/App.jsx
import './App.css'; // Mantenemos la importación del CSS por ahora
import MovieDetails from './components/MovieDetails';

function App() {
  return (
    <>
      {MovieDetails}
      <MovieDetails/>
    </>
  );
}

export default App;
