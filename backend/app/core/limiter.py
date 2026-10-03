from slowapi import Limiter
from slowapi.util import get_remote_address

# Single shared limiter: main.py registers it on app.state, routers decorate with it.
limiter = Limiter(key_func=get_remote_address)
