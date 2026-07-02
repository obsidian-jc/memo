// 최소한의 서비스 워커: 앱 껍데기(HTML/아이콘)를 캐시해서
//  1) 홈 화면에 "설치"할 수 있게 해주고 (설치 조건 중 하나가 서비스 워커 등록입니다)
//  2) 현장에서 신호가 약할 때도 앱 화면 자체는 바로 열리게 해줍니다.
// 데이터는 항상 localStorage/노션에서 오므로, 캐시가 오래돼도 실제 기록에는 영향 없습니다.

const CACHE_NAME = 'wonebailey-facility-v1';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 앱 껍데기만 캐시 우선으로 서빙; 노션/CDN 같은 외부 API 호출은 항상 네트워크로 보냅니다.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
