connect-memcache
================

Connect sessions with memcached

Example usage:

    app.use(express.cookieParser())
      app.use(express.session(
        store: new memcacheStore(client: storage)
        secret: config.session_secret
        key: 'sid'
        cookie:
          maxAge: config.session_lifetime
      ))
