connect-mongo-memory
====================

MongoDB session store for Connect. Uses in-memory caching of sessions stored in MongoDB
  
To be used on a __single-host app__ and have
- Speed like in-memory sessions
- Persistence like MongoDB stored sessions ( https://github.com/kcbanner/connect-mongo )

## Example use ##

```
var session    = require('express-session');
var MongoMemoryStore = require('connect-mongo-memory')(session);

app.use(session({
  secret: settings.cookie_secret,
  store: new MongoStore({
    db : settings.db,
  })
}));
```

## Available options ##

- All options of https://github.com/kcbanner/connect-mongo, plus
- ```pruneInterval``` - default 600000 (10 min) - The interval to actively prune sessions from memory
- ```pruneSessionIdleTime``` - default 3600000 (1 hour) - How long may a session be idle before being pruned?