class ReportError extends Error {}

ReportError.MODEL_NOT_FOUND = 'Model not found.\nCheck modelName option and a model in the storage';
ReportError.GENERATOR_NOT_FOUND = 'Generator not found.\nCheck generators option in constructor or extension';
ReportError.DEFAULT_QUERY_BUILDER_IS_NULL = 'Option defaultQueryBuilder is null or not defined.\nYou should report.setDefaultQueryBuilder(fn) for using default query';
ReportError.GENERATORS_IS_NOT_AN_OBJECT = 'Option generators is not an object';
ReportError.QUERIES_IS_NOT_AN_OBJECT = 'Option queries is not an object';
ReportError.QUERY_BUILDER_IS_NOT_A_FUNCTION = 'Option defaultQueryBuilder is not a function or null';
ReportError.ROW_IS_NOT_A_STRING = 'Param row should be an array';
ReportError.WRITE_TO_STREAM_IS_NOT_IMPLEMENTED = 'Write to stream is not implemented';

module.exports = ReportError;
