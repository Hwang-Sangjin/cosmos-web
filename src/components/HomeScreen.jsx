import "./HomeScreen.css";

const FILMS = [
  { num: "01", label: "HAIL MARY", id: 1, active: true },
  { num: "02", label: "INTERSTELLAR", id: 2, active: false },
  { num: "03", label: "THE MARTIAN", id: 3, active: false },
  { num: "04", label: "2001 ODYSSEY", id: 4, active: false },
  { num: "05", label: "STAR WARS", id: 5, active: false },
  { num: "06", label: "GUARDIANS", id: 6, active: false },
];

export default function HomeScreen({ onEnter }) {
  return (
    <div className="home">
      <div className="home-eyebrow">COSMOS — SPACE FILM EXPLORER</div>
      <div className="home-title">탐험할 세계를 선택하세요</div>
      <div className="film-grid">
        {FILMS.map((f) => (
          <button
            key={f.id}
            className={`film-btn ${f.active ? "active" : ""}`}
            onClick={() => onEnter(f.id)}
          >
            <span className="num">{f.num}</span>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
