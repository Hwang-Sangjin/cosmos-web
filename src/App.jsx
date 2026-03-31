import { useState, useEffect } from "react";
import LoadingScreen from "./components/LoadingScreen";
import HomeScreen from "./components/HomeScreen";
import SceneScreen from "./components/SceneScreen";
import WarpTransition from "./components/WarpTransition";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("loading"); // loading | home | warp | scene
  const [activeScene, setActiveScene] = useState(null);

  const handleLoadingDone = () => setScreen("home");

  const handleEnterScene = (num) => {
    if (num !== 1) return;
    setScreen("warp");
    setTimeout(() => {
      setActiveScene(num);
      setScreen("scene");
    }, 700);
  };

  const handleGoHome = () => {
    setScreen("home");
    setActiveScene(null);
  };

  return (
    <div className="app">
      {/* 별빛 배경 — 항상 표시 */}
      <StarField />

      {screen === "loading" && <LoadingScreen onDone={handleLoadingDone} />}
      {screen === "home" && <HomeScreen onEnter={handleEnterScene} />}
      {screen === "warp" && <WarpTransition />}
      {screen === "scene" && activeScene === 1 && (
        <SceneScreen onBack={handleGoHome} />
      )}
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 0.5,
    top: Math.random() * 100,
    left: Math.random() * 100,
    opacity: Math.random() * 0.7 + 0.1,
  }));
  return (
    <div className="star-field">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            width: s.size,
            height: s.size,
            top: `${s.top}%`,
            left: `${s.left}%`,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
