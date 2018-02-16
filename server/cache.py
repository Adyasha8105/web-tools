from dogpile.cache import make_region
from dogpile.cache.util import compat, inspect

from server import config

cache = make_region().configure(
    'dogpile.cache.redis',
    arguments = {
        'url': config.get('CACHE_REDIS_URL'),
        'port': 6379,
        'db': 0,
        'redis_expiration_time': 60*60*24*3,   # 3 days
        'distributed_lock': True
        }
)


def key_generator(namespace, fn, to_str=compat.string_type):
    # can't use the default dogpile.cache one because it doesn't respect keyworded args
    if namespace is None:
        namespace = '%s:%s' % (fn.__module__, fn.__name__)
    else:
        namespace = '%s:%s|%s' % (fn.__module__, fn.__name__, namespace)

    args = inspect.getargspec(fn)
    has_self = args[0] and args[0][0] in ('self', 'cls')

    def generate_key(*fn_args, **kw):
        kw_keys = ["{}_{}".format(k, v) for k, v in kw.iteritems()]
        if has_self:
            fn_args = fn_args[1:]

        return namespace + "|" + " ".join(map(to_str, fn_args) + kw_keys)
    return generate_key
