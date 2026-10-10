import { styled, keyframes } from '@mui/material/styles';

// Pan the texture left by exactly one tile width for a seamless loop, faking a
// sphere rotating around its vertical axis. (background-position on a box — an
// <img> has no background to pan, so the globe needs a styled div.)
const rotate = keyframes`
  from { background-position: 0 0; }
  to   { background-position: -64px 0; }
`;

export const GlobeIcon = styled('div')({
  display: 'inline-block',
  verticalAlign: 'middle',
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundImage: "url('https://cdn.wattry.com/public/favicons/icon-512.png')",
  backgroundSize: '20px 20px',
  backgroundRepeat: 'repeat-x',
  imageRendering: 'pixelated', // favicon.ico is low-res; swap to icon-512.png for a crisp globe
  animation: `${rotate} 5s linear infinite`,
  // inset edge shadows fake the curvature of the sphere (scaled for the 32px globe
  // so they only shade the rim — larger blur/offset darkens the whole face)
  boxShadow: 'inset 5px 0 6px -4px rgba(0,0,0,0.55), inset -5px 0 6px -4px rgba(0,0,0,0.55)',
  position: 'relative',
  '&::after': {
    // top-left specular highlight
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 32% 32%, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%)',
    pointerEvents: 'none',
  },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});