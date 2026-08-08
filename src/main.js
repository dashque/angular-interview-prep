const tasks = [
  {
    id: 't1',
    title: 'Бог-компонент списка заказов',
    level: 'GRASP + SOLID',
    prompt:
      'Компонент сам ходит в 4 API, мапит DTO, считает canCancel, пишет в localStorage и рисует таблицу. Какие принципы нарушены и как разрезать?',
    answer:
      'SRP / High Cohesion: слишком много осей изменений. Controller расползся — UI смешал use-case. Information Expert нарушен (canCancel не у модели). Нет Indirection/ACL. Разрез: component → facade/store → api services → toOrder mapper; canCancel у Order/VM; persistence в отдельном storage adapter.',
  },
  {
    id: 't2',
    title: 'Три приложения, один Customer',
    level: 'DDD Strategic',
    prompt:
      'client-portal, partner-cabinet и ops-admin все импортируют shared Customer из libs/shared/domain. Почему это опасно и что делать?',
    answer:
      'Разные Bounded Contexts и разный ubiquitous language. Shared kernel раздувается и ломает все apps разом. Шарить ui-kit/auth; модели Customer держать per-app или тонкий ACL на границе. Общее — только genuinely стабильные VO (Money, Id), не «весь клиент».',
  },
  {
    id: 't3',
    title: 'Экран клеит 9 запросов',
    level: 'BFF',
    prompt:
      'Экран «Карточка заказа» делает waterfall из 9 HTTP к разным сервисам. Когда достаточно Angular facade, а когда нужен BFF?',
    answer:
      'Facade ок, если запросов мало, данные простые, нет чувствительной склейки на клиенте. BFF нужен при тяжёлой агрегации, разных контрактах web/mobile, скрытии внутренних API, sync поверх async, защите UI от частых ломок микросервисов (Protected Variations).',
  },
  {
    id: 't4',
    title: 'Стенды и if (environment)',
    level: 'DIP',
    prompt:
      'По коду размазано if (environment.name === "stage2"). Как переписать через Angular DI?',
    answer:
      'Вынести различия в InjectionToken / providers: API_BASE_URL, AuthAdapter, FeatureFlags. environment*.ts только собирает provide-конфиг. Компоненты и facade зависят от абстракций, не от имени стенда.',
  },
  {
    id: 't5',
    title: 'Подняли tag API',
    level: 'Версионирование',
    prompt:
      'Пакет @company/orders-api был 1.4.2, стал 2.0.0. Поле status_code удалили, добавили status: string. Что проверить до деплоя на stage?',
    answer:
      'MAJOR = breaking. Diff OpenAPI/changelog, обновить клиент и ACL mapper, прогнать типы/тесты, убедиться что stage крутит совместимый бэкенд 2.x. Не выкатывать фронт 2.x на стенд с API 1.x. План отката или временный dual-support если нужно.',
  },
  {
    id: 't6',
    title: 'Где Protected Variations?',
    level: 'GRASP',
    prompt:
      'Назови 3 нестабильные зоны в multi-API Angular-проекте и чем их изолировать.',
    answer:
      'Нестабильно: контракты микросервисов, URL/стенды, форматы ошибок/auth. Изоляция: BFF или стабильный client package по тегу, ACL mapper DTO→VM, environments + DI tokens, единый ErrorMapper/interceptor.',
  },
];

const challenges = [
  {
    id: 'c1',
    title: 'ACL mapper: OrderDto → Order',
    blurb:
      'Напиши функцию toOrder(dto), которая мапит грязный контракт бэка в чистую модель. status_code: 1→"new", 2→"paid", 3→"cancelled", иначе "unknown".',
    starter: `function toOrder(dto) {
  // dto: { order_id: string, status_code: number, total_cents: number }
  // return: { id, status, total }
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
    throw new Error('Fail for ' + JSON.stringify(input) + ' → ' + JSON.stringify(got));
  }
}
'OK: ACL mapper'`,
  },
  {
    id: 'c2',
    title: 'Information Expert: canCancel',
    blurb:
      'Правило: отменить можно только status === "new" и createdAt не старше 30 минут от now. Реализуй canCancel(order, now).',
    starter: `function canCancel(order, now) {
  // order: { status: string, createdAt: number } // epoch ms
  // now: number
}`,
    hiddenTests: `
const now = 1_700_000_000_000;
const ok = canCancel({ status: 'new', createdAt: now - 10 * 60 * 1000 }, now);
const old = canCancel({ status: 'new', createdAt: now - 31 * 60 * 1000 }, now);
const paid = canCancel({ status: 'paid', createdAt: now - 5 * 60 * 1000 }, now);
if (ok !== true) throw new Error('expected true for fresh new');
if (old !== false) throw new Error('expected false for old');
if (paid !== false) throw new Error('expected false for paid');
'OK: canCancel'`,
  },
  {
    id: 'c3',
    title: 'SemVer bump',
    blurb:
      'Функция nextVersion(current, change) где change: "breaking" | "feature" | "fix". Верни новую semver-строку.',
    starter: `function nextVersion(current, change) {
  // current like "1.4.2"
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
  if (got !== exp) throw new Error(cur + ' + ' + ch + ' => ' + got + ' (want ' + exp + ')');
}
'OK: semver'`,
  },
  {
    id: 'c4',
    title: 'Low Coupling: выбрать слой',
    blurb:
      'classify(callSite) → "ui" | "facade" | "acl" | "api". Правила: template event → ui; оркестр нескольких API → facade; dto→vm → acl; raw HttpClient URL → api.',
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
  if (got !== v) throw new Error(k + ' => ' + got + ' (want ' + v + ')');
}
'OK: classify'`,
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
          <textarea class="code" spellcheck="false" aria-label="Решение ${c.title}">${c.starter}</textarea>
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
