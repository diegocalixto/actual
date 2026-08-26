import React from 'react';

import { labTokensCss } from './labTokens';

export { LAB_ROOT_CLASS } from './labTokens';

/**
 * Injects the laboratory's tokens. Mounted only while a `/v2-lab/*` route is
 * active, so the rules disappear from the document the moment the user leaves.
 */
export function LabStyle() {
  return <style>{labTokensCss}</style>;
}
