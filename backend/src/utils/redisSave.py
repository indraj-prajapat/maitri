import redis
import threading
import time
import os

# Connect to Redis (fallback to fake dict if Redis not available)
try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()
    USE_REDIS = True
except:
    USE_REDIS = False
    _fake_cache = {}

def set_progress(key, value):
    if USE_REDIS:
        r.setex(key, 300, value)  # TTL 5 min
    else:
        _fake_cache[key] = value

def get_progress(key):
    if USE_REDIS:
        return float(r.get(key) or 0.0)
    else:
        return float(_fake_cache.get(key, 0.0))
def destroy_all_progress_keys():
    """
    Delete every progress key we ever stored.
    Safe for both Redis and the in-memory fallback.
    """
    if USE_REDIS:
        # grab every key that exists right now
        for key in r.scan_iter(match="*"):
            r.delete(key)
    else:
        _fake_cache.clear()