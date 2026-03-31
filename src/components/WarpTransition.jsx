import { useEffect, useRef } from "react";
import "./WarpTransition.css";

export default function WarpTransition() {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    const cx = el.offsetWidth / 2;
    const cy = el.offsetHeight / 2;
    for (let i = 0; i < 80; i++) {
      const line = document.createElement("div");
      line.className = "warp-line";
      const angle = (i / 80) * 360;
      const dist = Math.random() * 180;
      const x = cx + Math.cos((angle * Math.PI) / 180) * dist;
      const y = cy + Math.sin((angle * Math.PI) / 180) * dist;
      line.style.cssText = `
        left: ${x}px; top: ${y}px;
        transform: rotate(${angle}deg);
        animation-delay: ${Math.random() * 0.2}s;
        opacity: ${Math.random() * 0.8 + 0.2};
      `;
      el.appendChild(line);
    }
  }, []);

  return <div ref={ref} className="warp" />;
}
