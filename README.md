connect-mongo-memory
====================

MongoDB session store for Connect. Uses in-memory caching of sessions stored in MongoDB
  
To be used on a single-host app and have
- Speed of in-memory sessions
- Persistence of MongoDB stored ( https://github.com/kcbanner/connect-mongo )

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
- ```pruneSessionIdleTime``` - default 3600000 (1 hour) -  