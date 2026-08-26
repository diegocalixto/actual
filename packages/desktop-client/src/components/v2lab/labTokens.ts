/**
 * Visual tokens for the V2 laboratory.
 *
 * Everything lives under a single `.df-v2lab` class that is applied to the app
 * root only while a `/v2-lab/*` route is active. Nothing here touches the
 * global theme, so leaving the laboratory restores the application's current
 * appearance exactly — this round has to stay reversible while earlier,
 * uncommitted work is still awaiting review.
 *
 * The language is "dark metal + cold blue light + premium grey": a very dark,
 * smooth ground; surfaces that read as machined metal rather than as coloured
 * panels; one controlled cold-blue light; violet reserved for navigation.
 */
export const LAB_ROOT_CLASS = 'df-v2lab';

export const labTokensCss = `
.${LAB_ROOT_CLASS} {
  /* Ground: deep, smooth, faintly cold. No texture, no pattern. */
  --dfl-canvas: #070a10;

  /* The hero's own metal: a very shallow navy-to-charcoal ramp. */
  --dfl-hero-from: #0a1120;
  --dfl-hero-to: #0b1626;

  /* Secondary surfaces sit close to the ground; separation comes from the
     hairline and the space around them, never from a brighter fill. */
  --dfl-surface: #0c1118;
  --dfl-surface-raised: #101823;
  --dfl-inset: rgba(150, 180, 215, 0.06);

  /* Hairlines are blue-grey, not white: white edges read as plastic. */
  --dfl-line: rgba(140, 172, 210, 0.10);
  --dfl-line-strong: rgba(140, 172, 210, 0.19);
  --dfl-hero-line: rgba(122, 168, 224, 0.24);

  --dfl-text: #e9eef6;
  --dfl-text-2: #98a4b7;
  --dfl-text-3: #67717f;

  /* The cold light. Used for the hero's reflection and almost nowhere else. */
  --dfl-blue: #5aa6ff;
  --dfl-blue-deep: #1d5fd0;

  /* Money keeps its own meaning and never borrows the accent. */
  --dfl-positive: #4fd18b;
  --dfl-negative: #f87a6d;

  /* Violet stays where it already is: the selected navigation item. */
  --dfl-violet: #7c4dff;

  /* Accent hues for the icon tiles.
     Each row's tile is built from one of these: a very dark tint of the hue for
     the surface, a slightly stronger one for the hairline, and the hue itself —
     luminous — for the glyph. Kept a step below full saturation so six of them
     side by side still read as one interface rather than as a colour swatch. */
  --dfl-hue-green: #3ad07f;
  --dfl-hue-teal: #2fd0ad;
  --dfl-hue-cyan: #3fd0dc;
  --dfl-hue-blue: #4d9bf5;
  --dfl-hue-violet: #9b7bff;
  --dfl-hue-rose: #f2648c;
  --dfl-hue-crimson: #f0616b;
  --dfl-hue-amber: #f0a63c;

  --dfl-radius: 18px;
  --dfl-radius-sm: 12px;
  --dfl-radius-tile: 8px;

  --dfl-shadow: 0 24px 48px -30px rgba(0, 0, 0, 0.95),
    0 2px 6px -3px rgba(0, 0, 0, 0.7);
  --dfl-shadow-hero: 0 40px 80px -44px rgba(0, 0, 0, 1),
    0 2px 8px -4px rgba(0, 0, 0, 0.8);
}
`;
