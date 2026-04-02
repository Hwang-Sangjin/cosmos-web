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
    <div className="absolute inset-0 flex flex-col items-center justify-center z-[5] gap-7">
      <div className="text-[11px] tracking-[8px] text-[#333] font-mono uppercase">
        COSMOS — SPACE FILM EXPLORER
      </div>
      <div className="text-3xl font-light text-white tracking-widest font-mono">
        탐험할 세계를 선택하세요
      </div>
      <div className="grid grid-cols-3 gap-3 w-[480px]">
        {FILMS.map((f) => (
          <button
            key={f.id}
            onClick={() => onEnter(f.id)}
            className={`
              bg-transparent px-3 py-4 text-[11px] tracking-widest
              font-mono text-center cursor-pointer transition-all duration-300
              ${
                f.active
                  ? "border border-[#2a7a2a] text-[#4dff4d] shadow-[0_0_20px_rgba(77,255,77,0.1)]"
                  : "border border-[#1a1a1a] text-[#444] hover:border-[#333] hover:text-[#888]"
              }
            `}
          >
            <span
              className={`block text-[9px] tracking-[3px] mb-2 ${f.active ? "text-[#2a7a2a]" : "text-[#222]"}`}
            >
              {f.num}
            </span>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
