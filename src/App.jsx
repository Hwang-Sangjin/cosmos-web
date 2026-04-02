import { useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import HomeScreen from "./components/HomeScreen";
import SceneScreen from "./components/SceneScreen";
import WarpTransition from "./components/WarpTransition";

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [activeScene, setActiveScene] = useState(null);

  const handleLoadingDone = () => setScreen("home");
  const handleWarpDone = () => {
    setActiveScene(1);
    setScreen("scene");
  };
  const handleEnterScene = (num) => {
    if (num !== 1) return;
    setScreen("warp");
  };
  const handleGoHome = () => {
    setScreen("home");
    setActiveScene(null);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-mono">
      <StarField />
      {screen === "loading" && <LoadingScreen onDone={handleLoadingDone} />}
      {screen === "home" && <HomeScreen onEnter={handleEnterScene} />}
      {screen === "warp" && <WarpTransition onDone={handleWarpDone} />}
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
    <div className="absolute inset-0 pointer-events-none z-0">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
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
