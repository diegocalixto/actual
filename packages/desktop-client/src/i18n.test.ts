import i18n from 'i18next';
import type { BackendModule } from 'i18next';

import { availableLanguages, setI18NextLanguage } from './i18n';

vi.mock('i18next', () => {
  const i18nMock = {
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockResolvedValue(undefined),
    changeLanguage: vi.fn(),
    on: vi.fn(),
  };
  return {
    default: i18nMock,
  };
});

vi.mock('./languages', () => ({
  languages: {
    '/locale/en.json': vi.fn(),
    '/locale/uk.json': vi.fn(),
    '/locale/pt-BR.json': vi.fn().mockResolvedValue({
      default: { Budget: 'Orçamento (catálogo)', Close: 'Fechar' },
    }),
  },
}));

// `pt-BR` has a catalog and overrides; `gl` is a language only the fork
// translates, which is what a checkout without the downloaded catalog makes of
// every language the fork has overrides for.
vi.mock('./locale-overrides', () => ({
  localeOverrides: {
    'pt-BR': { Budget: 'Orçamento' },
    gl: { Budget: 'Orzamento' },
  },
}));

vi.hoisted(vi.resetModules);

function isBackend(module: unknown): module is BackendModule {
  return typeof module === 'object' && module !== null && 'read' in module;
}

// The loader is handed to i18next when the module initialises, before any
// test clears the mock's record of it.
const backend = vi
  .mocked(i18n.use)
  .mock.calls.map(([module]) => module)
  .find(isBackend);

function loadResources(language: string) {
  return new Promise<unknown>((resolve, reject) => {
    if (!backend) {
      reject(new Error('The resources backend was never registered'));
      return;
    }
    backend.read(language, 'translation', (error, resources) => {
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      } else {
        resolve(resources);
      }
    });
  });
}

describe('setI18NextLanguage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(vi.unstubAllGlobals);

  // The fork starts a device with no language chosen in its own language
  // (`forkConfig.defaultLanguage`), whatever the browser prefers.
  test("should set the fork's default language when no language is provided", async () => {
    vi.stubGlobal('navigator', { language: 'uk' });

    await setI18NextLanguage('');

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith('pt-BR');
  });

  test('should keep English when English is chosen', async () => {
    vi.stubGlobal('navigator', { language: 'pt-BR' });

    await setI18NextLanguage('en');

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith('en');
  });

  test('should set the provided language if it is available', async () => {
    const language = availableLanguages[0];

    await setI18NextLanguage(language);

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith(language);
  });

  test('should fallback to English if the provided language is unavailable', async () => {
    vi.spyOn(console, 'info');

    await setI18NextLanguage('unknown');

    expect(console.info).toHaveBeenCalledWith(
      'Unknown locale unknown, falling back to en',
    );
    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith('en');
  });

  test('should successfully use a language with a region code if it is known', async () => {
    const language = 'pt-BR';

    await setI18NextLanguage(language);

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith(language);
  });

  test('should fallback to base language if the provided language has an unknown region code', async () => {
    vi.spyOn(console, 'info');

    await setI18NextLanguage('uk-ZZ');

    expect(console.info).toHaveBeenCalledWith(
      'Unknown locale uk-ZZ, falling back to uk-zz',
    );
    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith('uk');
  });

  test('should fallback to lowercase language if the provided language has uppercase letters', async () => {
    vi.spyOn(console, 'info');

    await setI18NextLanguage('EN');

    expect(console.info).toHaveBeenCalledWith(
      'Unknown locale EN, falling back to en',
    );
    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith('en');
  });

  test('should use a language the fork translates even without a catalog', async () => {
    await setI18NextLanguage('gl');

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledWith('gl');
  });
});

describe('overlapping language changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function deferredChanges() {
    // The app starts in English (`lng: 'en'`) before anything is chosen.
    Object.assign(i18n, { language: 'en' });
    // A real `t` for the mocked change to resolve with.
    const { default: actual } = await vi.importActual<{ default: typeof i18n }>(
      'i18next',
    );
    const t = actual.createInstance().t;
    const resolvers: Array<() => void> = [];
    vi.mocked(i18n).changeLanguage.mockImplementation(
      () =>
        new Promise(resolve => {
          resolvers.push(() => resolve(t));
        }),
    );
    return () => resolvers.forEach(resolve => resolve());
  }

  test('a saved choice made while the default is loading is still applied', async () => {
    const finishAll = await deferredChanges();

    const startUp = setI18NextLanguage('');
    const saved = setI18NextLanguage('en');

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenNthCalledWith(1, 'pt-BR');
    expect(vi.mocked(i18n).changeLanguage).toHaveBeenNthCalledWith(2, 'en');
    finishAll();
    await Promise.all([startUp, saved]);
  });

  test('asking again for the language being loaded waits for the same load', async () => {
    const finishAll = await deferredChanges();

    const first = setI18NextLanguage('gl');
    const second = setI18NextLanguage('gl');

    expect(vi.mocked(i18n).changeLanguage).toHaveBeenCalledTimes(1);
    let secondDone = false;
    void second.then(() => {
      secondDone = true;
    });
    await Promise.resolve();
    expect(secondDone).toBe(false);
    finishAll();
    await Promise.all([first, second]);
    expect(secondDone).toBe(true);
  });
});

describe('availableLanguages', () => {
  test('should offer the languages of the catalog and of the overrides once each', async () => {
    expect(availableLanguages).toEqual(['en', 'uk', 'pt-BR', 'gl']);
  });
});

describe('language resources', () => {
  test('should lay the overrides over the catalog', async () => {
    await expect(loadResources('pt-BR')).resolves.toEqual({
      Budget: 'Orçamento',
      Close: 'Fechar',
    });
  });

  test('should load the overrides alone when there is no catalog', async () => {
    await expect(loadResources('gl')).resolves.toEqual({
      Budget: 'Orzamento',
    });
  });

  test('should refuse a language with neither', async () => {
    await expect(loadResources('xx')).rejects.toThrow('Unknown locale xx');
  });
});
