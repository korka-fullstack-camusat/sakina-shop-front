"""
Instance SlowAPI partagée — évite les imports circulaires.
Importée dans main.py ET dans les routers.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
