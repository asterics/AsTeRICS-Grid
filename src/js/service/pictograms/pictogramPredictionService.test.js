import { jest } from '@jest/globals';

// Mock i18nService to avoid pulling a deep chain of dependencies
jest.mock('../i18nService.js', () => ({
  i18nService: {
    getContentLangBase: () => 'en',
    getBrowserLang: () => 'en',
  },
}));

// Mock dataService used by pictogramPredictionService
jest.mock('../data/dataService.js', () => ({
  dataService: {
    getGrids: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Mock external providers so we can verify call counts without doing network
jest.mock('./globalSymbolsService.js', () => ({
  globalSymbolsService: { query: jest.fn() },
}));
jest.mock('./arasaacService.js', () => ({
  arasaacService: { query: jest.fn() },
}));
jest.mock('./openSymbolsService.js', () => ({
  openSymbolsService: { query: jest.fn() },
}));

const { dataService } = require('../data/dataService.js');
const { globalSymbolsService } = require('./globalSymbolsService.js');
const { arasaacService } = require('./arasaacService.js');
const { openSymbolsService } = require('./openSymbolsService.js');

function loadServiceFresh() {
  // Load module in isolation so its internal caches/index are fresh per test
  let mod;
  jest.isolateModules(() => {
    mod = require('./pictogramPredictionService.js');
  });
  return mod.pictogramPredictionService;
}

beforeEach(() => {
  jest.clearAllMocks();
});


test('prefers user-defined symbol over provider for matching word', async () => {
  dataService.getCurrentUser.mockResolvedValue('user-a');
  dataService.getGrids.mockResolvedValue([
    {
      id: 'grid1',
      gridElements: [
        {
          id: 'e1',
          label: { en: 'Cucumber' },
          image: { url: 'user://cucumber' },
          actions: [],
        },
      ],
    },
  ]);

  const svc = loadServiceFresh();

  // Provider mocks should not be called when user symbol exists
  globalSymbolsService.query.mockResolvedValue([{ url: 'provider://cucumber' }]);
  arasaacService.query.mockResolvedValue([{ url: 'provider://cucumber' }]);
  openSymbolsService.query.mockResolvedValue([{ url: 'provider://cucumber' }]);

  const res = await svc.getPictoForWord('cucumber', 'en', 'GLOBALSYMBOLS');
  expect(res).toBeTruthy();
  expect(res.url).toBe('user://cucumber');
  expect(res.searchProviderName).toBe('USER');

  expect(globalSymbolsService.query).not.toHaveBeenCalled();
  expect(arasaacService.query).not.toHaveBeenCalled();
  expect(openSymbolsService.query).not.toHaveBeenCalled();
});


test('falls back to provider if no user-defined symbol found', async () => {
  dataService.getCurrentUser.mockResolvedValue('user-a');
  // Grid contains different label, so should not match "cucumber"
  dataService.getGrids.mockResolvedValue([
    { id: 'grid1', gridElements: [{ id: 'e1', label: { en: 'Tomato' }, image: { url: 'user://tomato' }, actions: [] }] },
  ]);

  // Return provider result and ensure it is used
  globalSymbolsService.query.mockResolvedValue([{ url: 'provider://cucumber' }]);

  const svc = loadServiceFresh();
  const res = await svc.getPictoForWord('cucumber', 'en', 'GLOBALSYMBOLS');

  expect(res).toBeTruthy();
  expect(res.url).toBe('provider://cucumber');
  expect(res.searchProviderName).not.toBe('USER');
  expect(globalSymbolsService.query).toHaveBeenCalledTimes(1);
  expect(arasaacService.query).not.toHaveBeenCalled();
  expect(openSymbolsService.query).not.toHaveBeenCalled();
});

