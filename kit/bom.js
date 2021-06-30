const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

/**
 * Записать UTF-8 BOM в поток
 * Заголовок BOM нужен чтобы программы
 * самостоятельно поняли кодировку файла
 * @param  {WritableStream} stream — поток
 * Функция пишет в поток и ничего не возвращает
 */
function writeToStream(stream) {
  stream.write(BOM);
}

module.exports = {
  BOM,
  writeToStream
};
