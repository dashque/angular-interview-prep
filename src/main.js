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
      'Реализуйте правило рядом с данными заказа. Функция canCancel(order, now) должна возвращать true только если status равен "new" и заказ создан не раньше чем 30 минут назад относительно now.',
    starter: `function canCancel(order, now) {
  // order: { status: string, createdAt: number } // epoch в миллисекундах
  // now: number
}`,
    hiddenTests: `
const now = 1_700_000_000_000;
const ok = canCancel({ status: 'new', createdAt: now - 10 * 60 * 1000 }, now);
const old = canCancel({ status: 'new', createdAt: now - 31 * 60 * 1000 }, now);
const paid = canCancel({ status: 'paid', createdAt: now - 5 * 60 * 1000 }, now);
if (ok !== true) throw new Error('Ожидался true для свежего заказа со статусом new');
if (old !== false) throw new Error('Ожидался false для слишком старого заказа');
if (paid !== false) throw new Error('Ожидался false для оплаченного заказа');
'Отлично: canCancel работает'`,
  },
  {
    id: 'c3',
    title: 'Подъём версии по SemVer',
    blurb:
      'Напишите функцию nextVersion(current, change). Параметр change может быть "breaking", "feature" или "fix". Функция должна вернуть новую semver-строку по правилам MAJOR / MINOR / PATCH.',
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
    title: 'Low Coupling: выбрать слой',
    blurb:
      'Напишите функцию classify(callSite), которая по месту вызова подсказывает слой. Правила: click-handler → ui, load-order-screen → facade, map-dto → acl, http-get → api.',
    starter: `function classify(callSite) {
  // callSite: 'click-handler' | 'load-order-screen' | 'map-dto' | 'http-get'
}`,
    hiddenTests: `
const map = {
  'click-handler': 'ui',
  'load-order-screen': 'facade',
  'map-dto': 'acl',
  'http-get': 'api',
};
for (const [k, v] of Object.entries(map)) {
  const got = classify(k);
  if (got !== v) throw new Error(k + ' дало ' + got + ', а нужно ' + v);
}
'Отлично: слои разложены верно'`,
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
