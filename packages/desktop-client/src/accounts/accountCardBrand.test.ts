import { describe, expect, it } from 'vitest';

import { cardBrandForAccount, normalizeAccountName } from './accountCardBrand';

describe('normalizeAccountName', () => {
  it('lowercases, strips accents and collapses separators', () => {
    expect(normalizeAccountName('  ITAÚ   Personnalité-Crédito ')).toBe(
      'itau personnalite credito',
    );
  });
});

describe('cardBrandForAccount', () => {
  it.each([
    'Itaú Personnalité',
    'Itaú Personnalité Crédito',
    'ITAU PERSONNALITE',
    'itau personnalite credito',
    'Personnalité',
    'Cartão Personnalité Black',
    'Itaú Personalité',
    'Itaú-Personnalité',
  ])('recognises %s as Itaú Personnalité', name => {
    expect(cardBrandForAccount(name)).toBe('itau-personnalite');
  });

  it.each([
    'Itaú Conta Corrente',
    'Itau conta corrente',
    'ITAÚ',
    'Conta Itaú',
    'Itaú   Poupança',
  ])('recognises %s as Itaú', name => {
    expect(cardBrandForAccount(name)).toBe('itau');
  });

  it.each([
    'Nubank',
    'NUBANK',
    'Nubank Crédito',
    'Cartão Nubank',
    'Nu',
    'Nu Conta',
    'Cartão Nu',
    'Nu Crédito',
    'NuConta',
    'nu  cartão',
  ])('recognises %s as Nubank', name => {
    expect(cardBrandForAccount(name)).toBe('nubank');
  });

  it.each([
    'Nu Skin',
    'Nuvem',
    'Menu',
    'Conta Corrente',
    'Cartão de Crédito',
    'Poupança',
    'Carteira',
    'Bradesco',
    'Banco Inter',
    '',
    '   ',
  ])('leaves %j to the generic icon', name => {
    expect(cardBrandForAccount(name)).toBeNull();
  });
});
