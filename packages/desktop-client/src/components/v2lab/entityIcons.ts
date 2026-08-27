import type { ComponentType, SVGProps } from 'react';

import {
  SvgAirplane,
  SvgApparel,
  SvgBeverage,
  SvgBolt,
  SvgChartBar,
  SvgCloud,
  SvgCoffee,
  SvgCreditCard,
  SvgDotsHorizontalTriple,
  SvgEducation,
  SvgGift,
  SvgHeart,
  SvgHome,
  SvgLibrary,
  SvgLocationFood,
  SvgMoneyBag,
  SvgPhone,
  SvgPiggyBank,
  SvgPlay,
  SvgPortfolio,
  SvgRefresh,
  SvgShoppingCart,
  SvgTag,
  SvgTravelBus,
  SvgWallet,
  SvgWrench,
} from '@actual-app/components/icons/v1';

/**
 * A glyph for an account or a category, chosen from its name.
 *
 * Neither `AccountEntity` nor `CategoryEntity` stores an icon, so this is a
 * *presentation* guess and nothing more: it never claims the entity is of a
 * given kind, the way labelling an account "credit card" would. When no keyword
 * matches, the neutral glyph comes back — an unrecognised name gets no
 * invented meaning.
 *
 * Keywords cover Portuguese and English because a budget's categories are
 * named by whoever made it, and the demo file that ships with Actual is in
 * English while this interface is in Portuguese.
 */

export type EntityIcon = ComponentType<SVGProps<SVGSVGElement>>;

type Rule = [RegExp, EntityIcon];

/** Order matters: the first match wins, so put the specific rules first. */
const CATEGORY_RULES: Rule[] = [
  [
    /restaurant|delivery|lanch|almoc|almoç|jantar|dining|takeaway|ifood/i,
    SvgLocationFood,
  ],
  [/mercado|supermerc|grocer|market|food|aliment|feira/i, SvgShoppingCart],
  [/coffee|caf[eé]|padaria|bakery/i, SvgCoffee],
  [/bar\b|bebida|drink|beverage|cerveja/i, SvgBeverage],
  [
    /transport|uber|taxi|[oô]nibus|bus|metr[oô]|combust|fuel|gas\b|gasolina|carro|car\b|ve[ií]culo/i,
    SvgTravelBus,
  ],
  [/viagem|travel|trip|flight|voo|f[eé]rias|hotel/i, SvgAirplane],
  [/assinatura|subscri|streaming|plano|recorr/i, SvgRefresh],
  [
    /entreteni|entertainment|lazer|leisure|cinema|movie|filme|m[uú]sica|music|jogo|game/i,
    SvgPlay,
  ],
  [
    /farm[aá]cia|pharmac|rem[eé]dio|medic|sa[uú]de|health|dentist|hospital|consulta/i,
    SvgHeart,
  ],
  [/vestu[aá]rio|clothing|roupa|apparel|cal[cç]ado|shoe|moda/i, SvgApparel],
  [
    /educa[cç]|education|curso|course|school|escola|faculdade|livro|book|estudo|study/i,
    SvgEducation,
  ],
  [/presente|gift|doa[cç]|donation/i, SvgGift],
  [/celular|cell\b|phone|telefone|internet|telecom/i, SvgPhone],
  [/nuvem|cloud|software|app\b|assinatura digital/i, SvgCloud],
  [/energia|electric|luz\b|power|utilit/i, SvgBolt],
  [/casa|home|moradia|aluguel|rent|housing|mortgage|hipoteca|condom/i, SvgHome],
  [/poupan|saving|reserva|emerg/i, SvgPiggyBank],
  [
    /sal[aá]rio|salary|renda|income|dep[oó]sito|deposit|pagamento|payroll/i,
    SvgMoneyBag,
  ],
  [
    /investi|invest|a[cç][oõ]es|stock|fund|401k|ira\b|cripto|crypto|bitcoin/i,
    SvgChartBar,
  ],
  [/manuten|repair|servi[cç]o|service|conserto|tool|obra/i, SvgWrench],
  [/compras|shopping|loja|store|varejo/i, SvgShoppingCart],
  [/geral|general|outros|other|diversos|misc|extra/i, SvgDotsHorizontalTriple],
];

const ACCOUNT_RULES: Rule[] = [
  [/poupan|saving|reserva/i, SvgPiggyBank],
  [/sal[aá]rio|salary|payroll|paycheck/i, SvgPortfolio],
  [
    /investi|invest|a[cç][oõ]es|stock|broker|fund|401k|ira\b|vanguard|roth/i,
    SvgChartBar,
  ],
  [/carteira|wallet|digital|cripto|crypto|bitcoin|paypal|pix/i, SvgWallet],
  [/cart[aã]o|card|credit/i, SvgCreditCard],
  [/casa|house|home|asset|im[oó]vel|mortgage|hipoteca/i, SvgHome],
  [/dinheiro|cash|esp[eé]cie/i, SvgMoneyBag],
];

function match(rules: Rule[], name: string, fallback: EntityIcon): EntityIcon {
  for (const [pattern, Icon] of rules) {
    if (pattern.test(name)) {
      return Icon;
    }
  }

  return fallback;
}

/** Falls back to a bank-like glyph: every account is at least an account. */
export function iconForAccount(name: string): EntityIcon {
  return match(ACCOUNT_RULES, name, SvgLibrary);
}

/** Falls back to a plain tag, which claims nothing about the category. */
export function iconForCategory(name: string): EntityIcon {
  return match(CATEGORY_RULES, name, SvgTag);
}
