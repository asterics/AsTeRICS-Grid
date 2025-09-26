import $ from '../externals/jquery.js';
import { constants } from '../util/constants';
import { localStorageService } from './data/localStorageService';
import { collectElementService } from './collectElementService';
import { loginService } from './loginService';
import { i18nService } from './i18nService';
import { Router } from '../router';
import { MainVue } from '../vue/mainVue';

const SETTINGS_KEY = 'AG_COLLECT_TRANSFER_SETTINGS';
const DEFAULT_SETTINGS = {
    relayUrl: '',
    roomId: '',
    token: '',
    userId: '',
    autoSend: false,
    autoReceive: true,
    autoReconnect: true,
};

const INTEGRATIONS_TAB = 'TAB_INTEGRATIONS';
const SETTINGS_NUDGE_INTERVAL_MS = 15000;
const SETTINGS_TOAST_TIMEOUT_MS = 10000;
const SHARE_PREFIX = 'AGCTRANSFER:';
const SHARE_VERSION = 1;


let collectTransferService = {};
let settings = loadSettings();
let socket = null;
let joinedRoom = false;
let reconnectRequested = false;
let reconnectTimer = null;
let status = buildStatus('disconnected');
let pendingMessages = [];
let suppressAutoSend = false;
let initialized = false;
let lastSettingsNudge = 0;

function normalizeRelayUrl(url) {
    if (!url) {
        return '';
    }
    let trimmed = url.trim();
    if (!/^wss?:/i.test(trimmed) && /^https?:/i.test(trimmed)) {
        trimmed = trimmed.replace(/^http/i, 'ws');
    }
    return trimmed;
}

function normalizeSettingsInput(partial = {}) {
    if (!partial || typeof partial !== 'object') {
        return {};
    }
    const normalized = { ...partial };
    if (Object.prototype.hasOwnProperty.call(normalized, 'relayUrl')) {
        normalized.relayUrl = normalizeRelayUrl(normalized.relayUrl || '');
    }
    ['roomId', 'token', 'userId'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(normalized, key) && typeof normalized[key] === 'string') {
            normalized[key] = normalized[key].trim();
        }
    });
    return normalized;
}

function hasRequiredConfig(config = settings) {
    if (!config) {
        return false;
    }
    const relayUrl = normalizeRelayUrl(config.relayUrl || '');
    const roomId = (config.roomId || '').trim();
    const token = (config.token || '').trim();
    return Boolean(relayUrl && roomId && token);
}

function encodeSharePayload(payload) {
    try {
        const json = JSON.stringify(payload);
        const encoded = window.btoa(unescape(encodeURIComponent(json)));
        return `${SHARE_PREFIX}${encoded}`;
    } catch (err) {
        console.warn('[collectTransfer] failed to encode share payload', err);
        return null;
    }
}

function decodeShareString(shareString) {
    if (!shareString || typeof shareString !== 'string') {
        return null;
    }
    const normalized = shareString.trim();
    if (!normalized.startsWith(SHARE_PREFIX)) {
        return null;
    }
    const encoded = normalized.substring(SHARE_PREFIX.length);
    try {
        const json = decodeURIComponent(escape(window.atob(encoded)));
        const parsed = JSON.parse(json);
        if (!parsed || typeof parsed !== 'object' || parsed.version !== SHARE_VERSION) {
            return null;
        }
        return parsed;
    } catch (err) {
        console.warn('[collectTransfer] failed to decode share payload', err);
        return null;
    }
}
function buildShareDescriptor() {
    if (!hasRequiredConfig()) {
        return null;
    }
    const shareSettings = {
        relayUrl: normalizeRelayUrl(settings.relayUrl || ''),
        roomId: (settings.roomId || '').trim(),
        token: (settings.token || '').trim(),
        userId: (settings.userId || '').trim(),
        autoSend: !!settings.autoSend,
        autoReconnect: settings.autoReconnect !== false,
    };
    return {
        version: SHARE_VERSION,
        generatedAt: Date.now(),
        settings: shareSettings,
    };
}

function applyShareDescriptor(descriptor) {
    if (!descriptor || typeof descriptor !== 'object' || descriptor.version !== SHARE_VERSION) {
        throw new Error('invalid_share_descriptor');
    }
    const incoming = descriptor.settings || {};
    if (!incoming.relayUrl || !incoming.roomId || !incoming.token) {
        throw new Error('invalid_share_settings');
    }
    const normalized = normalizeSettingsInput({
        relayUrl: incoming.relayUrl,
        roomId: incoming.roomId,
        token: incoming.token,
        userId: incoming.userId || '',
    });
    const nextSettings = {
        ...settings,
        ...normalized,
        autoSend: incoming.autoSend === true,
        autoReconnect: incoming.autoReconnect !== false,
    };
    saveSettings(nextSettings);
    if (nextSettings.autoReconnect && hasRequiredConfig(nextSettings)) {
        connect();
    } else {
        reconnectRequested = false;
        notifyStatus('disconnected');
    }
}

function loadSettings() {
    try {
        const stored = localStorageService.getJSON(SETTINGS_KEY);
        if (stored && typeof stored === 'object') {
            return { ...DEFAULT_SETTINGS, ...stored };
        }
    } catch (err) {
        log.warn('[collectTransfer] failed to parse stored settings', err);
    }
    return { ...DEFAULT_SETTINGS };
}

function saveSettings(partial) {
    const normalized = normalizeSettingsInput(partial);
    settings = { ...settings, ...normalized };
    try {
        localStorageService.saveJSON(SETTINGS_KEY, settings);
    } catch (err) {
        log.warn('[collectTransfer] failed to persist settings', err);
    }
    renderControls();
}

function buildStatus(state, details = {}) {
    return {
        state,
        details,
        timestamp: Date.now(),
    };
}

function getStatus() {
    return { ...status, details: { ...status.details } };
}

function notifyStatus(state, details = {}) {
    status = buildStatus(state, details);
    $(document).trigger(constants.EVENT_COLLECT_TRANSFER_STATUS, [getStatus()]);
    renderControls();
}

function clearReconnectTimer() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function scheduleReconnect() {
    clearReconnectTimer();
    if (!reconnectRequested || settings.autoReconnect === false) {
        return;
    }
    reconnectTimer = setTimeout(() => {
        connect();
    }, 5000);
}

function closeSocket(manual = false) {
    clearReconnectTimer();
    if (socket) {
        try {
            socket.close();
        } catch (err) {
            log.warn('[collectTransfer] error closing socket', err);
        }
    }
    socket = null;
    joinedRoom = false;
    notifyStatus('disconnected', manual ? {} : { reason: 'closed' });
}

function createMessageId() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return `msg-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function queueMessage(message) {
    pendingMessages.push(message);
    flushQueue();
}

function flushQueue() {
    if (!socket || !joinedRoom || socket.readyState !== WebSocket.OPEN) {
        return;
    }
    while (pendingMessages.length) {
        const msg = pendingMessages.shift();
        try {
            socket.send(JSON.stringify(msg));
        } catch (err) {
            log.error('[collectTransfer] failed to send message', err);
            pendingMessages.unshift(msg);
            break;
        }
    }
}

function connect(options = {}) {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        log.info('[collectTransfer] ignoring connect request while socket is active');
        return;
    }

    const merged = { ...settings, ...options };
    const normalized = normalizeSettingsInput({
        relayUrl: merged.relayUrl,
        roomId: merged.roomId,
        token: merged.token,
        userId: merged.userId,
    });
    const relayUrl = normalized.relayUrl;
    const roomId = normalized.roomId;
    const token = normalized.token;

    if (!relayUrl || !roomId || !token) {
        showMissingConfigGuidance();
        notifyStatus('error', { reason: 'missing_configuration' });
        return;
    }

    const wasRequested = reconnectRequested;
    reconnectRequested = false;
    clearReconnectTimer();
    if (socket) {
        closeSocket(true);
    }
    reconnectRequested = true;
    notifyStatus('connecting', { relayUrl, roomId });

    try {
        socket = new WebSocket(relayUrl);
    } catch (err) {
        log.error('[collectTransfer] failed to open websocket', err);
        notifyStatus('error', { reason: 'invalid_url', message: err.message });
        scheduleReconnect();
        return;
    }

    socket.addEventListener('open', () => {
        const userId = normalized.userId || loginService.getLoggedInUsername() || '';
        const joinMessage = {
            type: 'join',
            payload: {
                roomId,
                token,
                userId,
            },
        };
        try {
            socket.send(JSON.stringify(joinMessage));
        } catch (err) {
            log.error('[collectTransfer] failed to send join payload', err);
            notifyStatus('error', { reason: 'join_send_failed', message: err.message });
        }
    });

    socket.addEventListener('message', (event) => {
        let data = null;
        try {
            data = JSON.parse(event.data);
        } catch (err) {
            log.warn('[collectTransfer] received malformed message', err);
            return;
        }
        handleMessage(data);
    });

    socket.addEventListener('close', (evt) => {
        const manual = !reconnectRequested;
        notifyStatus('disconnected', { code: evt.code, reason: evt.reason });
        socket = null;
        joinedRoom = false;
        if (!manual) {
            scheduleReconnect();
        }
    });

    socket.addEventListener('error', (err) => {
        log.error('[collectTransfer] websocket error', err);
        notifyStatus('error', { reason: 'socket_error', message: err.message });
    });

    saveSettings(normalized);
}

function disconnect() {
    reconnectRequested = false;
    clearReconnectTimer();
    if (socket) {
        socket.close(1000, 'manual disconnect');
    } else {
        notifyStatus('disconnected');
    }
}

function sendCollect(source = 'manual', payloadOverride = null) {
    if (!settings.roomId || !settings.token) {
        notifyStatus('error', { reason: 'missing_configuration' });
        showMissingConfigGuidance();
        return false;
    }
    const payload = payloadOverride || collectElementService.getTransferPayload();
    if (!payload || !Array.isArray(payload.elements) || payload.elements.length === 0) {
        log.info('[collectTransfer] nothing to send');
        return false;
    }
    const messageId = createMessageId();
    const message = {
        type: 'collect',
        payload: {
            messageId,
            roomId: settings.roomId,
            senderId: settings.userId || loginService.getLoggedInUsername() || '',
            data: payload,
            source,
        },
    };
    queueMessage(message);
    return true;
}

function sendAck(messageId, targetUserId) {
    if (!messageId) {
        return;
    }
    const message = {
        type: 'ack',
        payload: {
            messageId,
            targetUserId,
        },
    };
    queueMessage(message);
}

async function handleCollect(payload) {
    if (!payload || !payload.data) {
        return;
    }
    suppressAutoSend = true;
    try {
        await collectElementService.applyTransferPayload(payload.data, {
            origin: 'remote',
            senderId: payload.senderId,
        });
        $(document).trigger(constants.EVENT_COLLECT_TRANSFER_RECEIVED, [payload]);
    } catch (err) {
        log.error('[collectTransfer] failed to apply incoming collect', err);
    } finally {
        suppressAutoSend = false;
    }
    if (payload.messageId) {
        sendAck(payload.messageId, payload.senderId || null);
    }
}

function handleMessage(message) {
    const { type, payload } = message || {};
    switch (type) {
        case 'joined':
            joinedRoom = true;
            notifyStatus('connected', { roomId: settings.roomId });
            flushQueue();
            break;
        case 'collect':
            handleCollect(payload);
            break;
        case 'ack':
            break;
        case 'error':
            notifyStatus('error', payload || {});
            break;
        default:
            log.debug('[collectTransfer] ignoring message type', type);
    }
}

function handleCollectUpdated(event, detail = {}) {
    renderControls();
    if (!settings.autoSend || suppressAutoSend) {
        return;
    }
    if (detail.origin === 'remote') {
        return;
    }
    const payload = detail.payload || collectElementService.getTransferPayload();
    sendCollect('auto', payload);
}

function statusToText(currentStatus) {
    const room = settings.roomId || '';
    switch (currentStatus.state) {
        case 'connected':
            return i18nService.t('CTRANSFER_STATUS_CONNECTED', room);
        case 'connecting':
            return i18nService.t('CTRANSFER_STATUS_CONNECTING');
        case 'error':
            if (currentStatus.details && currentStatus.details.reason === 'missing_configuration') {
                return i18nService.t('CTRANSFER_ERROR_MISSING_CONFIG');
            }
            if (currentStatus.details && currentStatus.details.message) {
                return currentStatus.details.message;
            }
            return i18nService.t('CTRANSFER_STATUS_ERROR');
        default:
            if (!hasRequiredConfig()) {
                return i18nService.t('CTRANSFER_ERROR_MISSING_CONFIG');
            }
            return i18nService.t('CTRANSFER_STATUS_DISCONNECTED');
    }
}

function renderControls() {
    // collect transfer controls are managed via collect element actions
}



function updateUserIdFromLogin() {
    if (!settings.userId) {
        const username = loginService.getLoggedInUsername();
        if (username) {
            saveSettings({ userId: username });
        }
    }
}

function goToIntegrationsSettings() {
    localStorageService.setSettingsDefaultTab(INTEGRATIONS_TAB);
    Router.to('#settings');
}

function showMissingConfigGuidance() {
    const now = Date.now();
    if (now - lastSettingsNudge > SETTINGS_NUDGE_INTERVAL_MS) {
        lastSettingsNudge = now;
        MainVue.setTooltip(i18nService.t('CTRANSFER_ERROR_MISSING_CONFIG'), {
            msgType: 'info',
            timeout: SETTINGS_TOAST_TIMEOUT_MS,
        });
    }
    goToIntegrationsSettings();
}

function handleUserChanged() {
    settings = loadSettings();
    updateUserIdFromLogin();
    renderControls();
    if (settings.autoReconnect && hasRequiredConfig()) {
        connect();
    } else {
        disconnect();
    }
}

function bindDomEvents() {
    // no collect bar UI bindings
}

function unbindDomEvents() {
    $(document).off('.collectTransfer');
}

collectTransferService.init = function () {
    if (initialized) {
        return;
    }
    initialized = true;
    updateUserIdFromLogin();
    renderControls();
    bindDomEvents();
    $(document).on(constants.EVENT_COLLECT_UPDATED, handleCollectUpdated);
    $(document).on(constants.EVENT_USER_CHANGED, handleUserChanged);
    if (settings.autoReconnect && hasRequiredConfig()) {
        connect();
    }
};

collectTransferService.connect = connect;
collectTransferService.disconnect = disconnect;
collectTransferService.sendCollect = sendCollect;
collectTransferService.getStatus = function () {
    return getStatus();
};
collectTransferService.getSettings = function () {
    return { ...settings };
};
collectTransferService.updateSettings = function (partial) {
    saveSettings(partial);
};

collectTransferService.isConnected = function () {
    return status.state === 'connected';
};

collectTransferService.getShareCode = function () {
    const descriptor = buildShareDescriptor();
    if (!descriptor) {
        return { success: false, reason: 'missing_configuration' };
    }
    const code = encodeSharePayload(descriptor);
    if (!code) {
        return { success: false, reason: 'encode_failed' };
    }
    return { success: true, code, descriptor };
};

collectTransferService.importShareCode = function (shareString) {
    const descriptor = decodeShareString(shareString);
    if (!descriptor) {
        return { success: false, reason: 'invalid_code' };
    }
    try {
        applyShareDescriptor(descriptor);
        return { success: true, descriptor };
    } catch (err) {
        console.warn('[collectTransfer] failed to import share code', err);
        return { success: false, reason: err.message || 'import_failed' };
    }
};

export { collectTransferService };
