// JACKED Service Worker
// This enables offline functionality and faster loading
// Bump CACHE_NAME on each deploy to force users to get fresh content

const CACHE_NAME = 'jacked-v7' // Bump this on every deploy for instant updates
const STATIC_CACHE = 'jacked-static-v6'

// Assets to cache for offline (only used when network fails)
const STATIC_ASSETS = [
  '/feed',
  '/discover',
  '/offline.html',
]

// Install event - cache static assets for offline fallback
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets for offline')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
            .map((name) => caches.delete(name))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - network-first for pages (design updates show immediately), cache for offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip POST requests
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)
  
  // Never cache root path or auth pages
  if (url.pathname === '/' || url.pathname.startsWith('/auth/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // NETWORK-FIRST for page navigations (HTML) - ensures design updates show immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache for offline fallback only
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/offline.html')))
    )
    return
  }

  // STALE-WHILE-REVALIDATE for static assets - serve cache immediately, update in background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      if (cachedResponse) {
        fetchPromise.catch(() => {}) // Update cache in background
        return cachedResponse
      }
      return fetchPromise
    })
  )
})

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})


