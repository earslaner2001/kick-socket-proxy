# Kick Chat — Text / Link / Emote Çekme Sistemi

Kick.com chat mesajlarını gerçek zamanlı olarak tarayıcıya çeken, proxy tabanlı WebSocket sistemi.

## Mimari

```
Tarayıcı (chat-test.html)
    │  ws://localhost:4000
    ▼
proxy-server/server.js      ← Node.js WebSocket proxy
    │  wss://ws-us2.pusher.com  (Origin: https://kick.com)
    ▼
Kick Pusher WebSocket       ← Gerçek chat akışı
```

## Neden proxy gerekiyor?

Kick'in Pusher sunucusu (`ws-us2.pusher.com`) tarayıcıdan gelen `localhost` origin'li bağlantıları reddediyor.
Proxy sunucu, Kick'e `Origin: https://kick.com` başlığıyla bağlandığı için kısıtlama aşılıyor.

## Kullanılan bilgiler

| Parametre       | Değer                              |
|-----------------|------------------------------------|
| Pusher Key      | `32cbd69e4b950bf97679`             |
| Pusher Host     | `ws-us2.pusher.com`                |
| Kanal formatı   | `chatrooms.{chatroom_id}.v2`       |
| Event adı       | `App\Events\ChatMessageEvent`      |
| Emote URL       | `files.kick.com/emotes/{id}/fullsize` |

## Başlatma

```bash
# 1. Proxy sunucuyu başlat
cd proxy-server
npm install
node server.js
# → ws://localhost:4000 adresinde çalışır

# 2. chat-test.html'i bir statik sunucudan aç
npx serve .
# Tarayıcıda: http://localhost:{port}/chat-test.html
```

## chat-test.html Özellikleri

- Kick API'den kanal bilgisi + chatroom ID otomatik çekilir
- Mesajlar gerçek zamanlı akar
- `[emote:ID:isim]` token'ları Kick CDN'inden görsel olarak render edilir
- URL'ler tıklanabilir link olarak gösterilir
- Kullanıcı adları üzerine gelinince Kick profil pop-up'ı çıkar

## Kanal değiştirme

`chat-test.html` içinde:
```javascript
const CHANNEL_SLUG = 'meyhanecidimitri'; // ← burası
```
