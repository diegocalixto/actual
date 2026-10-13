import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export type V2Layout = 'desktop' | 'mobile';
export type V2PageName = 'home' | 'budget' | 'accounts' | 'reports';

type Destination = {
  /** What the address starts with once the page is up. */
  route: string;
  desktop: { link: string; title: string };
  mobile: { tab: string; title: string } | { more: string; title: RegExp };
};

/**
 * The four destinations, as each layout names them. The rail uses the
 * navigation model's labels; the phone's bar has its own, and keeps Reports
 * behind "Mais".
 */
const DESTINATIONS: Record<V2PageName, Destination> = {
  home: {
    route: '/home',
    desktop: { link: 'Overview', title: 'Overview' },
    mobile: { tab: 'Início', title: 'Início' },
  },
  budget: {
    route: '/budget',
    desktop: { link: 'Budget', title: 'Orçamento' },
    mobile: { tab: 'Orçamento', title: 'Orçamento' },
  },
  accounts: {
    route: '/accounts',
    desktop: { link: 'Accounts', title: 'Accounts' },
    mobile: { tab: 'Contas', title: 'Contas' },
  },
  reports: {
    route: '/reports',
    desktop: { link: 'Reports', title: 'Reports' },
    mobile: { more: 'Reports', title: /^Reports/ },
  },
};

export const V2_PAGES: V2PageName[] = ['home', 'budget', 'accounts', 'reports'];

/** The window each layout is first used in. */
export const V2_VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  // A phone, with a finger: privacy mode reveals by touch there, and a mouse
  // would exercise the desktop's path instead.
  mobile: {
    viewport: { width: 428, height: 926 },
    hasTouch: true,
    isMobile: true,
  },
};

/**
 * The second window each layout is used in. Nothing about a page may depend on
 * the first being the only one: a figure that fits a 428pt phone has to fit a
 * 390pt one.
 */
export const V2_NARROWER = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

/** What the page prints as money, and how much of it a person can read. */
export type Figures = {
  /** Amounts painted in a face a person can read. */
  readable: string[];
  /** Amounts in the document that privacy mode is keeping from the eye. */
  hidden: number;
  /** Amounts spelled out in a label a screen reader would speak. */
  labelled: string[];
};

/**
 * The frame the four V2 pages share: the navigation, the page's landmark and
 * title, and privacy mode. One model for both layouts, so a test says what it
 * expects of a page and not how each layout happens to reach it.
 */
export class V2Shell {
  readonly page: Page;
  readonly layout: V2Layout;
  readonly navigation: Locator;
  readonly currentDestination: Locator;
  readonly main: Locator;
  readonly title: Locator;

  constructor(page: Page, layout: V2Layout) {
    this.page = page;
    this.layout = layout;
    this.navigation = page.getByRole('navigation', { name: 'Main' });
    this.currentDestination = this.navigation.locator('[aria-current="page"]');
    this.main = page.getByRole('main');
    this.title = page.getByRole('heading', { level: 1 });
  }

  /** The label a destination carries in this layout's navigation. */
  labelOf(name: V2PageName) {
    const destination = DESTINATIONS[name][this.layout];
    return 'more' in destination
      ? destination.more
      : 'tab' in destination
        ? destination.tab
        : destination.link;
  }

  titleOf(name: V2PageName) {
    return DESTINATIONS[name][this.layout].title;
  }

  routeOf(name: V2PageName) {
    return DESTINATIONS[name].route;
  }

  /** Goes to a page the way a person does, and waits until it is that page. */
  async goTo(name: V2PageName) {
    const destination = DESTINATIONS[name][this.layout];

    if ('more' in destination) {
      await this.navigation.getByRole('button', { name: 'Mais' }).click();
      await this.page
        .getByRole('menu')
        .getByRole('button', { name: destination.more, exact: true })
        .click();
    } else {
      await this.navigation
        .getByRole('link', {
          name: 'tab' in destination ? destination.tab : destination.link,
          exact: true,
        })
        .click();
    }

    await this.waitForPage(name);
  }

  async waitForPage(name: V2PageName) {
    // The phone's Reports arrives as a separate chunk that then queries the
    // file, so its first paint is the slowest wait in the suite.
    await expect(this.title).toHaveText(this.titleOf(name), {
      timeout: 45_000,
    });
    await expect(this.main).toBeVisible();
    // A card that is still computing says so. The slowest — six months of
    // balances on the phone's Home — lands seconds after everything else.
    await expect(this.main.getByText(/^(Carregando|Loading)\b/)).toHaveCount(
      0,
      { timeout: 30_000 },
    );
  }

  // ---- Privacy mode ---------------------------------------------------------

  /**
   * The desktop's eye renames itself with the state; the phone's keeps one
   * name and reports the state as pressed.
   */
  async setPrivacy(isOn: boolean) {
    if (this.layout === 'mobile') {
      const toggle = this.page.getByRole('button', {
        name: 'Ocultar valores',
      });
      if ((await toggle.getAttribute('aria-pressed')) !== String(isOn)) {
        await toggle.tap();
      }
      await expect(toggle).toHaveAttribute('aria-pressed', String(isOn));
      return;
    }

    const turnOn = this.page.getByRole('button', {
      name: 'Enable privacy mode',
    });
    const turnOff = this.page.getByRole('button', {
      name: 'Disable privacy mode',
    });
    const pending = isOn ? turnOn : turnOff;
    if (await pending.isVisible()) {
      await pending.click();
    }
    await expect(isOn ? turnOff : turnOn).toBeVisible();
    // Off the eye and off every figure: resting on one would show it.
    await this.page.mouse.move(0, 0);
  }

  /**
   * Every amount under the page's landmark, sorted by whether a person can
   * read it.
   *
   * It asks the question privacy mode exists to answer — is this number on
   * screen in a readable face? — rather than looking for the filter's own
   * markup, so an amount printed outside the filter is counted as readable no
   * matter how it got there.
   */
  async figures(): Promise<Figures> {
    return await this.main.first().evaluate(root => {
      // pt-BR on the V2 pages, the file's own number format on the dashboard.
      const MONEY =
        /(?:\d{1,3}(?:[.,]\d{3})*[.,]\d{2}(?!\d)(?!\s?%)(?!\s?pp))|(?:R\$\s?-?\d)/;
      const isShown = (el: Element) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      };
      const isReadable = (el: Element) => {
        for (let node: Element | null = el; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (
            Number(style.opacity) === 0 ||
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.fontFamily.includes('Redacted')
          ) {
            return false;
          }
        }
        return true;
      };

      const readable: string[] = [];
      const labelled: string[] = [];
      let hidden = 0;

      for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
        if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') continue;

        for (const name of ['aria-label', 'aria-description', 'title']) {
          const label = el.getAttribute(name);
          if (label && MONEY.test(label)) labelled.push(label);
        }

        if (el instanceof HTMLInputElement) {
          if (!MONEY.test(el.value) || !isShown(el)) continue;
          if (isReadable(el)) readable.push(el.value);
          else hidden++;
          continue;
        }

        // The innermost element holding the amount as its own text, so a
        // phrase such as "79% usado · Orçado R$ 180,00" counts once.
        const ownText = Array.from(el.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => (node.textContent ?? '').trim())
          .join(' ');
        if (!MONEY.test(ownText) || !isShown(el)) continue;

        if (isReadable(el)) readable.push(ownText);
        else hidden++;
      }

      return { readable, hidden, labelled };
    });
  }

  /**
   * The page's amounts once they have stopped arriving.
   *
   * A page is up before its numbers are: each card resolves its own query, and
   * the last ones land after the first are already on screen. Two readings in
   * a row that agree are what "loaded" means here.
   */
  async settledFigures(): Promise<Figures> {
    let previous = await this.figures();

    await expect
      .poll(
        async () => {
          const current = await this.figures();
          const isSettled =
            current.readable.length + current.hidden > 0 &&
            JSON.stringify(current) === JSON.stringify(previous);
          previous = current;
          return isSettled;
        },
        { intervals: [400] },
      )
      .toBe(true);

    return previous;
  }

  // ---- Layout ---------------------------------------------------------------

  /**
   * The amounts that are not wholly inside the boxes they are printed in.
   *
   * An amount that runs out of its tile, or is cut by the edge of its control,
   * is a wrong amount on screen however right the cell behind it is. This
   * reads where the ink of every figure falls and holds it against each box
   * around it, up to the page's landmark — so it notices a figure that
   * overflows whatever the reason, and says nothing of how a page keeps one
   * in. What a box lets the reader scroll to is not out of it, and neither
   * are the few points by which a line set on whole pixels differs from one
   * that is not: every figure has more padding around it than that.
   */
  async figuresOutOfBounds(): Promise<string[]> {
    return await this.main.first().evaluate(root => {
      const MONEY =
        /(?:\d{1,3}(?:[.,]\d{3})*[.,]\d{2}(?!\d)(?!\s?%)(?!\s?pp))|(?:R\$\s?-?\d)/;
      const TOLERANCE = 3;
      const out: string[] = [];

      for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
        if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') continue;

        // A field cuts what does not fit, and scrolls it out of sight.
        if (el instanceof HTMLInputElement) {
          const hidden = el.scrollWidth - el.clientWidth;
          if (MONEY.test(el.value) && hidden > TOLERANCE) {
            out.push(`${el.value} (${Math.round(hidden)}px cut by its field)`);
          }
          continue;
        }

        let left = Infinity;
        let right = -Infinity;
        let text = '';
        for (const node of Array.from(el.childNodes)) {
          const own = (node.textContent ?? '').trim();
          if (node.nodeType !== Node.TEXT_NODE || !own) continue;
          text += (text ? ' ' : '') + own;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const box of Array.from(range.getClientRects())) {
            if (box.width === 0) continue;
            left = Math.min(left, box.left);
            right = Math.max(right, box.right);
          }
        }
        if (!MONEY.test(text) || left === Infinity) continue;

        for (
          let around: Element | null = el;
          around && root.contains(around);
          around = around.parentElement
        ) {
          const style = getComputedStyle(around);
          if (style.display === 'inline' || style.display === 'contents') {
            continue;
          }
          const box = around.getBoundingClientRect();
          const past = Math.max(right - box.right, box.left - left);
          if (past <= TOLERANCE) continue;
          if (!/(auto|scroll)/.test(style.overflowX)) {
            out.push(`${text} (${Math.round(past)}px out)`);
          }
          break;
        }
      }

      return out;
    });
  }

  /**
   * How well the phone's top bar can be read: the WCAG contrast of the page's
   * title, and of each control named, against the ground the bar paints.
   *
   * It measures what is on screen — the ink a glyph is actually drawn in and
   * the first opaque surface behind it — so it holds whatever theme the
   * application is in and however the bar came by its colours.
   */
  async topBarContrast(controls: string[]): Promise<Record<string, number>> {
    return await this.page.evaluate(names => {
      const parse = (color: string) =>
        (color.match(/[\d.]+/g) ?? []).map(Number);
      const luminance = ([red, green, blue]: number[]) => {
        const linear = (value: number) => {
          const channel = value / 255;
          return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        };
        return (
          0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
        );
      };
      const contrast = (ink: number[], ground: number[]) => {
        const [lighter, darker] = [luminance(ink), luminance(ground)].sort(
          (a, b) => b - a,
        );
        return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
      };
      const groundBehind = (el: Element) => {
        for (let node: Element | null = el; node; node = node.parentElement) {
          const [red, green, blue, alpha = 1] = parse(
            getComputedStyle(node).backgroundColor,
          );
          if (alpha > 0.9) return [red, green, blue];
        }
        return [255, 255, 255];
      };
      /** What a control is drawn with: its icon, or else its lettering. */
      const glyphOf = (control: Element) => {
        let glyph = control.querySelector('svg') ?? control;
        while (glyph.tagName !== 'svg' && glyph.firstElementChild) {
          glyph = glyph.firstElementChild;
        }
        return glyph;
      };

      const title = document.querySelector('h1');
      if (!title) {
        throw new Error('The page has no title.');
      }
      const ground = groundBehind(title);

      const measured: Record<string, number> = {
        title: contrast(parse(getComputedStyle(title).color), ground),
      };
      for (const name of names) {
        const control = Array.from(document.querySelectorAll('button')).find(
          button => button.getAttribute('aria-label') === name,
        );
        if (!control) {
          throw new Error(`No control named "${name}" in the top bar.`);
        }
        measured[name] = contrast(
          parse(getComputedStyle(glyphOf(control)).color),
          ground,
        );
      }
      return measured;
    }, controls);
  }

  /**
   * Where a hidden amount sits on screen. Only one that stands alone: inside
   * a row or a button the second tap acts, which is another test's subject.
   */
  async hiddenFigurePosition() {
    const position = await this.main.first().evaluate(root => {
      const overlay = Array.from(root.querySelectorAll<HTMLElement>('*')).find(
        el => {
          const twin = el.children[1];
          if (el.children.length !== 2 || !twin) return false;
          const box = el.getBoundingClientRect();
          return (
            twin.getAttribute('aria-hidden') === 'true' &&
            getComputedStyle(twin).fontFamily.includes('Redacted') &&
            el.closest('button, a, [role="button"], [role="link"]') === null &&
            box.top > 70 &&
            box.bottom < window.innerHeight - 90
          );
        },
      );
      const box = overlay?.getBoundingClientRect();
      return box
        ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
        : null;
    });

    if (!position) {
      throw new Error('No hidden amount standing alone on screen.');
    }
    return position;
  }
}
