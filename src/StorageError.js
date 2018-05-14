class StorageError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, StorageError);
  }

  static unauthorized(msg = 'Unauthorized') {
    const err = new StorageError(msg);
    err.code = 401;
    return err;
  }

  static error(msg = 'Error', code = 400) {
    const err = new StorageError(msg);
    err.code = code;
    return err;
  }
}

module.exports = StorageError;
