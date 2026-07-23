import { HeroShip } from '../components/HeroShip';
import './TitleScreen.css';

export function TitleScreen({ onEngage }: { onEngage: () => void }) {
  return (
    <div className="title">
      <div className="title__stage">
        <HeroShip animated />
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
