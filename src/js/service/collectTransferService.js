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
    token: '',
    userId: '',
    autoSend: false,
    autoReceive: true,
    autoReconnect: true,
    iceUseTurn: false,
    turnUrl: '',
    turnUsername: '',
    turnPassword: '',
};

const INTEGRATIONS_TAB = 'TAB_INTEGRATIONS';
const SETTINGS_NUDGE_INTERVAL_MS = 15000;
const SETTINGS_TOAST_TIMEOUT_MS = 10000;
const SHARE_PREFIX = 'AGCTRANSFER:';
const SHARE_VERSION = 1;
const DEFAULT_ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];
const DATA_CHANNEL_LABEL = 'collect-transfer';

const log = console;

function buildIceServers(config = settings) {
    const servers = DEFAULT_ICE_SERVERS.map((entry) => ({ ...entry }));
    if (config && config.iceUseTurn) {
        const rawUrl = (config.turnUrl || '').trim();
        if (rawUrl) {
            const urls = rawUrl.split(/[\s,]+/).filter(Boolean);
            const turnEntry = { urls: urls.length > 1 ? urls : urls[0] };
            if (config.turnUsername) {
                turnEntry.username = config.turnUsername.trim();
            }
            if (typeof config.turnPassword === 'string' && config.turnPassword.length > 0) {
                turnEntry.credential = config.turnPassword;
            }
            servers.push(turnEntry);
        }
    }
    return servers;
}

let collectTransferService = {};
let settings = loadSettings();
let socket = null;
let socketReady = false;
let currentRole = null;
let socketUserId = '';
let reconnectRequested = false;
let reconnectTimer = null;
let status = buildStatus('disconnected');
let pendingMessages = [];
let suppressAutoSend = false;
let initialized = false;
let lastSettingsNudge = 0;
let peerConnection = null;
let dataChannel = null;
let pendingRemoteCandidates = [];
let remotePeerUserId = null;

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
    ['token', 'userId', 'turnUrl', 'turnUsername'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(normalized, key) && typeof normalized[key] === 'string') {
            normalized[key] = normalized[key].trim();
        }
    });
    if (Object.prototype.hasOwnProperty.call(normalized, 'iceUseTurn')) {
        const value = normalized.iceUseTurn;
        normalized.iceUseTurn = value === true || value === 'true' || value === 1 || value === '1';
    }
    return normalized;
}

function hasRequiredConfig(config = settings) {
    if (!config) {
        return false;
    }
    const relayUrl = normalizeRelayUrl(config.relayUrl || '');
    const token = (config.token || '').trim();
    if (!relayUrl || !token) {
        return false;
    }
    if (config.iceUseTurn) {
        const turnUrl = (config.turnUrl || '').trim();
        if (!turnUrl) {
            return false;
        }
    }
    return true;
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
        token: (settings.token || '').trim(),
        userId: (settings.userId || '').trim(),
        autoSend: !!settings.autoSend,
        autoReconnect: settings.autoReconnect !== false,
        iceUseTurn: settings.iceUseTurn === true,
        turnUrl: (settings.turnUrl || '').trim(),
        turnUsername: (settings.turnUsername || '').trim(),
        turnPassword: settings.turnPassword || '',
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
    if (!incoming.relayUrl || !incoming.token) {
        throw new Error('invalid_share_settings');
    }
    const normalized = normalizeSettingsInput({
        relayUrl: incoming.relayUrl,
        token: incoming.token,
        userId: incoming.userId || '',
        iceUseTurn: incoming.iceUseTurn === true,
        turnUrl: incoming.turnUrl || '',
        turnUsername: incoming.turnUsername || '',
        turnPassword: incoming.turnPassword || '',
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
    const enriched = { token: settings.token || '', ...details };
    status = buildStatus(state, enriched);
    $(document).trigger(constants.EVENT_COLLECT_TRANSFER_STATUS, [getStatus()]);
    renderControls();
}

function stageToText(details = {}) {
    const stage = details && details.stage;
    if (!stage) {
        return null;
    }
    const key = `CTRANSFER_STAGE_${stage.toUpperCase()}`;
    const peerName = details && details.peer ? details.peer : '';
    const token = details && details.token ? details.token : (settings.token || '');
    let param;
    switch (stage) {
        case 'awaiting_partner':
            param = token || i18nService.t('CTRANSFER_STATUS_CONNECTED_PLACEHOLDER');
            break;
        case 'waiting_peer':
            param = peerName || i18nService.t('CTRANSFER_STATUS_CONNECTED_PLACEHOLDER');
            break;
        default:
            if (peerName) {
                param = peerName;
            }
            break;
    }
    let text;
    if (typeof param !== 'undefined') {
        text = i18nService.t(key, param);
    } else {
        text = i18nService.t(key);
    }
    if (text && text !== key) {
        return text;
    }
    return null;
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
    socketReady = false;
    currentRole = null;
    socketUserId = '';
    remotePeerUserId = null;
    cleanupPeerConnection();
    if (!manual) {
        notifyStatus('disconnected', { reason: 'closed' });
    } else if (status.state !== 'disconnected') {
        notifyStatus('disconnected', {});
    }
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

function isChannelReady() {
    return dataChannel && dataChannel.readyState === 'open';
}

function flushQueue() {
    if (!isChannelReady()) {
        return;
    }
    while (pendingMessages.length) {
        const msg = pendingMessages.shift();
        try {
            dataChannel.send(JSON.stringify(msg));
        } catch (err) {
            log.error('[collectTransfer] failed to send message', err);
            pendingMessages.unshift(msg);
            break;
        }
    }
}

function cleanupPeerConnection() {
    if (dataChannel) {
        try {
            dataChannel.close();
        } catch (err) {
            log.warn('[collectTransfer] error closing data channel', err);
        }
    }
    dataChannel = null;
    if (peerConnection) {
        try {
            peerConnection.close();
        } catch (err) {
            log.warn('[collectTransfer] error closing peer connection', err);
        }
    }
    peerConnection = null;
    pendingRemoteCandidates = [];
}

function ensurePeerConnection() {
    if (peerConnection) {
        return peerConnection;
    }
    if (typeof RTCPeerConnection === 'undefined') {
        notifyStatus('error', { reason: 'webrtc_unsupported' });
        log.error('[collectTransfer] RTCPeerConnection not supported in this environment');
        return null;
    }
    let pc;
    try {
        const iceServers = buildIceServers(settings);
        pc = new RTCPeerConnection({ iceServers });
    } catch (err) {
        log.error('[collectTransfer] failed to create RTCPeerConnection', err);
        notifyStatus('error', { reason: 'peer_connection_failed', message: err.message });
        return null;
    }
    pendingRemoteCandidates = [];
    pc.onicecandidate = (event) => {
        if (!event.candidate) {
            return;
        }
        const serialized = serializeCandidate(event.candidate);
        if (serialized) {
            emitSignal('ice', { token: settings.token, candidate: serialized, userId: socketUserId, role: currentRole });
        }
    };
    pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'failed') {
            notifyStatus('error', { reason: 'peer_connection_failed' });
        } else if (state === 'disconnected') {
            if (status.state === 'connected') {
                notifyStatus('connecting', { stage: 'waiting_peer', reason: 'peer_disconnected', peer: remotePeerUserId });
            }
        }
    };
    pc.ondatachannel = (event) => {
        dataChannel = event.channel;
        bindDataChannel(dataChannel);
    };
    peerConnection = pc;
    return pc;
}

function bindDataChannel(channel) {
    if (!channel) {
        return;
    }
    channel.onopen = () => {
        notifyStatus('connected', { token: settings.token, peer: remotePeerUserId });
        flushQueue();
    };
    channel.onclose = () => {
        if (status.state === 'connected') {
            notifyStatus('connecting', { token: settings.token, stage: 'waiting_peer', reason: 'channel_closed' });
        }
    };
    channel.onerror = (event) => {
        log.error('[collectTransfer] data channel error', (event && event.error) || event);
    };
    channel.onmessage = (event) => {
        handleDataChannelMessage(event);
    };
}

function handleDataChannelMessage(event) {
    let raw = event.data;
    if (typeof raw !== 'string') {
        if (raw instanceof ArrayBuffer && typeof TextDecoder !== 'undefined') {
            try {
                raw = new TextDecoder('utf-8').decode(raw);
            } catch (err) {
                log.warn('[collectTransfer] failed to decode binary channel message', err);
                raw = '';
            }
        } else {
            raw = String(raw || '');
        }
    }
    let message;
    try {
        message = JSON.parse(raw);
    } catch (err) {
        log.warn('[collectTransfer] failed to parse channel message', err);
        return;
    }
    const { type, payload } = message || {};
    if (type === 'collect') {
        handleCollect(payload);
    } else if (type === 'ack') {
        // no-op for now, ack is informational only
    } else {
        log.debug('[collectTransfer] ignoring channel message type', type);
    }
}

function serializeCandidate(candidate) {
    if (!candidate) {
        return null;
    }
    return {
        candidate: candidate.candidate || null,
        sdpMid: typeof candidate.sdpMid === 'undefined' ? null : candidate.sdpMid,
        sdpMLineIndex: typeof candidate.sdpMLineIndex === 'number' ? candidate.sdpMLineIndex : null,
        usernameFragment: typeof candidate.usernameFragment === 'undefined' ? null : candidate.usernameFragment,
    };
}

function emitSignal(type, payload = {}) {
    if (!socketReady || !socket || socket.readyState !== WebSocket.OPEN) {
        return false;
    }
    try {
        socket.send(JSON.stringify({ type, payload }));
        return true;
    } catch (err) {
        log.error('[collectTransfer] failed to send signal', err);
        return false;
    }
}

async function startOfferFlow() {
    if (!socketReady || currentRole !== 'offerer') {
        return;
    }
    const pc = ensurePeerConnection();
    if (!pc) {
        return;
    }
    if (pc.signalingState && pc.signalingState !== 'stable') {
        log.debug('[collectTransfer] skipping offer; signalingState=', pc.signalingState);
        return;
    }
    if (!dataChannel || dataChannel.readyState === 'closed') {
        dataChannel = pc.createDataChannel(DATA_CHANNEL_LABEL, { ordered: true });
        bindDataChannel(dataChannel);
    }
    try {
        notifyStatus('connecting', { stage: 'awaiting_partner' });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emitSignal('offer', { token: settings.token, sdp: offer.sdp, userId: socketUserId });
        notifyStatus('connecting', { stage: 'awaiting_answer' });
    } catch (err) {
        log.error('[collectTransfer] failed to create offer', err);
        notifyStatus('error', { reason: 'offer_failed', message: err.message });
    }
}

function handlePeerLeft(payload = {}) {
    remotePeerUserId = null;
    cleanupPeerConnection();
    currentRole = 'offerer';
    notifyStatus('connecting', { token: settings.token, stage: 'waiting_peer', peer: payload && payload.userId ? payload.userId : null });
    if (socketReady) {
        const pc = ensurePeerConnection();
        if (pc) {
            startOfferFlow();
        }
    }
}

async function handleOffer(data = {}) {
    if (!socketReady) {
        return;
    }
    const pc = ensurePeerConnection();
    if (!pc || !data.sdp) {
        return;
    }
    currentRole = 'answerer';
    remotePeerUserId = data.userId || null;
    try {
        await pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emitSignal('answer', { token: settings.token, sdp: answer.sdp, userId: socketUserId });
        notifyStatus('connecting', { token: settings.token, stage: 'awaiting_peer_channel' });
        flushPendingRemoteCandidates();
    } catch (err) {
        log.error('[collectTransfer] failed to handle offer', err);
        notifyStatus('error', { reason: 'offer_handle_failed', message: err.message });
    }
}

async function handleAnswer(data = {}) {
    if (!peerConnection || !data.sdp) {
        return;
    }
    try {
        await peerConnection.setRemoteDescription({ type: 'answer', sdp: data.sdp });
        remotePeerUserId = data.userId || remotePeerUserId;
        notifyStatus('connecting', { token: settings.token, stage: 'awaiting_peer_channel' });
        flushPendingRemoteCandidates();
    } catch (err) {
        log.error('[collectTransfer] failed to handle answer', err);
    }
}

function flushPendingRemoteCandidates() {
    if (!peerConnection || !peerConnection.remoteDescription) {
        return;
    }
    const queue = pendingRemoteCandidates.slice();
    pendingRemoteCandidates = [];
    queue.forEach((candidateInit) => {
        peerConnection.addIceCandidate(candidateInit).catch((err) => {
            log.warn('[collectTransfer] failed to add remote candidate', err);
        });
    });
}

function handleCandidate(data = {}) {
    if (!data.candidate) {
        return;
    }
    const pc = ensurePeerConnection();
    if (!pc) {
        return;
    }
    const candidateInit = { ...data.candidate };
    if (pc.remoteDescription && pc.remoteDescription.type) {
        pc.addIceCandidate(candidateInit).catch((err) => {
            log.warn('[collectTransfer] failed to add remote candidate', err);
        });
    } else {
        pendingRemoteCandidates.push(candidateInit);
    }
}

function handleSignalError(payload = {}) {
    const code = payload.code || 'signal_error';
    if (code === 'token_in_use') {
        if (currentRole !== 'answerer') {
            currentRole = 'answerer';
            cleanupPeerConnection();
            ensurePeerConnection();
            emitSignal('answer', { token: settings.token, userId: socketUserId });
            notifyStatus('connecting', { token: settings.token, stage: 'waiting_offer' });
        }
        return;
    }
    if (code === 'no_offer') {
        currentRole = 'offerer';
        cleanupPeerConnection();
        ensurePeerConnection();
        notifyStatus('connecting', { token: settings.token, stage: 'awaiting_partner' });
        return;
    }
    log.warn('[collectTransfer] signaling error', payload);
    notifyStatus('error', { reason: code, message: payload.message || code });
}

function connect(options = {}) {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        log.info('[collectTransfer] ignoring connect request while socket is active');
        return;
    }

    const merged = { ...settings, ...options };
    const normalized = normalizeSettingsInput({
        relayUrl: merged.relayUrl,
        token: merged.token,
        userId: merged.userId,
    });
    const relayUrl = normalized.relayUrl;
    const token = normalized.token;

    if (!relayUrl || !token) {
        showMissingConfigGuidance();
        notifyStatus('error', { reason: 'missing_configuration' });
        return;
    }
    if (normalized.iceUseTurn && !(normalized.turnUrl || '').trim()) {
        showMissingConfigGuidance();
        notifyStatus('error', { reason: 'missing_turn' });
        return;
    }

    reconnectRequested = false;
    clearReconnectTimer();
    closeSocket(true);
    cleanupPeerConnection();
    pendingMessages = [];

    reconnectRequested = true;
    notifyStatus('connecting', { relayUrl, stage: 'websocket' });

    try {
        socket = new WebSocket(relayUrl);
    } catch (err) {
        log.error('[collectTransfer] failed to open websocket', err);
        notifyStatus('error', { reason: 'invalid_url', message: err.message });
        scheduleReconnect();
        return;
    }

    socketReady = false;
    currentRole = null;
    remotePeerUserId = null;
    socketUserId = normalized.userId || loginService.getLoggedInUsername() || '';

    socket.addEventListener('open', () => {
        socketReady = true;
        currentRole = 'offerer';
        const pc = ensurePeerConnection();
        if (!pc) {
            return;
        }
        notifyStatus('connecting', { relayUrl, stage: 'signaling' });
        startOfferFlow();
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
        socketReady = false;
        socket = null;
        currentRole = null;
        socketUserId = '';
        remotePeerUserId = null;
        cleanupPeerConnection();
        if (!manual) {
            notifyStatus('connecting', { stage: 'reconnecting', code: evt.code });
            scheduleReconnect();
        } else {
            notifyStatus('disconnected', { code: evt.code, reason: evt.reason });
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
    remotePeerUserId = null;
    closeSocket(true);
    if (!socket) {
        notifyStatus('disconnected');
    }
}

function sendCollect(source = 'manual', payloadOverride = null) {
    if (!settings.token) {
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
        case 'offer-registered':
            currentRole = 'offerer';
            notifyStatus('connecting', { stage: 'awaiting_partner' });
            break;
        case 'answer-registered':
            notifyStatus('connecting', { stage: 'waiting_channel' });
            break;
        case 'offer':
            handleOffer(payload || {});
            break;
        case 'answer':
            handleAnswer(payload || {});
            break;
        case 'ice':
            handleCandidate(payload || {});
            break;
        case 'peer-disconnected':
            handlePeerLeft(payload || {});
            break;
        case 'error':
            handleSignalError(payload || {});
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
    const details = currentStatus && currentStatus.details ? currentStatus.details : {};
    switch ((currentStatus && currentStatus.state) || 'disconnected') {
        case 'connected': {
            const display = (details.peer && details.peer.trim()) || (details.token && details.token.trim()) || i18nService.t('CTRANSFER_STATUS_CONNECTED_PLACEHOLDER');
            return i18nService.t('CTRANSFER_STATUS_CONNECTED', display);
        }
        case 'connecting': {
            const stageText = stageToText(details);
            return stageText || i18nService.t('CTRANSFER_STATUS_CONNECTING');
        }
        case 'error': {
            if (details.reason === 'missing_configuration') {
                return i18nService.t('CTRANSFER_ERROR_MISSING_CONFIG');
            }
            if (details.reason === 'missing_turn') {
                return i18nService.t('CTRANSFER_ERROR_MISSING_TURN');
            }
            if (details.message) {
                return details.message;
            }
            return i18nService.t('CTRANSFER_STATUS_ERROR');
        }
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

function generateToken(length = 8) {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const cryptoObj = (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) ? window.crypto : null;
    let token = '';
    if (cryptoObj) {
        const bytes = new Uint32Array(length);
        cryptoObj.getRandomValues(bytes);
        for (let i = 0; i < length; i += 1) {
            token += alphabet[bytes[i] % alphabet.length];
        }
        return token;
    }
    for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * alphabet.length);
        token += alphabet[index];
    }
    return token;
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


	collectTransferService.parseShareCode = function (shareString) {
	    const descriptor = decodeShareString(shareString);
	    if (!descriptor) {
	        return { success: false, reason: 'invalid_code' };
	    }
	    return { success: true, descriptor };
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

collectTransferService.generateToken = generateToken;

export { collectTransferService };
