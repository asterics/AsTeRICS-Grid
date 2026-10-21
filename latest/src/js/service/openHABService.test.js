import { openHABService } from './openHABService';

jest.mock('../util/util');

test('openHABService.getRestURL - Test 1 - already fixed URL', () => {
    expect(openHABService.getRestURL('http://openhab.local:8080/rest/items/')).toEqual('http://openhab.local:8080/rest/items/');
});

test('openHABService.getRestURL - Test 2 - Basic UI URL with query', () => {
    expect(openHABService.getRestURL('http://openhab.local:8080/basicui/app?w=0102&sitemap=b4')).toEqual('http://openhab.local:8080/rest/items/');
});

test('openHABService.getRestURL - Test 3 - Paper UI URL with hash', () => {
    expect(openHABService.getRestURL('http://openhab.local:8080/paperui/index.html#/control')).toEqual('http://openhab.local:8080/rest/items/');
});
