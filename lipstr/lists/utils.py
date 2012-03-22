

CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

def get_random_string(n):
    """Returns a 'n' character random string."""
    import random
    return ''.join([CHARS[random.randint(0, 35)] for _ in xrange(n)])
    
    