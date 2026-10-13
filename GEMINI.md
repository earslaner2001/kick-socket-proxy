# kick-socket-proxy — Proje Özeti (GEMINI.md)

Bu dosya, AI asistanların projeyi hızlıca anlaması için hazırlanmıştır.

---

## Projenin Amacı

Kick.com'un canlı sohbet akışını tarayıcıya taşımak için bir **WebSocket proxy sunucusu**.  
Tarayıcılar, origin kısıtlaması nedeniyle Kick'in Pusher sunucusuna doğrudan bağlanamaz.  
Bu proxy, sunucu tarafında `Origin: https://kick.com` başlığıyla Pusher'a bağlanır ve mesajları yerel istemciye iletir.

---

## Mimari

```
Tarayıcı  (chat-test.html)
    │  ws://localhost:4000?channel=SLUG&chatroomId=ID
    ▼
proxy-server/server.js     ← Node.js WebSocket proxy (ws kütüphanesi)
    │  wss://ws-us2.pusher.com  (Origin: https://kick.com)
    ▼
Kick Pusher WebSocket      ← Canlı sohbet akışı
```

---

## Teknoloji Yığını

| Katman        | Teknoloji                              |
|---------------|----------------------------------------|
| Çalışma Zamanı | Node.js >= 18 (ESM modülleri)         |
| WebSocket     | `ws` v8                                |
| Protocol      | Pusher Protocol v7                     |
| Frontend      | Vanilla HTML/JS (tek dosya)            |
| Lisans        | GPL-3.0                                |

---

## Proje Yapısı

```
kick-socket-proxy/
├── proxy-server/
│   ├── server.js          # Ana proxy sunucusu (Node.js ESM)
│   ├── package.json       # Bağımlılıklar (sadece "ws")
│   └── package-lock.json
├── chat-test.html         # Tarayıcı test istemcisi
├── start.bat              # Windows başlatma betiği
├── .github/
│   ├── CONTRIBUTING.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
├── .gitignore
├── README.md
└── GEMINI.md              # Bu dosya
```

---

## Ana Dosyalar

### `proxy-server/server.js`
- **Port:** `4000` (`ws://localhost:4000`)
- **Bağlantı parametreleri:** `?channel=SLUG&chatroomId=ID`
- **Pusher endpoint'leri (fallback sırasıyla):**
  1. `wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679`
  2. `wss://ws-mt1.pusher.com/app/32cbd69e4b950bf97679`
- **Temel akış:**
  1. Frontend `ws://localhost:4000` ile bağlanır
  2. Proxy, Kick Pusher sunucusuna bağlanır (`Origin: https://kick.com`)
  3. `pusher:connection_established` → `chatrooms.{chatroomId}.v2` kanalına abone olur
  4. `App\Events\ChatMessageEvent` → mesajı frontend'e `{ type: 'chat', data: {...} }` olarak iletir
  5. `pusher:ping` → `pusher:pong` ile yanıtlar
  6. Bağlantı hatası veya timeout (8 sn) → sıradaki endpoint'e geçer
  7. Frontend kapanırsa Kick bağlantısı da temizlenir

### `chat-test.html`
- Bağımsız tarayıcı test istemcisi (dış bağımlılık yok)
- Kanal değişikliği: `CHANNEL_SLUG` sabiti (~satır 351)
- Emote token'larını (`[emote:ID:name]`) Kick CDN'inden resim olarak render eder
- URL'leri tıklanabilir linklere dönüştürür
- Kullanıcı profil hover popup'ı içerir
- Kick public API üzerinden kanal canlı/çevrimdışı durumu gösterir

---

## Pusher Protokolü Referansı

| Parametre   | Değer                                   |
|-------------|-----------------------------------------|
| Pusher Key  | `32cbd69e4b950bf97679`                  |
| Host        | `ws-us2.pusher.com` (primer)            |
| Kanal fmt   | `chatrooms.{chatroomId}.v2`             |
| Chat eventi | `App\Events\ChatMessageEvent`           |
| Emote CDN   | `files.kick.com/emotes/{id}/fullsize`   |

---

## Mesaj Tipleri (Proxy → Frontend)

| `type`        | İçerik                                      |
|---------------|---------------------------------------------|
| `status`      | Bağlantı durumu bildirimi                   |
| `connected`   | Pusher bağlantısı kuruldu (`socket_id`)     |
| `subscribed`  | Kanala abone olundu                         |
| `chat`        | Sohbet mesajı (`data` alanında chatData)    |
| `error`       | Hata mesajı                                 |

---

## Geliştirme Notları

- Proje **ESM** (`"type": "module"`) kullanır; `require()` yerine `import` kullanılmalı.
- Tek bağımlılık: `ws` paketi. Ek kütüphane eklerken `proxy-server/package.json`a ekle.
- `start.bat` Windows'ta proxy'yi başlatmak için kolaylık betiğidir.
- Testler için: önce `cd proxy-server && npm install && npm start`, sonra `npx serve .` ile `chat-test.html` aç.
- Yeni Pusher endpoint eklemek için `KICK_ENDPOINTS` dizisine yeni URL ekle (`server.js` üst kısım).
- Frontend ayrıldığında (`clientWs.on('close')`) Kick bağlantısı otomatik kapatılır — bellek sızıntısı riski yok.
