import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileLayout from './components/MobileLayout';
import Dashboard from './pages/Dashboard';
import LearningPath from './pages/LearningPath';
import CourseDetails from './pages/CourseDetails';
import VideoPlayer from './pages/VideoPlayer';
import Search from './pages/Search';
import PathsDirectory from './pages/PathsDirectory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="search" element={<Search />} />
          <Route path="paths" element={<PathsDirectory />} />
          <Route path="path/:id" element={<LearningPath />} />
          <Route path="course/:id" element={<CourseDetails />} />
        </Route>
        {/* Full screen routes like Video Player */}
        <Route path="/video" element={<VideoPlayer />} />
      </Routes>
    </Router>
  );
}

export default App;
