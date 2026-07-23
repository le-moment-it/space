import type { NodeType } from '../../engine/map/types';

/** Minimal cold line-icon for a star-chart node, tinted by the node's state. */
export function NodeGlyph({ type }: { type: NodeType }) {
  return (
    <svg
      className="node__glyph"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph(type)}
    </svg>
  );
}

function glyph(type: NodeType) {
  switch (type) {
    case 'combat':
      return <path d="M9 9L23 23M23 9L9 23" />;
    case 'elite':
      return <path d="M16 4l3.6 8.4L28 16l-8.4 3.6L16 28l-3.6-8.4L4 16l8.4-3.6z" />;
    case 'event':
      return (
        <>
          <path d="M12 12.5a4 4 0 1 1 5.6 3.7c-1.2.7-1.6 1.6-1.6 3" />
          <circle cx="16" cy="24" r="1.3" fill="currentColor" stroke="none" />
        </>
      );
    case 'rest':
      return (
        <>
          <circle cx="16" cy="16" r="10" />
          <path d="M16 11v10M11 16h10" />
        </>
      );
    case 'shop':
      return <path d="M16 5l9.5 5.5v11L16 27l-9.5-5.5v-11z" />;
    case 'treasure':
      return (
        <>
          <path d="M8 13l4-5h8l4 5-8 13z" />
          <path d="M8 13h16" />
        </>
      );
    case 'boss':
      return (
        <>
          <path d="M4 16s5-8 12-8 12 8 12 8-5 8-12 8S4 16 4 16z" />
          <circle cx="16" cy="16" r="3.4" fill="currentColor" stroke="none" />
        </>
      );
    default:
      return <circle cx="16" cy="16" r="8" />;
  }
}
