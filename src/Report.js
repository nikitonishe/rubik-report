const Rubik = require('rubik-main');

const { writeToStream: writeBomToStream } = require('../kit/bom.js');

const ReportError = require('./ReportError.js');
const Generator = require('./Generator.js');

/**
 * Словарь классов генераторов отчетов
 * @typedef {Object.<string, function>} Generators
 * Обычный словарь
 * Ключ — это имя класса генератора для отчета
 * Значение — это класс генератора отчета
 */

/**
 * Словарь фабрик уникальных запросов
 * @typedef {Object.<string, function>} Queries
 * Обычный словарь
 * Ключи — названия моделей
 * Значения — функции, которые возвращают объект опций
 *
 * Не обязательно указывать все доступные модели, если этого не сделать,
 * отчет будет сформирован запросом по умолчанию
 */

/**
 * DRY — проверить можно ли записать данные в generators и queries
 * и выбросить исключение, если нельзя
 * @param  {Object} object объект, которые предполагается записать
 * @param  {String} error  текст исключения
 */
const checkAssingable = (object, error) => {
  if (typeof object !== 'object' || object === null) {
    throw new ReportError(error);
  }
};

class Report extends Rubik.Kubik {
  /**
   * @param {Object}     options
   * @param {Generators} options.generators — классы отчетов
   * @param {Queries}    options.queries — функции-фабрики запросов к моделям
   */
  constructor (options = {}) {
    super();
    const { generators = {}, queries = {}, defaultQueryBuilder } = options;
    this.generators = {};
    this.queries = {};

    if (generators) this.assignGenerators(generators);
    if (queries) this.assignQueries(queries);

    this.defaultQueryBuilder = this.defaultQueryBuilder || null;

    if (defaultQueryBuilder) {
      this.setDefaultQueryBuilder(defaultQueryBuilder);
    }
  }

  /**
   * Записать фабрику запросов по умолчанию
   * @param {Function} fn
   */
  setDefaultQueryBuilder(fn = null) {
    if (!(typeof fn === 'function' || fn === null)) {
      throw new ReportError(ReportError.QUERY_BUILDER_IS_NOT_A_FUNCTION);
    }

    this.defaultQueryBuilder = fn;
  }

  /**
   * Перезаписать генераторы
   * @param {Generations} generators
   */
  setGenerators(generators) {
    checkAssingable(generators, ReportError.GENERATORS_IS_NOT_AN_OBJECT);

    this.generators = generators;
  }

  /**
   * Перезаписать фабрики запросов
   * @param {Queries} queries
   */
  setQueries(queries) {
    checkAssingable(queries, ReportError.QUERIES_IS_NOT_AN_OBJECT);

    this.queries = queries;
  }

  /**
   * Дополнить генераторы
   * @param {Generations} generators
   */
  assignGenerators(generators) {
    checkAssingable(generators, ReportError.GENERATORS_IS_NOT_AN_OBJECT);

    Object.assign(this.generators, generators);
  }

  /**
   * Дополнить фабрики запросов
   * @param {Queries} queries
   */
  assignQueries(queries) {
    checkAssingable(queries, ReportError.QUERIES_IS_NOT_AN_OBJECT);

    Object.assign(this.queries, queries);
  }

  /**
   * Прорерить, может ли report обработать такое имя модели или нет
   * @param  {String}  name
   * @return {Boolean}
   */
  is(name) {
    return !!(this.storage.models[name] && this.generators[name]);
  }

  _getModel(name) {
    const Model = this.storage.models[name];
    if (!Model) throw new ReportError(ReportError.MODEL_NOT_FOUND);
    return Model;
  }

  _getGenerator(name) {
    const Generator = this.generators[name];
    if (!Generator) throw new ReportError(ReportError.GENERATOR_NOT_FOUND);
    return Generator;
  }

  async _getData({ modelName, options }) {
    const Model = this._getModel(modelName);
    return Model.getReportData
      ? await Model.getReportData({ options })
      : null;
  }

  async _getQuery({ modelName, options }) {
    if (this.queries[modelName]) {
      return this.queries[modelName](options);
    }

    if (!this.defaultQueryBuilder) throw new ReportError(ReportError.DEFAULT_QUERY_BUILDER_IS_NULL);

    return this.defaultQueryBuilder(options);
  }

  async _getCursor(params) {
    const { modelName } = params;
    const Model = this._getModel(modelName);

    if (Model.getReportData) return null;

    const query = await this._getQuery(params);
    const cursor = Model.find(query).cursor();
    cursor.addCursorFlag('noCursorTimeout', true);

    return cursor;
  }

  async _getGeneratorPayload(params) {
    const { options = {} } = params;

    const [data, cursor] = await Promise.all([
      this._getData(params),
      this._getCursor(params)
    ]);

    return {
      data, cursor,
      app: this.app,
      options
    };
  }

  /**
   * Cформировать csv по существующей коллекции в базе и записать его в поток
   * @param  {Object}  params
   * @param  {Object}  params.stream — поток в который писать отчет
   * @param  {Object}  params.modelName — название модели по которой формируется статистика
   * @param  {Object}  params.options — опции для формирования запроса в базу данных
   * @param  {Boolean} params.bom — записывать bom заголовок в начале потока или нет
   *
   */
  async writeToStream(params) {
    const { modelName, stream, bom = true } = params;

    const Generator = this._getGenerator(modelName);
    const payload = await this._getGeneratorPayload(params);

    const generator = new Generator(payload);

    if (bom) writeBomToStream(stream);

    return generator.writeToStream(stream);
  }

  /**
   * @param {Object} extension — объект с новыми generators и queries
   */
  use(extension) {
    if (extension) {
      for (const [name, value] of Object.entries(extension)) {
        if (name === 'generators') {
          this.assignGenerators(value);
        }
        if (name === 'queries') {
          this.assignQueries(value);
        }
        if (name === 'defaultQueryBuilder') {
          this.setDefaultQueryBuilder(value);
        }
      }
    }
    super.use(extension);
  }

  async up(dependencies) {
    Object.assign(this, dependencies);
  }
}

Report.prototype.dependencies = Object.freeze(['storage']);
Report.Generator = Generator;

module.exports = Report;
