import { useEffect, useRef, useState } from "react";
import "./LoadingScreen.css";

const STATUS_TEXTS = [
  "INITIALIZING SYSTEMS",
  "CALIBRATING SENSORS",
  "LOADING STAR MAPS",
  "ESTABLISHING ORBIT",
  "CHARGING ENGINES",
  "FUEL PRESSURE OK",
  "NAVIGATION ONLINE",
  "CREW READY",
  "IGNITION SEQUENCE",
  "LIFTOFF",
];

export default function LoadingScreen({ onDone }) {
  const [count, setCount] = useState(10);
  const [status, setStatus] = useState(STATUS_TEXTS[0]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev - 1;
        setStatus(STATUS_TEXTS[10 - next] || "");
        if (next <= 3) {
          setShake(true);
          setTimeout(() => setShake(false), 100);
        }
        if (next <= 0) {
          clearInterval(timer);
          setTimeout(onDone, 800);
        }
        return next;
      });
    }, 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading">
      <div className={`countdown ${shake ? "shake" : ""}`}>{count}</div>
      <div className="status-text">{status}</div>
    </div>
  );
}
