/**
 * Записать заголовки content-disposition и content-type
 * @param {http.Response} res
 */
function setHeaders(res) {
  res.set({
    'Content-Disposition': 'attachment;',
    'Content-Type': 'text/csv; charset=utf8'
  });
}

/**
 * Достать данные из request
 * @param  {http.Request} req
 * @return {Object} { modelName, options }
 */
function extractFromRequest(req) {
  const { modelName = null } = req.params || {};

  return {
    modelName,
    options: req.query || {}
  };
}

/**
 * Обработать запрос на отчет
 * @async
 * @param  {Report} report
 * @param  {http.Request}  req
 * @param  {http.Response} res
 */
async function handle(report, req, res) {
  const { modelName, options } = extractFromRequest(req);

  if (!report.is(modelName)) return;

  setHeaders(res);

  await report.writeToStream({
    stream: res,
    modelName, options
  });

  res.end();
}

module.exports = {
  setHeaders, extractFromRequest, handle
};
