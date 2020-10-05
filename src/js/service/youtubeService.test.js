import {youtubeService} from "./youtubeService";

jest.mock('../externals/objectmodel');

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