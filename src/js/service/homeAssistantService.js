/*
  homeAssistantService.js
  Clean single implementation for Home Assistant interactions.
  Provides:
    - fetchEntities(baseUrl, token)
    - sendAction(action)
    - getRestURL(userUri) helper
*/

let homeAssistantService = {};

homeAssistantService.fetchEntities = async function (baseUrl, token) {
    const base = (baseUrl || 'http://192.168.0.230:8123').replace(/\/api.*$/, '').replace(/^https:/, 'http:');
    const url = `${base}/api/states`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    console.log('Fetching Home Assistant ->', url, 'token=', !!token);
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Failed to fetch entities from Home Assistant: ${res.status}`);
    return res.json();
};

homeAssistantService.sendAction = async function (action) {
    try {
        const base = (action.homeAssistantUrl || 'http://192.168.0.230:8123').replace(/\/api.*$/, '').replace(/^https:/, 'http:');
         const domain = (action.itemName || '').split('.')[0] || (action.domain || '');
         const service = action.service || mapActionToService(action.actionType);
         const url = `${base}/api/services/${domain}/${service}`;
         const body = Object.assign({ entity_id: action.itemName }, action.serviceData || {});
         const headers = { 'Content-Type': 'application/json' };
         if (action.token) headers['Authorization'] = 'Bearer ' + action.token;
         console.log('DEBUG sendAction - Action:', action);
         console.log('DEBUG sendAction - URL:', url, 'Body:', JSON.stringify(body), 'Headers:', headers);

         const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
         console.log('DEBUG sendAction - Response status:', res.status, 'Text:', await res.text());
         if (!res.ok) throw new Error(`Home Assistant service call failed: ${res.status}`);
         return res.json().catch(() => ({}));
    } catch (e) {
        console.error('homeAssistantService.sendAction error', e);
        throw e;
    }
};

homeAssistantService.getRestURL = function (userUri) {
    if (!userUri) {
        userUri = window.location.hostname.indexOf('grid.asterics.eu') > -1
            ? 'http://192.168.0.230:8123/api/states'
            : 'http://192.168.0.230:8123/api/states';
    }

    if (userUri.indexOf('http') === -1) {
        userUri = 'http://' + userUri;
    }

    return userUri;
};

function mapActionToService(actionType) {
    if (!actionType) return 'toggle';
    const t = actionType.toString().toUpperCase();
    if (t === 'ON' || t === 'TURN_ON') return 'turn_on';
    if (t === 'OFF' || t === 'TURN_OFF') return 'turn_off';
    if (t === 'TOGGLE') return 'toggle';
    if (t === 'BRIGHTNESS') return 'turn_on';
    if (t === 'OPEN') return 'open_cover';
    if (t === 'CLOSE') return 'close_cover';
    if (t === 'STOP') return 'stop_cover';
    if (t === 'SET_TEMPERATURE') return 'set_temperature';
    if (t === 'BRIGHTNESS_STEP') return 'turn_on';
    if (t === 'SET_POSITION') return 'set_cover_position';
    if (t === 'COLOR') return 'turn_on';
    if (t === 'VOLUME_UP') return 'volume_up';
    if (t === 'VOLUME_DOWN') return 'volume_down';
    if (t === 'VOLUME_MUTE') return 'volume_mute';
    if (t === 'VOLUME_UNMUTE') return 'volume_mute';
    if (t === 'PLAY') return 'media_play'
    if (t === 'PAUSE') return 'media_pause'
    if (t === 'NEXT') return 'media_next_track'
    if (t === 'PREVIOUS') return 'media_previous_track'
    return t.toLowerCase();
}

export { homeAssistantService };