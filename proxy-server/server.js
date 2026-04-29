/**
 * Kick Chat Proxy
 *
 * Tarayıcılar Kick'in WebSocket'ine origin kısıtlaması nedeniyle bağlanamaz.
 * Bu proxy sunucu tarafından Kick'e bağlanır ve mesajları frontend'e iletir.
 *
 * Frontend bağlantısı: ws://localhost:4000?channel=meyhanecidimitri&chatroomId=1113731
 */

import { WebSocketServer, WebSocket } from 'ws';

const PROXY_PORT   = 4000;
const PUSHER_KEY   = '32cbd69e4b950bf97679';

// Kick'in gerçek Pusher endpoint'i (ws-us2 cluster)
const KICK_ENDPOINTS = [
    `wss://ws-us2.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0-rc2&flash=false`,
    `wss://ws-mt1.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0-rc2&flash=false`,
];

// ─── Frontend WebSocket sunucusu ─────────────────────────────────────────────
const proxyServer = new WebSocketServer({ port: PROXY_PORT });
console.log(`[Proxy] Sunucu başlatıldı → ws://localhost:${PROXY_PORT}`);
console.log(`[Proxy] Kullanım: ws://localhost:${PROXY_PORT}?channel=SLUG&chatroomId=ID`);

proxyServer.on('connection', (clientWs, req) => {
    const params     = new URL(req.url, `http://localhost`).searchParams;
    const channel    = params.get('channel')    || 'unknown';
    const chatroomId = params.get('chatroomId') || null;

    if (!chatroomId) {
        clientWs.send(JSON.stringify({ type: 'error', message: 'chatroomId parametresi gerekli' }));
        clientWs.close();
        return;
    }

    console.log(`[Proxy] Frontend bağlandı → channel=${channel} chatroomId=${chatroomId}`);
    send(clientWs, 'status', { message: `Kick'e bağlanılıyor... (channel: ${channel})` });

    connectToKick(chatroomId, clientWs, 0);

    clientWs.on('close', () => {
        console.log(`[Proxy] Frontend ayrıldı → channel=${channel}`);
    });
});

// ─── Kick'e bağlanma + Pusher protokolü ─────────────────────────────────────
function connectToKick(chatroomId, clientWs, endpointIndex) {
    if (endpointIndex >= KICK_ENDPOINTS.length) {
        send(clientWs, 'error', { message: 'Kick WebSocket\'e bağlanılamadı. Tüm endpoint\'ler başarısız.' });
        return;
    }

    const endpoint = KICK_ENDPOINTS[endpointIndex];
    const label    = endpoint.split('/app/')[0].replace('wss://', '');
    console.log(`[Kick] Deneniyor: ${label}`);
    send(clientWs, 'status', { message: `Deneniyor: ${label}` });

    const kickWs = new WebSocket(endpoint, {
        headers: {
            'Origin': 'https://kick.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    const timeout = setTimeout(() => {
        console.log(`[Kick] Timeout: ${label}`);
        kickWs.terminate();
        connectToKick(chatroomId, clientWs, endpointIndex + 1);
    }, 8000);

    kickWs.on('open', () => {
        console.log(`[Kick] Bağlantı açıldı: ${label}`);
    });

    kickWs.on('message', (raw) => {
        let msg;
        try {
            const str = Array.isArray(raw) ? Buffer.concat(raw).toString('utf8') : raw.toString('utf8');
            msg = JSON.parse(str);
        } catch { return; }

        const event = msg.event || '';

        // Pusher bağlantısı kuruldu → kanala abone ol
        if (event === 'pusher:connection_established') {
            clearTimeout(timeout);
            const connData = typeof msg.data === 'string' ? JSON.parse(msg.data) : (msg.data || {});
            console.log(`[Kick] Bağlandı! socket_id=${connData.socket_id}`);
            send(clientWs, 'connected', { endpoint: label, socket_id: connData.socket_id });

            kickWs.send(JSON.stringify({
                event: 'pusher:subscribe',
                data:  { channel: `chatrooms.${chatroomId}.v2` }
            }));
        }

        // Abonelik başarılı
        else if (event === 'pusher_internal:subscription_succeeded') {
            console.log(`[Kick] Kanal aboneliği başarılı: chatrooms.${chatroomId}.v2`);
            send(clientWs, 'subscribed', { channel: `chatrooms.${chatroomId}.v2` });
        }

        // Chat mesajı geldi → frontend'e ilet
        else if (event === 'App\\Events\\ChatMessageEvent') {
            const chatData = typeof msg.data === 'string' ? JSON.parse(msg.data) : (msg.data || {});

            const username = chatData?.sender?.username || '?';
            const content  = chatData?.content || '';
            console.log(`[Chat] ${username}: ${content} | clientState=${clientWs.readyState}`);

            // chatData'yı doğrudan nested olarak gönder — spread yerine
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'chat', data: chatData }));
            }
        }

        // Pusher ping → pong
        else if (event === 'pusher:ping') {
            kickWs.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
        }

        // Hata eventi
        else if (event === 'pusher:error') {
            const errData = typeof msg.data === 'string' ? JSON.parse(msg.data) : (msg.data || {});
            console.error(`[Kick] Pusher hatası: code=${errData.code} message=${errData.message}`);
            clearTimeout(timeout);
            send(clientWs, 'status', { message: `Hata (${errData.code}): ${errData.message} — sonraki deneniyor...` });
            kickWs.terminate();
            connectToKick(chatroomId, clientWs, endpointIndex + 1);
        }
    });

    kickWs.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`[Kick] Hata: ${label} — ${err.message}`);
        connectToKick(chatroomId, clientWs, endpointIndex + 1);
    });

    kickWs.on('close', (code, reason) => {
        clearTimeout(timeout);
        if (code !== 1000 && code !== 1001) {
            console.log(`[Kick] Kapatıldı: ${label} code=${code} reason=${reason}`);
        }
    });

    // Frontend kapanırsa Kick bağlantısını da kapat
    clientWs.on('close', () => {
        clearTimeout(timeout);
        kickWs.terminate();
    });
}

// ─── Yardımcı: frontend'e mesaj gönder ───────────────────────────────────────
function send(ws, type, payload) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...payload }));
    }
}
