# Final approach: we bypass the actual `rxdb` instantiation by injecting a mock database into `dbPromise` directly.
# However, `dbPromise` is not exported, but we can export a `__setDbPromise` test hook!
