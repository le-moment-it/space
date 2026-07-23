import './TitleScreen.css';

export function TitleScreen({ onEngage }: { onEngage: () => void }) {
  return (
    <div className="title">
      <div className="title__stage">
        <HeroShip />
      </div>

      <p className="title__eyebrow">Working title · a deck-building descent</p>
      <h1 className="title__name">Space Roguelike</h1>
      <p className="title__tagline">
        Your ship is a deck. The Reach is listening.
        <br />
        Don&rsquo;t answer.
      </p>

      <button className="btn-primary title__engage" onClick={onEngage}>
        Engage
      </button>

      <p className="title__hint">Pre-alpha build · unfinished</p>
    </div>
  );
}

/** A lonely salvage long-hauler, side profile, running dark toward the Reach. */
function HeroShip() {
  return (
    <svg
      className="title__ship"
      viewBox="0 0 440 240"
      role="img"
      aria-label="A salvage vessel adrift among the stars"
    >
      <defs>
        <linearGradient id="thrust" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--signal-hi)" />
          <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="title__ship-body">
        {/* engine thrust */}
        <g className="title__thrust">
          <ellipse cx="30" cy="120" rx="52" ry="9" fill="url(#thrust)" />
          <ellipse cx="30" cy="144" rx="44" ry="7" fill="url(#thrust)" />
        </g>

        {/* engine housing */}
        <rect
          x="54"
          y="98"
          width="40"
          height="64"
          rx="8"
          fill="var(--hull-2)"
          stroke="var(--line-2)"
        />
        <circle cx="66" cy="120" r="6" fill="url(#glow)" />
        <circle cx="66" cy="120" r="3.5" fill="var(--signal-hi)" />
        <circle cx="66" cy="144" r="5" fill="url(#glow)" />
        <circle cx="66" cy="144" r="3" fill="var(--signal-hi)" />

        {/* hull */}
        <path
          d="M372 130C360 111 330 99 300 97L150 95C120 95 98 99 86 107L86 155C98 163 120 167 150 167L300 165C330 163 360 149 372 130Z"
          fill="var(--hull)"
          stroke="var(--line-2)"
          strokeWidth="1.5"
        />
        {/* panel lines */}
        <path d="M110 131H336" stroke="var(--line)" strokeWidth="1" />
        <path d="M170 108V152M240 106V154" stroke="var(--line)" strokeWidth="1" opacity="0.7" />

        {/* dorsal sensor mast + dish */}
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

        {/* cockpit module + lit viewports */}
        <path
          d="M296 80L346 80L338 97L300 97Z"
          fill="var(--hull-2)"
          stroke="var(--line-2)"
          strokeWidth="1.2"
        />
        <path d="M308 84L322 84L319 93L306 93Z" fill="var(--signal)" opacity="0.9" />
        <rect x="326" y="84" width="9" height="8" rx="1" fill="var(--signal)" opacity="0.7" />

        {/* prow running light */}
        <circle cx="356" cy="126" r="2.6" fill="var(--threat)" />
        <circle cx="356" cy="126" r="5" fill="var(--threat)" opacity="0.25" />
      </g>
    </svg>
  );
}
