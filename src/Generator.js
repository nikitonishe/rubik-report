const ReportError = require('./ReportError.js');

class Generator {
  constructor({ app, cursor, data, options }) {
    Object.assign(this, { app, cursor, data, options });
  }

  writeToStream(/* stream */) {
    throw new ReportError(ReportError.WRITE_TO_STREAM_IS_NOT_IMPLEMENTED)
  }
}

module.exports = Generator;
