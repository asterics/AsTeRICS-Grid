import $ from 'jquery';
import {youtubeService} from "./youtubeService";

jest.mock('../externals/objectmodel');
jest.mock('../externals/jquery');
jest.mock('../vue/mainVue.js');

test('youtubeService.getVideoId - Test 0', () => {
    expect(youtubeService.getVideoId(undefined)).toEqual(null);
});

test('youtubeService.getVideoId - Test 1', () => {
    expect(youtubeService.getVideoId('https://www.youtube.com/watch?v=qQdnl0_IaRg')).toEqual('qQdnl0_IaRg');
});

test('youtubeService.getVideoId - Test 2', () => {
    expect(youtubeService.getVideoId('https://www.youtube.com/watch?v=LWXQdw-YvVN')).toEqual('LWXQdw-YvVN');
});

test('youtubeService.getVideoId - Test 3', () => {
    expect(youtubeService.getVideoId('https://www.youtube.com/watch?v=DwrHwZyFN7N&list=REEMNnVvzpdXR7ZDCioZE2fe6w&start_radio=1')).toEqual('DwrHwZyFN7N');
});

test('youtubeService.getVideoId - Test 4', () => {
    expect(youtubeService.getVideoId('https://youtu.be/LWXQdw-YvVN')).toEqual('LWXQdw-YvVN');
});

test('youtubeService.getVideoId - Test 5', () => {
    expect(youtubeService.getVideoId('https://youtu.be/LWXQdw-YvVN?t=235')).toEqual('LWXQdw-YvVN');
});

test('youtubeService.getVideoId - Test 6', () => {
    expect(youtubeService.getVideoId('https://www.youtube.com/watch?v=qQdnl0_IaRg&t=12')).toEqual('qQdnl0_IaRg');
});

test('youtubeService.getVideoId - Test 7', () => {
    expect(youtubeService.getVideoId('qQdnl0_IaRg')).toEqual('qQdnl0_IaRg');
});

test('youtubeService.getPlaylistId - Test 0', () => {
    expect(youtubeService.getPlaylistId('')).toEqual(null);
});

test('youtubeService.getPlaylistId - Test 1', () => {
    expect(youtubeService.getPlaylistId('https://www.youtube.com/watch?v=DwrHwZyFN7N&list=REEMNnVvzpdXR7ZDCioZE2fe6w&start_radio=1')).toEqual('REEMNnVvzpdXR7ZDCioZE2fe6w');
});

test('youtubeService.getPlaylistId - Test 2', () => {
    expect(youtubeService.getPlaylistId('https://www.youtube.com/playlist?list=PLjp0AEEJ0-fHZDWhxhKo0wG08bMUcRy3b')).toEqual('PLjp0AEEJ0-fHZDWhxhKo0wG08bMUcRy3b');
});

test('youtubeService.getPlaylistId - Test 2', () => {
    expect(youtubeService.getPlaylistId('PLjp0AEEJ0-fHZDWhxhKo0wG08bMUcRy3b')).toEqual('PLjp0AEEJ0-fHZDWhxhKo0wG08bMUcRy3b');
});

test('youtubeService.getChannelId - Test 0', () => {
    expect(youtubeService.getChannelId('')).toEqual(null);
});

test('youtubeService.getChannelId - Test 1', () => {
    expect(youtubeService.getChannelId('https://www.youtube.com/channel/UCW6fCo6_MxY0wHkNrUpojTh')).toEqual('UCW6fCo6_MxY0wHkNrUpojTh');
});

test('youtubeService.getChannelId - Test 2', () => {
    expect(youtubeService.getChannelId('https://www.youtube.com/channel/UCW6fCo6_MxY0wHkNrUpojTh/playlists')).toEqual('UCW6fCo6_MxY0wHkNrUpojTh');
});

test('youtubeService.getChannelId - Test 3', () => {
    expect(youtubeService.getChannelId('https://www.youtube.com/channel/UCW6fCo6_MxY0wHkNrUpojTh/')).toEqual('UCW6fCo6_MxY0wHkNrUpojTh');
});

test('youtubeService.getChannelId - Test 4', () => {
    expect(youtubeService.getChannelId('https://www.youtube.com/channel/UCoyN9HzkP5FOKFYa09J7JQQ/about?view_as=subscriber')).toEqual('UCoyN9HzkP5FOKFYa09J7JQQ');
});

test('youtubeService.getChannelPlaylist - Test 1', () => {
    expect(youtubeService.getChannelPlaylist('UCoyN9HzkP5FOKFYa09J7JQQ')).toEqual('UUoyN9HzkP5FOKFYa09J7JQQ');
});

test('youtubeService.getChannelPlaylist - Test 2', () => {
    expect(youtubeService.getChannelPlaylist('UCoyN9HzkP5FOKFYa09J7JUC')).toEqual('UUoyN9HzkP5FOKFYa09J7JUC');
});