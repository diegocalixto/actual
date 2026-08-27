import React from 'react';

import { labTokensCss } from './labTokens';

export { LAB_ROOT_CLASS } from './labTokens';

/**
 * Re-exported so consumers outside this folder can reach it: `labTokens` is a
 * `.ts` module and the `#components/*` subpath only resolves `.tsx`, while
 * parent-relative imports are banned by lint. This file is the folder's door.
 */
export { tokensCssFor } from './labTokens';
export { iconForAccount, iconForCategory } from './entityIcons';
export type { EntityIcon } from './entityIcons';

/**
 * Injects the laboratory's tokens. Mounted only while a `/v2-lab/*` route is
 * active, so the rules disappear from the document the moment the user leaves.
 */
export function LabStyle() {
  return <style>{labTokensCss}</style>;
}
