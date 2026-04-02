import { useEffect, useState } from "react";

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
          setTimeout(() => setShake(false), 200);
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
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          20%       { transform: translate(-6px, 3px); }
          40%       { transform: translate(6px, -3px); }
          60%       { transform: translate(-4px, 2px); }
          80%       { transform: translate(4px, -2px); }
        }
        .shake { animation: shake 0.15s ease-in-out; }
      `}</style>

      <div
        className={`text-white font-bold font-mono tracking-tighter select-none ${shake ? "shake" : ""}`}
        style={{ fontSize: "120px" }}
      >
        {count}
      </div>
      <div className="text-[#555] text-xs tracking-[6px] mt-5 font-mono">
        {status}
      </div>
    </div>
  );
}
