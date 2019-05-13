const Rubik = require('rubik-main');
const MongoDbCursor = require('../../services/MongoDbCursor');

class Report extends Rubik.Kubik {
  /**
   * Устанавливает зависимости и нициализирует tasks и volumes
   * @param {Array|String} volumes Путь или массив путей до папки с заданиями
   */
  constructor ({ csvGenerators, getSpecificQuery }) {
    super();
    this.name = 'Report';
    this.csvGenerators = csvGenerators || {};
    this.getSpecificQuery = getSpecificQuery || {};
    this.dependencies = ['log', 'http', 'storage'];
  }

  /**
   * Универсальный метод для формирования csv по существующей коллекции в базе.
   * Чтобы добавить новый отчет, необходимо добавить соответствующий класс
   * в объект StatsCsvGenerator. Если для поиска необходимо выполнить специфический
   * запрос нужно добавить поле с ключем названия модели в объект this.getSpecificQuery,
   * значением этого поля должна быть функция возвращающая специфические параметры запроса
   * @param  {Object}   stream     Поток в который писать отчет
   * @param  {Object}   modelName  Название модели по которой формируется статистика
   * @param  {Obejct}   options    Параметры для формирования запроса в базу данных
   * @return {undefined}
   */
  async writeCsvToStream ({ stream, modelName, options }) {
    const Model = this.rubik.storageModels[modelName];
    if (!Model || !this.csvGenerators[modelName]) throw new Error('invalid modelName');

    const query = await this.getQuery({ modelName, options })
    const cursor = new MongoDbCursor({ Model, query });
    const statsCsvGenerator = new this.csvGenerators[modelName]({
      cursor,
      app: this.rubik,
      isDevStats: options.isDevStats
    });

    await statsCsvGenerator.generateCsvString({ stream });
  }

  /**
   * Функция получения параметров запроса. Возвращает результат вызова одной из функций
   * в объекте getSpecificQuery или дефолтные параметры запроса
   * @param  {String} modelName Названия модели, чтобы выбрать нужную функцию в getSpecificQuery
   * @param  {Object} queryRaw  Параметры из req.query
   * @return {Object}           Параметры запроса в монгу
   */
  async getQuery({ modelName, options }) {
    if (this.getSpecificQuery[modelName]) {
      return await this.getSpecificQuery[modelName](options);
    }
    const { from, to } = options;
    return { createdAt: { $gte: from, $lt: to }, bot: options.bot};
  }


  async getHttpMiddleware() {
    return this.httpMiddleware.bind(this);
  }

  async httpMiddleware(req, res, next) {
    try {
      const { modelName } = req.params
      const Model = this.rubik.storageModels[modelName];
      if (!Model || !this.csvGenerators[modelName]) return next();

      try {
        res.set({ 'Content-Disposition': 'attachment;', 'Content-Type': 'text/csv; charset=utf8' });
        await this.writeCsvToStream({ stream: res, modelName, options: req.query });
      } catch (err) {
        res.write('Error!');
        console.error('CSV generating error', err);
        // next нельзя использоать так как мы установили заголовки
      }

      res.end();
    } catch (err) {
      next(err)
    }
  }

  use(extension) {
    if (Array.isArray(extension.volumes)) {
      for (const volume of extension.volumes) {
        this.volumes.push(volume);
      }
    }
    super.use(extension);
  }

  async up(dependencies) {
    Object.assign(this, dependencies);
  }
}

module.exports = Report;
