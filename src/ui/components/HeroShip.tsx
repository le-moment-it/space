import './HeroShip.css';

/** The player's salvage long-hauler — a lonely side-profile vessel. */
export function HeroShip({ animated = false }: { animated?: boolean }) {
  return (
    <svg
      className={`heroship${animated ? ' heroship--animated' : ''}`}
      viewBox="0 0 440 240"
      role="img"
      aria-label="A salvage vessel adrift among the stars"
    >
      <defs>
        <linearGradient id="heroship-thrust" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="heroship-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--signal-hi)" />
          <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="heroship__body">
        <g className="heroship__thrust">
          <ellipse cx="30" cy="120" rx="52" ry="9" fill="url(#heroship-thrust)" />
          <ellipse cx="30" cy="144" rx="44" ry="7" fill="url(#heroship-thrust)" />
        </g>

        <rect
          x="54"
          y="98"
          width="40"
          height="64"
          rx="8"
          fill="var(--hull-2)"
          stroke="var(--line-2)"
        />
        <circle cx="66" cy="120" r="6" fill="url(#heroship-glow)" />
        <circle cx="66" cy="120" r="3.5" fill="var(--signal-hi)" />
        <circle cx="66" cy="144" r="5" fill="url(#heroship-glow)" />
        <circle cx="66" cy="144" r="3" fill="var(--signal-hi)" />

        <path
          d="M372 130C360 111 330 99 300 97L150 95C120 95 98 99 86 107L86 155C98 163 120 167 150 167L300 165C330 163 360 149 372 130Z"
          fill="var(--hull)"
          stroke="var(--line-2)"
          strokeWidth="1.5"
        />
        <path d="M110 131H336" stroke="var(--line)" strokeWidth="1" />
        <path d="M170 108V152M240 106V154" stroke="var(--line)" strokeWidth="1" opacity="0.7" />

        <path d="M214 96V74" stroke="var(--line-2)" strokeWidth="1.5" />
        <ellipse
          cx="214"
          cy="70"
          rx="15"
          ry="5"
          fill="var(--hull-2)"
          stroke="var(--line-2)"
          transform="rotate(-18 214 70)"
        />

        <path
          d="M296 80L346 80L338 97L300 97Z"
          fill="var(--hull-2)"
          stroke="var(--line-2)"
          strokeWidth="1.2"
        />
        <path d="M308 84L322 84L319 93L306 93Z" fill="var(--signal)" opacity="0.9" />
        <rect x="326" y="84" width="9" height="8" rx="1" fill="var(--signal)" opacity="0.7" />

        <circle cx="356" cy="126" r="2.6" fill="var(--threat)" />
        <circle cx="356" cy="126" r="5" fill="var(--threat)" opacity="0.25" />
      </g>
    </svg>
  );
}
