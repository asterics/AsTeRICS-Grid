import {MapCache} from "./MapCache";

let KEY = 'KEY';
let KEY2 = 'KEY2';
let VALUE = 'VALUE';
let VALUE_ARRAY = [1,2,3];
let VALUE_OBJECT = {a: VALUE, b: VALUE_ARRAY};

test('MapCache - Test 1', () => {
    let cache = new MapCache();
    cache.set(KEY, VALUE);
    expect(cache.has(KEY)).toBeTruthy();
    expect(cache.has('otherkey')).toBeFalsy();
    expect(cache.get(KEY)).toBe(VALUE);
});

test('MapCache - Test 2', () => {
    let cache = new MapCache();
    cache.set(KEY, VALUE);
    cache.set(KEY2, VALUE);
    cache.clear(KEY);
    expect(cache.has(KEY)).toBeFalsy();
    expect(cache.get(KEY)).toBeFalsy();
    expect(cache.has(KEY2)).toBeTruthy();
    expect(cache.get(KEY2)).toBe(VALUE);
});

test('MapCache - Test 3', () => {
    let cache = new MapCache();
    cache.set(KEY, VALUE);
    cache.set(KEY2, VALUE);
    cache.clearAll();
    expect(cache.has(KEY)).toBeFalsy();
    expect(cache.has(KEY2)).toBeFalsy();
    expect(cache.get(KEY)).toBeFalsy();
    expect(cache.get(KEY2)).toBeFalsy();
});

test('MapCache - Test 4', () => {
    let cache = new MapCache();
    function Constructor() {
    }
    cache.set(KEY, VALUE, Constructor);
    expect(cache.has(KEY)).toBeTruthy();
    expect(cache.get(KEY) instanceof Constructor).toBeTruthy();
});

test('MapCache - Test 5', () => {
    let cache = new MapCache();
    function Constructor() {
    }
    cache.set(KEY, VALUE, Constructor);
    cache.clear(KEY);
    cache.set(KEY, VALUE);
    expect(cache.has(KEY)).toBeTruthy();
    expect(cache.get(KEY) instanceof Constructor).toBeFalsy();
    expect(cache.get(KEY)).toBe(VALUE);
});

test('MapCache - Test 6', () => {
    let cache = new MapCache();
    function Constructor() {
    }
    cache.set(KEY, [VALUE, VALUE, VALUE], Constructor);
    expect(cache.has(KEY)).toBeTruthy();
    expect(cache.get(KEY) instanceof Array).toBeTruthy();
    cache.get(KEY).forEach(elem => {
        expect(elem instanceof Constructor).toBeTruthy();
    });
});

test('MapCache - Test 7', () => {
    let cache = new MapCache();
    cache.set(KEY, VALUE_ARRAY);
    expect(cache.has(KEY)).toBeTruthy();
    expect(cache.get(KEY)).toEqual(VALUE_ARRAY);
    expect(cache.get(KEY) === VALUE_ARRAY).toBeFalsy();
});

test('MapCache - Test 8', () => {
    let cache = new MapCache();
    cache.set(KEY, VALUE_OBJECT);
    expect(cache.has(KEY)).toBeTruthy();
    expect(cache.get(KEY)).toEqual(VALUE_OBJECT);
    expect(cache.get(KEY) === VALUE_OBJECT).toBeFalsy();
});

test('MapCache - Test 9', () => {
    let cache = new MapCache();
    function Constructor() {
    }
    cache.set(KEY, VALUE, Constructor);
    cache.set(KEY, VALUE);
    expect(cache.has(KEY)).toBeTruthy();
    expect(cache.get(KEY) instanceof Constructor).toBeFalsy();
    expect(cache.get(KEY)).toBe(VALUE);
});