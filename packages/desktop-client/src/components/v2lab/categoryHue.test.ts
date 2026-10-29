import { describe, expect, it } from 'vitest';

import { CATEGORY_HUES, hueForCategory } from './categoryHue';

describe('the colour of a category', () => {
  it('é a mesma a cada chamada, em qualquer tela', () => {
    const ids = ['a1', 'b2', 'c3', '5bf2d1e4-ada0-4d79-88df-f14053e7a1ad'];
    for (const id of ids) {
      expect(hueForCategory(id)).toBe(hueForCategory(id));
    }
  });

  it('nunca é uma cor com significado: só violeta, ciano e rosa', () => {
    for (let index = 0; index < 500; index++) {
      expect(CATEGORY_HUES).toContain(hueForCategory(`categoria-${index}`));
    }
    expect(CATEGORY_HUES).not.toContain('green');
    expect(CATEGORY_HUES).not.toContain('blue');
    expect(CATEGORY_HUES).not.toContain('amber');
  });

  it('"Sem categoria" e nenhuma categoria são cinza', () => {
    expect(hueForCategory('uncategorized')).toBe('neutral');
    expect(hueForCategory(null)).toBe('neutral');
    expect(hueForCategory(undefined)).toBe('neutral');
    expect(hueForCategory('')).toBe('neutral');
  });
});
