const MAX_DOCUMENTS_QTY_IN_ARRAY = 100;
const MAX_DOCUMENTS_QTY_IN_CURSOR = 1000;
const MAX_DOCUMENTS_QTY_FOR_USE_ARRAY = 1000

/** Класс для удобного обхода больших коллекций в монге.
 * Должен помочь избежать забивания оперативки и в то же время не дать
 * монговскому курсору умереть
 */
class MongoDbCursor {
  /**
   * Создает экземпляр
   * @param {Object} Model Монгусовская модель
   * @param {Object} query Запрос для выборки из модели
   */
  constructor({ Model, query, direction }) {
    if (direction !== 1 && direction !== -1) direction = -1
    if (!query) query = {};

    this.Model = Model;
    this.query = query;
    this.sort = { _id: direction };

    this._nextOperator = direction < 0 ? '$lt' : '$gt'
    this._useCursor = false;
    this._inited = false;
    this._cursor = null;
    this._lastDoc = null;
    this._array = [];
    this._totalQty = 0;

    if (query.limit || query.skip) {
      console.info('Использование limit или skip требует допила соответствующего функционала');
    }
  }

  /**
   * Отдает следующий документ
   * @return {Promise<Object>} Резолвит монгусовский документ
   */
  async next() {
    if (!this._inited) await this._init();

    let doc = await this._getDoc();
    if (doc) return this._lastDoc = doc;
    if (!this._lastDoc) return null;

    this.query._id = { [this._nextOperator]: this._lastDoc._id };
    await this._setContentObject();

    doc = await this._getDoc();
    return this._lastDoc = doc;
  }


  /**
   * Принимает решение использовать ли курсор.
   * Устанавливает начальный курсор или массив.
   * @return {undefined}
   */
  async _init() {
    this._totalQty = await this.Model.find(this.query).count();
    if (this._totalQty > MAX_DOCUMENTS_QTY_FOR_USE_ARRAY) this._useCursor = true;
    await this._setContentObject();
    this._inited = true;
  }

  /**
   * Устанавливает начальный курсор или массив.
   * @return {Object} Возвращает курсор или массив.
   */
  _setContentObject() {
    if (this._useCursor) {
      return this._setCursor();
    } else {
      return this._setArray();
    }
  }

  /**
   * Устанавливает курсор
   * @return {Promise}
   */
  async _setCursor() {
    this._cursor = await this.Model
      .find(this.query)
      .sort(this.sort)
      .limit(MAX_DOCUMENTS_QTY_IN_CURSOR)
      .cursor();
  }

  /**
   * Устанавливает массив
   * @return {Promise}
   */
  async _setArray() {
    this._array = await this.Model
      .find(this.query)
      .sort(this.sort)
      .limit(MAX_DOCUMENTS_QTY_IN_ARRAY)
      .exec();
  }

  /**
   * Получает документ из курсора или массива.
   * @return {Promise} Резолвит монгусовский документ.
   */
  async _getDoc () {
    if (this._useCursor) {
      return await this._cursor.next();
    } else {
      return this._array.shift();
    }
  }
}

module.exports = MongoDbCursor;
