# rubik-report
Кубик для более-менее стандартных отчетов из коллекций mongoose

# Обратная несовместимость
Версия `2.x` отличается от `1.x`, и нужно мигрировать.

## Конструктор и расширения
1. `csvGenerators` → `generators`
2. `getSpecificQuery` → `queries`

## Генераторы отчетов
- Теперь в конструктор не приходит опция isDevStats, вместо этого прилетает весь объект `options`
- Вместо вызова `generateCsvString({ stream })` теперь будет вызыван `writeToStream(stream)`


## Запрос по умолчанию
Больше нет запроса по умолчанию.
Чтобы компенсировать его, теперь необходимо устанавливать функцию `defaultQueryBuilder`:
```js
report.setDefaultQueryBuilder(fn);
```

`fn` принимает на вход объект `options` — опции запроса статистики.

## Запись в поток
Нужно использовать другой метод: `writeCsvToStream` → `writeToStream`

## Втстроенная обработка HTTP
Больше нет встроенной мидлвары.
Вместо нее нужно использовать функцию `handle` из `rubik-report/kit/http.js`

Так же можно получить отдельные `setHeaders` и `extractFromRequest`
