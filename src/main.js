const tasks = [
  {
    id: 't1',
    title: 'Бог-компонент списка заказов',
    level: 'GRASP + SOLID',
    prompt:
      'Компонент списка заказов сам ходит в четыре API, сам превращает DTO в строки таблицы, сам считает canCancel, сам пишет фильтр в localStorage и сам рисует UI. Какие принципы здесь нарушены и как аккуратно разрезать ответственность?',
    answer:
      'Здесь сразу несколько проблем. По SRP и High Cohesion у компонента слишком много причин меняться: и верстка, и контракты API, и бизнес-правило отмены, и браузерное хранилище. По GRASP Controller расползся — UI-вход смешался с use-case сценарием. Information Expert тоже нарушен: правило canCancel живёт не рядом с данными заказа, а внутри компонента. Indirection и ACL почти отсутствуют: сырой транспорт и сырой DTO протекают прямо в UI. Нормальный разрез выглядит так: компонент оставляет себе шаблон и события; facade или store координирует сценарий; отдельные API-сервисы ходят в сеть; mapper toOrder переводит DTO в модель экрана; canCancel живёт у Order или OrderVm; запись в localStorage уходит в маленький storage-адаптер.',
  },
  {
    id: 't2',
    title: 'Три приложения и один общий Customer',
    level: 'DDD Strategic',
    prompt:
      'В monorepo есть client-portal, partner-cabinet и ops-admin. Все три приложения импортируют один и тот же тип Customer из libs/shared/domain. Почему это опасно и что делать вместо этого?',
    answer:
      'Скорее всего перед вами три разных Bounded Contexts с разным ubiquitous language. Слово «клиент» в портале покупателя, в кабинете партнёра и в операционной админке обычно означает разные вещи и тянет за собой разные инварианты. Если насильно держать одну shared-модель, получается раздутый Shared Kernel: любое изменение ломает все приложения сразу. Правильнее шарить ui-kit, логирование и, осторожно, инфраструктуру auth. Модели Customer лучше держать рядом с каждым приложением или переводить через тонкий ACL на границе. В shared имеет смысл оставлять только действительно стабильные и почти бессмысленные в бизнес-смысле штуки вроде Money или Id, а не «всего клиента целиком».',
  },
  {
    id: 't3',
    title: 'Экран собирает девять запросов',
    level: 'BFF',
    prompt:
      'Экран «Карточка заказа» последовательно ходит в девять разных HTTP-сервисов из Angular. Когда достаточно facade в приложении, а когда уже пора делать BFF?',
    answer:
      'По определению Microsoft и Sam Newman, BFF — это отдельный backend под конкретный frontend interface, когда общий API становится неудобным узким местом. Если запросов мало, ответы простые, а склейка не критична, Angular facade вполне может оркестрировать один-три вызова. BFF становится уместным, когда нужна тяжёлая агрегация под экран, когда client-приложение и admin-приложение хотят разный shape данных, либо когда UI нужно изолировать от частых MAJOR-изменений микросервисов. Это как раз Protected Variations на границе. При этом сквозные вещи вроде периметра авторизации лучше оставлять gateway, а BFF не превращать во второй доменный монолит.',
  },
  {
    id: 't4',
    title: 'Стенды и проверка environment.name',
    level: 'DIP',
    prompt:
      'По коду приложения размазаны проверки вроде if (environment.name === "stage2"). Как переписать это через Angular DI так, чтобы компоненты не знали имя стенда?',
    answer:
      'Различия стендов нужно выразить как разные значения и реализации зависимостей, а не как знание имени стенда внутри бизнес-кода. Заведите InjectionToken для API_BASE_URL, для AuthAdapter, для FeatureFlags и подобных портов. Файлы environment или app config только собирают набор providers. Тогда facade и компоненты зависят от абстракций: они всегда получают нужный base URL или нужной адаптер, но нигде не читают строку stage2. Это прямое применение Dependency Inversion и одновременно Protected Variations вокруг нестабильной конфигурации стендов.',
  },
  {
    id: 't5',
    title: 'Подняли major-тег API',
    level: 'Версионирование',
    prompt:
      'Пакет @company/orders-api был версии 1.4.2, а стал 2.0.0. Поле status_code удалили и добавили status: string. Что именно проверить до выкладки фронтенда на stage?',
    answer:
      'По SemVer переход на 2.0.0 означает несовместимое изменение публичного API. Сначала смотрите changelog или diff OpenAPI и понимаете полный список ломающих изменений, а не только одно поле. Затем обновляете клиент и ACL-маппер, прогоняете типы и тесты. Отдельно проверяете, что на stage уже крутится совместимый бэкенд линейки 2.x. Фронтенд, собранный под контракт 2.x, нельзя выкатывать на стенд с API 1.x. Если нужен переходный период, заранее продумываете dual-support в маппере, versioned endpoint или согласованное окно совместного релиза и план отката.',
  },
  {
    id: 't6',
    title: 'Где здесь Protected Variations?',
    level: 'GRASP',
    prompt:
      'Назовите как минимум три нестабильные зоны в Angular-проекте с многими API и стендами и объясните, чем каждую из них можно изолировать.',
    answer:
      'Первая нестабильная зона — контракты микросервисов. Их изолируют BFF или пакет клиента с зафиксированным тегом плюс ACL-маппер из DTO в локальную модель. Вторая зона — URL и различия стендов. Их изолируют environment-конфигурация и InjectionToken с разными providers, без ветвления по имени стенда в UI. Третья зона — форматы ошибок и детали auth. Их изолируют общий ErrorMapper и HTTP interceptor, чтобы feature-код работал с предсказуемой моделью ошибки, а не с десятью разными shape ответов. Именно это и есть Protected Variations: нестабильное снаружи, стабильная точка контакта внутри.',
  },
  {
    id: 't7',
    title: 'Придумать правило команды с нуля',
    level: 'Мотивация → своё правило',
    prompt:
      'В команде каждый второй баг на stage связан с тем, что фронт уже обновил API-клиент, а сервис на стенде ещё старый. Сформулируйте командное правило и объясните, какую известную идею оно повторяет.',
    answer:
      'Сначала боль: рассинхрон версий клиента и сервиса на стенде. Правило может звучать так: «PR с MAJOR/MINOR обновлением API-зависимости обязан содержать lockfile, правку мапперов и отметку совместимой версии сервиса на целевом стенде; без этого merge запрещён». Это локальная форма SemVer-дисциплины плюс Protected Variations: контракт обновляют осознанно и проверяют совместимость до выкладки. На интервью важно показать цепочку „симптом → шов → проверяемое правило“, а не просто сказать „надо версионировать“.',
  },
  {
    id: 't8',
    title: 'Зачем нужен шов, если „и так работает“',
    level: 'Мотивация',
    prompt:
      'Коллега говорит: «Зачем facade, mapper и токены? Сейчас компонент ходит в HttpClient и всё быстро делается». Как ответить через мотивацию принципов, а не через вкус?',
    answer:
      'Сейчас быстро — потому что система ещё маленькая или изменение ещё одно. Принципы появляются, когда начинают повторяться дорогие симптомы: правка API ломает UI, новый стенд требует правок в компонентах, правило canCancel копируется и расходится, добавить способ оплаты страшно. Facade, mapper и InjectionToken — это швы, которые локализуют будущие изменения. Можно ответить так: мы платим небольшую структуру сейчас, чтобы следующее изменение контракта, стенда или правила не превращалось в переписывание экрана целиком.',
  },
  {
    id: 't9',
    title: 'Один Bounded Context или два',
    level: 'DDD Strategic',
    prompt:
      'В client-portal слово «заказ» означает покупку с оплатой и доставкой, а в ops-admin «заказ» — это тикет поддержки с внутренними статусами и SLA. Продакт предлагает сделать один общий модуль Order на оба приложения. Как аргументировать решение через DDD?',
    answer:
      'Ключевой признак — расхождение ubiquitous language: одно слово, но разные инварианты, разные статусы и разные правила. Это сигнал двух разных Bounded Contexts, а не одной модели. Общий модуль Order здесь стал бы Shared Kernel, который придётся согласовывать обеим командам при каждом изменении, и он быстро оброс бы флагами «только для админки» и «только для портала». Правильнее завести две отдельные модели рядом со своими приложениями, а на стыке с API поставить ACL-мапперы. Если между контекстами всё же есть общее понятие (например, идентификатор заказа или Money), его можно оформить как маленький стабильный shared-элемент, но не «весь заказ целиком». На интервью стоит явно назвать: разные языки → разные контексты → отдельные модели плюс перевод на границе.',
  },
  {
    id: 't10',
    title: 'Один BFF на web и mobile или два',
    level: 'BFF',
    prompt:
      'У продукта есть Angular web-приложение и мобильный клиент. Web показывает большую таблицу с множеством полей, mobile — компактные карточки и экономит трафик. Сейчас оба ходят в один общий API. Что предложить и какие компромиссы назвать?',
    answer:
      'Это классический сценарий, ради которого BFF и придумали: у клиентов разные потребности к shape и объёму данных. Разумно предложить по BFF на интерфейс — web-BFF отдаёт богатый ответ и агрегирует нужные web-таблице поля, mobile-BFF отдаёт компактный payload и меньше round-trip’ов. Обязательно назвать компромиссы, о которых прямо предупреждает Microsoft: появится дублирование кода между двумя BFF, добавится ещё один сетевой hop и, соответственно, инфраструктура и её сопровождение. Сквозные вещи — авторизацию, rate limiting, маршрутизацию — лучше держать в общем gateway, а не копировать в каждый BFF. Если бы web и mobile ходили почти одинаково, отдельные BFF были бы избыточны и хватило бы одного общего слоя.',
  },
];

const challenges = [
  {
    id: 'c1',
    title: 'ACL-маппер: OrderDto → Order',
    blurb:
      'Напишите функцию toOrder(dto), которая переводит сырой контракт бэкенда в локальную модель приложения. Поле status_code нужно отобразить так: 1 → "new", 2 → "paid", 3 → "cancelled", любое другое значение → "unknown".',
    starter: `function toOrder(dto) {
  // dto: { order_id: string, status_code: number, total_cents: number }
  // вернуть: { id, status, total }
}`,
    hiddenTests: `
const cases = [
  [{ order_id: 'A1', status_code: 1, total_cents: 1500 }, { id: 'A1', status: 'new', total: 1500 }],
  [{ order_id: 'B2', status_code: 2, total_cents: 0 }, { id: 'B2', status: 'paid', total: 0 }],
  [{ order_id: 'C3', status_code: 3, total_cents: 99 }, { id: 'C3', status: 'cancelled', total: 99 }],
  [{ order_id: 'D4', status_code: 9, total_cents: 10 }, { id: 'D4', status: 'unknown', total: 10 }],
];
for (const [input, expected] of cases) {
  const got = toOrder(input);
  if (!got || got.id !== expected.id || got.status !== expected.status || got.total !== expected.total) {
    throw new Error('Неверно для ' + JSON.stringify(input) + ' → ' + JSON.stringify(got));
  }
}
'Отлично: ACL-маппер работает'`,
  },
  {
    id: 'c2',
    title: 'Information Expert: canCancel',
    blurb:
      'Реализуйте правило рядом с данными заказа. Функция canCancel(order, now) должна возвращать true только если status равен "new" и возраст заказа не превышает 30 минут включительно (то есть ровно 30 минут — ещё можно, 30 минут и одна миллисекунда — уже нельзя).',
    starter: `function canCancel(order, now) {
  // order: { status: string, createdAt: number } // epoch в миллисекундах
  // now: number
}`,
    hiddenTests: `
const now = 1_700_000_000_000;
const min = 60 * 1000;
const fresh = canCancel({ status: 'new', createdAt: now - 10 * min }, now);
const exactly30 = canCancel({ status: 'new', createdAt: now - 30 * min }, now);
const justOver = canCancel({ status: 'new', createdAt: now - 30 * min - 1 }, now);
const old = canCancel({ status: 'new', createdAt: now - 31 * min }, now);
const paid = canCancel({ status: 'paid', createdAt: now - 5 * min }, now);
if (fresh !== true) throw new Error('Ожидался true для свежего заказа со статусом new');
if (exactly30 !== true) throw new Error('Ровно 30 минут — граница включительно, ожидался true');
if (justOver !== false) throw new Error('30 минут и 1 мс — уже нельзя, ожидался false');
if (old !== false) throw new Error('Ожидался false для слишком старого заказа');
if (paid !== false) throw new Error('Ожидался false для оплаченного заказа');
'Отлично: canCancel работает, граница учтена'`,
  },
  {
    id: 'c3',
    title: 'Подъём версии по SemVer',
    blurb:
      'Напишите функцию nextVersion(current, change). Параметр change может быть "breaking", "feature" или "fix". Верните новую semver-строку по правилам MAJOR / MINOR / PATCH. Для простоты зону 0.x трактуем механически: feature всегда поднимает minor, breaking — major (специальное правило «в 0.x всё нестабильно» здесь игнорируем).',
    starter: `function nextVersion(current, change) {
  // current выглядит как "1.4.2"
}`,
    hiddenTests: `
const pairs = [
  ['1.4.2', 'fix', '1.4.3'],
  ['1.4.2', 'feature', '1.5.0'],
  ['1.4.2', 'breaking', '2.0.0'],
  ['0.9.9', 'feature', '0.10.0'],
  ['2.0.0', 'fix', '2.0.1'],
];
for (const [cur, ch, exp] of pairs) {
  const got = nextVersion(cur, ch);
  if (got !== exp) throw new Error(cur + ' + ' + ch + ' дало ' + got + ', а нужно ' + exp);
}
'Отлично: SemVer считается верно'`,
  },
  {
    id: 'c4',
    title: 'Куда положить вызов: определить слой',
    blurb:
      'Напишите функцию classify(action), которая по описанию действия возвращает подходящий слой. Правила: действие, начинающееся с "render"/"on" → "ui"; с "orchestrate"/"loadScreen" → "facade"; с "map"/"toVm" → "acl"; с "http"/"fetch" → "api". Если действие не подходит ни под одно правило — выбросьте Error с текстом "unknown layer".',
    starter: `function classify(action) {
  // примеры: 'onSubmit', 'orchestrateCheckout', 'mapOrderDto', 'httpGetOrders'
  // вернуть: 'ui' | 'facade' | 'acl' | 'api' либо бросить Error('unknown layer')
}`,
    hiddenTests: `
const ok = [
  ['onSubmit', 'ui'],
  ['renderRow', 'ui'],
  ['orchestrateCheckout', 'facade'],
  ['loadScreenData', 'facade'],
  ['mapOrderDto', 'acl'],
  ['toVmOrder', 'acl'],
  ['httpGetOrders', 'api'],
  ['fetchProfile', 'api'],
];
for (const [action, layer] of ok) {
  const got = classify(action);
  if (got !== layer) throw new Error(action + ' дало ' + got + ', а нужно ' + layer);
}
let threw = false;
try { classify('deleteEverything'); } catch (e) { threw = e.message === 'unknown layer'; }
if (!threw) throw new Error('Для неизвестного действия ожидался Error("unknown layer")');
'Отлично: слои определяются, неизвестное отсекается'`,
  },
  {
    id: 'c5',
    title: 'DDD: что можно шарить между контекстами',
    blurb:
      'Напишите функцию isSafeToShare(kind), которая решает, можно ли выносить артефакт в общую библиотеку для нескольких Bounded Contexts. Инфраструктура и UI шарятся ("ui-kit", "logger", "http-interceptor", "money-vo" → true), а доменные модели — нет ("order-model", "customer-model", "pricing-rules" → false). Незнакомый kind — консервативно false.',
    starter: `function isSafeToShare(kind) {
  // вернуть true только для действительно нейтральных артефактов
}`,
    hiddenTests: `
const shareable = ['ui-kit', 'logger', 'http-interceptor', 'money-vo'];
const contextBound = ['order-model', 'customer-model', 'pricing-rules'];
for (const k of shareable) {
  if (isSafeToShare(k) !== true) throw new Error(k + ' должно быть безопасно шарить (true)');
}
for (const k of contextBound) {
  if (isSafeToShare(k) !== false) throw new Error(k + ' привязано к контексту, ожидался false');
}
if (isSafeToShare('something-unknown') !== false) {
  throw new Error('Незнакомый артефакт по умолчанию не шарим (ожидался false)');
}
'Отлично: граница контекста соблюдена'`,
  },
  {
    id: 'c6',
    title: 'BFF: собрать view-model экрана',
    blurb:
      'Смоделируйте агрегацию, которую в реальности делал бы BFF. Функция buildOrderCard(profile, order, payments) должна собрать один объект под экран: { customerName, orderId, status, paidTotal }. Имя — из profile.name; orderId и status — из order; paidTotal — сумма amount по всем платежам со статусом "captured" (остальные игнорируются).',
    starter: `function buildOrderCard(profile, order, payments) {
  // profile: { name: string }
  // order: { id: string, status: string }
  // payments: Array<{ amount: number, status: string }>
  // вернуть: { customerName, orderId, status, paidTotal }
}`,
    hiddenTests: `
const card = buildOrderCard(
  { name: 'Дарья' },
  { id: 'O-100', status: 'paid' },
  [
    { amount: 500, status: 'captured' },
    { amount: 300, status: 'pending' },
    { amount: 200, status: 'captured' },
  ],
);
if (card.customerName !== 'Дарья') throw new Error('customerName должен браться из profile.name');
if (card.orderId !== 'O-100') throw new Error('orderId должен браться из order.id');
if (card.status !== 'paid') throw new Error('status должен браться из order.status');
if (card.paidTotal !== 700) throw new Error('paidTotal должен суммировать только captured (ожидалось 700, получено ' + card.paidTotal + ')');

const empty = buildOrderCard({ name: 'X' }, { id: 'O-1', status: 'new' }, []);
if (empty.paidTotal !== 0) throw new Error('Без captured-платежей paidTotal должен быть 0');
'Отлично: агрегация под экран собрана'`,
  },
];

function renderTasks() {
  const root = document.getElementById('task-list');
  root.innerHTML = tasks
    .map(
      (t, i) => `
      <article class="task">
        <div class="task__head">
          <h3>${i + 1}. ${t.title}</h3>
          <span class="badge">${t.level}</span>
        </div>
        <div class="task__body">
          <p class="prompt">${t.prompt}</p>
          <details>
            <summary>Показать разбор</summary>
            <div class="answer">${t.answer}</div>
          </details>
        </div>
      </article>`,
    )
    .join('');
}

function renderChallenges() {
  const root = document.getElementById('coding-list');
  root.innerHTML = challenges
    .map(
      (c, i) => `
      <article class="challenge" data-id="${c.id}">
        <div class="challenge__head">
          <h3>${i + 1}. ${c.title}</h3>
          <span class="badge">coding</span>
        </div>
        <div class="challenge__body">
          <p class="prompt">${c.blurb}</p>
          <textarea class="code" spellcheck="false" aria-label="Решение: ${c.title}">${c.starter}</textarea>
          <div class="actions">
            <button type="button" data-run="${c.id}">Проверить</button>
            <button type="button" class="secondary" data-reset="${c.id}">Сбросить</button>
          </div>
          <div class="result" hidden data-result="${c.id}"></div>
        </div>
      </article>`,
    )
    .join('');

  root.addEventListener('click', (e) => {
    const runId = e.target.getAttribute?.('data-run');
    const resetId = e.target.getAttribute?.('data-reset');
    if (runId) runChallenge(runId);
    if (resetId) resetChallenge(resetId);
  });
}

function resetChallenge(id) {
  const challenge = challenges.find((c) => c.id === id);
  const article = document.querySelector(`.challenge[data-id="${id}"]`);
  article.querySelector('textarea').value = challenge.starter;
  const result = article.querySelector(`[data-result="${id}"]`);
  result.hidden = true;
  result.textContent = '';
  result.className = 'result';
}

function runChallenge(id) {
  const challenge = challenges.find((c) => c.id === id);
  const article = document.querySelector(`.challenge[data-id="${id}"]`);
  const code = article.querySelector('textarea').value;
  const result = article.querySelector(`[data-result="${id}"]`);
  result.hidden = false;

  try {
    const fn = new Function(`${code}\n; return (() => { ${challenge.hiddenTests} })();`);
    const message = fn();
    result.className = 'result ok';
    result.textContent = String(message);
  } catch (err) {
    result.className = 'result fail';
    result.textContent = err.message || String(err);
  }
}

renderTasks();
renderChallenges();
