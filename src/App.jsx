import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Taskbar from "./components/Taskbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import PlayPage from "./pages/PlayPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import RulesPage from "./pages/RulesPage.jsx";
import { ensureLeaderboardSeed } from "./lib/storage.js";

export default function App() {
  useEffect(() => {
    ensureLeaderboardSeed();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col pb-14">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
      <Taskbar />
    </BrowserRouter>
  );
}
