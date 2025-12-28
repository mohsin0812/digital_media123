// Simple in-memory cache middleware
// In production, replace with Redis or Memcached

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(req) {
  return `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
}

function cacheMiddleware(duration = CACHE_TTL) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = getCacheKey(req);
    const cached = cache.get(key);

    if (cached && (Date.now() - cached.timestamp) < duration) {
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data) {
      cache.set(key, {
        data: data,
        timestamp: Date.now()
      });

      // Clean old cache entries periodically
      if (cache.size > 1000) {
        const now = Date.now();
        for (const [k, v] of cache.entries()) {
          if (now - v.timestamp > duration) {
            cache.delete(k);
          }
        }
      }

      return originalJson(data);
    };

    next();
  };
}

function clearCache(pattern = null) {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

module.exports = {
  cacheMiddleware,
  clearCache
};

