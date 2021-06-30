const ReportError = require('../src/ReportError.js');

/**
 * Экранировать кавычки для CSV
 * @param  {String} string — строка которую нужно экранировать
 * @return {String} экранированная строка
 */
function esc(string) {
  if (!string && string !== 0) return '';
  return (string + '').replace(/"/g, '""');
}

/**
 * Привести значение к строке CSV
 * @param  {Mixed} row — если массив, то экранирует все колонки и вернет одной строкой, в противном случае просто экранирует
 * @return {String} экранированная или собранная строка
 */
function toString(row) {
  if (typeof row === 'string') {
    return esc(row);
  }

  if (!Array.isArray(row)) return esc(row);

  return row.map((value) => `${esc(value)}`).join(';') + '\n';
}

/**
 * Записать строку в поток
 * @param  {WritableStream} stream
 * @param  {Array} row — массив с элементами строки
 */
function writeToStream(stream, row) {
  if (!Array.isArray(row)) {
    throw new ReportError(ReportError.ROW_IS_NOT_A_STRING);
  }

  stream.write(toString(row));
}

module.exports = {
  esc, toString, writeToStream
};
