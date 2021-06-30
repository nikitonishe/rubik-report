/* global describe test expect jest */
const { Kubik } = require('rubik-main');
const { createApp, createKubik } = require('rubik-main/tests/helpers/creators.js');

const Report = require('../');

const init = (options) => {
  const app = createApp();
  const storage = createKubik(null, app, 'storage');
  storage.models = {};
  storage.up = jest.fn();
  const report = new Report(options);
  app.add(report);

  return { app, report, storage };
};

class Fake extends Report.Generator {
  static cb(cb = null) {
    Fake.prototype.writeToStream = function(...args) {
      cb(...args, this);
    };
  }
}

const testNotImplemented = () => {
  throw new Error('Нужно написать этот тест');
};

describe('Report kubik', () => {
  test('создается без проблем', () => {
    const { report } = init();
    expect(report).toBeInstanceOf(Report);
    expect(report).toBeInstanceOf(Kubik);
  });

  test('создается и записывает опции', () => {
    const generators = { hello: 'world' };
    const queries = { Test() {} };
    const defaultQueryBuilder = jest.fn();

    const { report } = init({ generators, queries, defaultQueryBuilder });

    expect(report.generators).toEqual(generators);
    expect(report.queries).toEqual(queries);
    expect(report.defaultQueryBuilder).toBe(defaultQueryBuilder);
  });

  test('.is -> true на имена моделей которые может обработать', async () => {
    const { report, storage } = init({ generators: { Test() {} } });
    storage.models.Test = jest.fn();

    report.up({ storage });

    expect(report.is('Test')).toBe(true);
  });

  test('.is -> false на имена моделей которые не может обработать', async () => {
    const { report, storage } = init();

    report.up({ storage });

    expect(report.is('Test')).toBe(false);
  });

  test('поддерживает расширения через .use', () => {
    const generators = { hello: 'world' };
    const queries = { Test() {} };
    const defaultQueryBuilder = jest.fn();

    const { report } = init();

    report.use({ generators, queries, defaultQueryBuilder });

    expect(report.generators).toEqual(generators);
    expect(report.queries).toEqual(queries);
    expect(report.defaultQueryBuilder).toBe(defaultQueryBuilder);
  });

  test('поднимается без ошибок', async () => {
    const { app, storage } = init();
    await app.up();
    expect(app.report).toBeDefined();
    expect(app.report.storage).toBeDefined();
    expect(app.report.storage).toBe(storage);
    await app.down();
  });

  test('пишет в поток через метод модели .getReportData если он есть', async () => {
    const { storage, report } = init({ generators: { Fake } });
    const fakeOptions = { from: new Date(), to: new Date() };
    const fakeData = [{ hello: 'world' }];
    const fakeStream = { __proto__: null, write: jest.fn() };
    const writeToStream = jest.fn((stream, fakeGenerator) => {
      expect(stream).toBe(fakeStream);
      expect(fakeGenerator.data).toBeDefined();
      expect(fakeGenerator.data).toEqual(fakeData);
    });
    const getReportData = jest.fn(({ options }) => {
      expect(options).toEqual(fakeOptions);

      return fakeData.concat([]);
    });
    Fake.cb(writeToStream);

    storage.models.Fake = { getReportData };

    await report.up({ storage });

    await report.writeToStream({
      stream: fakeStream,
      modelName: 'Fake',
      options: fakeOptions
    });

    expect(writeToStream).toHaveBeenCalled();
    expect(getReportData).toHaveBeenCalled();
  });

  test('пишет в поток BOM', testNotImplemented);

  test('не пишет в поток BOM, если его выключить', testNotImplemented);

  test('пишет в поток данные курсора', testNotImplemented);

  test('использует фабрики запросов', testNotImplemented);

  test('использует фабрику запросов по умолнчанию', testNotImplemented);
});
