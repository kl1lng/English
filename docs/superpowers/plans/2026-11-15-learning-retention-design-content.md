# Обучение, возвращаемость, дизайн и контент: план реализации

> **Статус на 2026-11-15:** задачи 1–20, 22, 24 (кроме шага 3), 25 (только валидатор и план курса), 26 выполнены в ветке `feature/learning-design`; задача 17 — документ спайка без замеров; задачи 21 и 23 и авторская часть 24–25 не начаты (ждут вас). Миграция 007 написана, но не применена.

> **Для исполнителя:** используйте `superpowers:executing-plans` (в этой сессии) или `superpowers:subagent-driven-development`. Шаги с чекбоксами `- [ ]`. Работать в отдельной ветке `feature/learning-design`, коммит после каждой задачи.

**Цель:** сделать приложение удобнее для ежедневной учёбы (адаптивная практика, разбор ошибок, трудные слова), чаще возвращать людей (недельные итоги и цели, PWA), довести дизайн до системного уровня (токены, тёмная тема, состояния, доступность) и расширить контент (аудио, переводы, фото, второй курс, больше диалогов).

**Архитектура:** все новые правила считаются в чистых функциях `src/lib/*` с тестами Vitest. Новые данные хранятся в отдельных таблицах Supabase (миграции `007+`, только с добавлением, политики через `drop policy if exists` перед `create policy`). Интерфейс не раздувает `main.jsx`: сначала он делится на файлы (задача 4), потом на токенах строятся тема и новые экраны.

**Стек:** React 19, Vite 7, Supabase (supabase-js), Vitest, `ts-fsrs`, lucide-react. Новые зависимости только через навык `vet-before-install`.

**Основание:** предложения из чата 2026-11-15 (пункты 2–5), `PROJECT_MAP.md`, предыдущий план `2026-11-14-engagement-and-ai-speaking.md` (его фазы 0–4 выполнены). **Не входит:** безопасность и надёжность (пункт 1) и рост проекта (пункт 6). Их берём, когда всё остальное закончено.

## Что проверено по коду перед планом

| Факт | Значение |
|---|---|
| Слова без аудио (файл есть, но назван иначе) | 14: `capital`, `landmark`, `modern`, `rapidly-developing`, `impressive` (суффикс `-2day`), `surrounded`, `mountainous`, `vibrant`, `atmosphere`, `attraction`, `former-capital` (суффикс `-3day`), `civilisation` (файл `civilization`), `ingredient` (файл `ingredients`), `archaeological` (файл `archeological`). Сейчас для них читает голос браузера |
| Лишние аудиофайлы | 16 дублей и вариантов написания, новых слов среди них нет. Слова `crystal-clear` и `symbolise` из `PROJECT_MAP.md` на самом деле есть в уроках 12 и 23, этот пункт карты устарел |
| `src/styles.css` | 3724 строки, 509 hex-цветов, 154 объявления `font-size` до 11 px, ни одного `prefers-color-scheme` и `data-theme` |
| `src/main.jsx` | ~2400 строк: `App` (стр. 145–1050), `Dashboard`, `Journey`, `Certificate`, `AuthModal`, `LessonModal` (~540 строк), `ChatPanel` |
| Фото уроков | 30 ссылок на Unsplash в `lessons[i].photo`, подгружаются с внешнего сайта (`main.jsx` стр. ~1266, 1339, 1986) |
| Грамматика | ~36 разных тегов в `grammarFocus` (present simple, passive, conditionals и т. д.) |
| Ошибки | `feedback.grammarCorrections` (оригинал и исправление) уже хранится в каждой попытке; итог диалога тоже возвращает исправления |
| Число 30 | зашито в нескольких местах интерфейса (прогресс, сертификат, подписи) |

## Глобальные ограничения

- Аудитория: взрослые, уровень B1–B2. Никаких школьных, детских и «учительских» формулировок.
- Оценку произношения, баллы IELTS и «процент беглости» не делаем. Самопроверка (послушать себя) допустима, ИИ-оценка нет.
- Аудио не сохраняем и не отправляем, кроме разовой обработки Whisper как сейчас. Запись в «Say it» остаётся только в браузере.
- Цвета только через CSS-переменные (токены), без новых hex в компонентах. Иконки из `lucide-react`, без эмодзи вместо иконок.
- Контраст текста ≥ 4.5:1, цели нажатия ≥ 44 px, видимый фокус, анимации только `transform`/`opacity` и с `prefers-reduced-motion`.
- Миграции: только добавление, повторный запуск безопасен (`if not exists`, `drop policy if exists` перед `create policy`). Применять только по вашей просьбе или явному разрешению.
- Не пушить, не деплоить и не удалять данные без вашего слова. Значения из `.env` не показывать. Ключи в формы вводите вы.
- Новые зависимости: сначала `vet-before-install`, потом установка.
- «Готово» только после: `npm test`, `npm run build`, проверка в браузере (`preview_start`) на 390 px и ~1440 px, консоль без ошибок.

## Review Focus (что легко сломается и не очевидно из задач)

1. **Пустые состояния.** Пользователь без пройденных уроков или без ошибок открывает «Трудные слова», «Фокус дня», «Итоги недели». Ожидание: понятный текст и кнопка, не пустая карточка и не ошибка. (Тесты в задачах 14, 15, 18.)
2. **Старые профили.** Данные `profiles.data`, `player_stats.extra` и колоды созданы до новых полей (`weeklyGoal`, `weekHistory`, `courseId`, `theme`). Ожидание: значения по умолчанию, ничего не падает. (Задачи 6, 19, 22.)
3. **Границы недели и часовой пояс.** Воскресенье вечером в Asia/Oral — это день в UTC для cron. Ожидание: неделя считается с понедельника по часовому поясу пользователя, итог не приходит дважды. (Задача 18.)
4. **Устаревший service worker.** После деплоя пользователь видит старую версию из кэша. Ожидание: новая версия подхватывается, `/api/*` и POST никогда не кэшируются. (Задача 20.)
5. **Жёсткое «30».** Второй курс и сертификат: прогресс показывает «12 из 30» для курса из 24 уроков. Ожидание: число берётся из курса. (Задача 22.)

---

## Порядок и зависимости

```
Этап 1 (быстрые победы):  T1 аудио  →  T2 токены  →  T3 сверка аудио
Этап 2 (структура, тема): T4 разбить main.jsx → T5 цвета → T6 тёмная тема → T7 шрифты → T8 состояния → T9 анимации → T10 доступность
Этап 3 (обучение):        T11 теги ошибок → T12 банк ошибок → T13 практика ошибок → T14 трудные слова → T15 фокус дня → T16 Say it → T17 спайк озвучки
Этап 4 (возвращаемость):  T18 итоги недели → T19 цель недели → T20 PWA → T21 лига (после серверного XP)
Этап 5 (контент):         T22 курсы → T23 фото → T24 казахский → T25 второй курс → T26 сценарии
```
Этапы 1–2 лучше сделать первыми: они дешёвые и ускоряют остальное. Этапы 3 и 4 после этапа 2 независимы друг от друга. Контент (этап 5) можно вести параллельно, он требует людей (носитель языка, запись аудио).

---

## Этап 1. Быстрые победы

### Задача 1: Аудио для всех слов (14 слов без озвучки)

**Files:**
- Create: `src/lib/audio.js`, `src/lib/audio.test.js`
- Modify: `src/main.jsx` (убрать `speakWord`, импортировать из `lib/audio.js`)

**Interfaces:**
- Produces: `AUDIO_ALIASES: Record<string, string>` (ключ слова → имя файла без `.m4a`), `audioBase(term: string): string`, `audioPath(term: string): string` (`/audio/<base>.m4a`), `speakWord(term: string): void` (играет файл, при ошибке читает голосом браузера).

- [ ] **Шаг 1: тест.** `audio.test.js`: для каждого слова из `lessons` файл `public/audio/${audioBase(term)}.m4a` существует (`fs.existsSync`); `audioBase("civilisation") === "civilization"`; `audioBase("Local Community") === "local-community"`; у слова без псевдонима база равна slug.
- [ ] **Шаг 2: запустить, убедиться, что тест падает** (`npx vitest run src/lib/audio.test.js`, ожидается 14 провалов).
- [ ] **Шаг 3: реализовать** `AUDIO_ALIASES` из 14 пар (в разделе «Что проверено») и три функции. Файлы не переименовывать и не удалять.
- [ ] **Шаг 4: тест проходит.** Затем на живом приложении проверить на слух 3 слова (`capital`, `civilisation`, `ingredient`) и подтвердить владельцу, что это те слова (имена файлов предполагают, что это так, содержимое я не слушал).
- [ ] **Шаг 5: коммит** `Fix audio file names for 14 lesson words`.

### Задача 2: Токены дизайн-системы и аудит CSS

**Files:**
- Create: `design-system/30english/MASTER.md`, `design-system/30english/tokens.json`, `src/styles/tokens.css`, `scripts/css-audit.mjs`
- Modify: `package.json` (скрипт `audit:css`), `src/main.jsx` (импорт `tokens.css` до `styles.css`)

**Interfaces:**
- Produces: CSS-переменные в `:root`: `--bg`, `--surface`, `--surface-2`, `--text`, `--text-muted`, `--border`, `--primary`, `--primary-strong`, `--on-primary`, `--accent`, `--success`, `--danger`; шкала текста `--fs-xs` 12px, `--fs-sm` 14px, `--fs-md` 16px, `--fs-lg` 20px, `--fs-xl` 28px, `--fs-2xl` 36px; отступы `--space-1…8` (4px шаг); радиусы `--radius-sm 8px`, `--radius-md 12px`, `--radius-lg 18px`; движение `--dur-fast 120ms`, `--dur-med 220ms`, `--ease-out`. Старые `--navy`, `--blue`, `--orange`, `--green`, `--line`, `--muted`, `--light-blue`, `--blue-strong` остаются и становятся псевдонимами новых.

- [ ] **Шаг 1: палитра скриптом** (правила проекта): `python ~/.claude/skills/web-craft/scripts/make_palette.py --color "#4d8be8" --accent "#f69a62" --name brand --out design-system/30english`. Основные цвета бренда берутся из текущего приложения (navy `#152a41`, blue `#4d8be8`, orange `#f69a62`, green `#4eb69b`), не из другого проекта.
- [ ] **Шаг 2: `scripts/css-audit.mjs`**: читает `src/**/*.css`, печатает топ-30 hex по частоте и число `font-size` меньше 12px. Запуск `npm run audit:css`. Тест не нужен (одноразовый инструмент), но скрипт не должен падать на пустом файле.
- [ ] **Шаг 3: `tokens.css`** со светлой темой, значения совпадают с текущими цветами (вид сайта не меняется). В `MASTER.md`: принципы, компоненты и состояния, таблица токенов.
- [ ] **Шаг 4: Figma.** Через `ToolSearch figma` проверить, подключён ли коннектор. Если подключён, перенести переменные; если нет, сообщить владельцу (подключение один раз на аккаунт).
- [ ] **Шаг 5: проверка.** `npm run build`, сайт выглядит как раньше. Коммит `Add design tokens and CSS audit`.

### Задача 3: Сверка аудио с папкой Drive и исправление карты проекта

**Files:**
- Modify: `PROJECT_MAP.md`

- [ ] **Шаг 1:** через коннектор Google Drive (`search_files`) найти папку «Озвучка 2» и сравнить список файлов со словами уроков. Если коннектор недоступен, спросить владельца список имён.
- [ ] **Шаг 2:** в `PROJECT_MAP.md` убрать неверный пример `crystal-clear`/`symbolise` (они есть в уроках 12 и 23) и записать реальный результат сверки: какие записи в Drive лишние или отсутствуют в приложении.
- [ ] **Шаг 3:** если нашлись новые слова, не входящие в уроки, добавить их в список «бонус-слов» для задачи 25, а не в уроки.
- [ ] **Шаг 4: коммит** `Update project map after audio check`.

---

## Этап 2. Структура и дизайн

### Задача 4: Разделить `main.jsx` без изменения поведения

**Files:**
- Create: `src/App.jsx`, `src/pages/Dashboard.jsx`, `src/pages/Journey.jsx`, `src/pages/Certificate.jsx`, `src/components/AuthModal.jsx`, `src/components/LessonModal.jsx`, `src/components/ChatPanel.jsx`, `src/components/Sidebar.jsx`, `src/components/Topbar.jsx`, `src/hooks/useProfile.js` (загрузка и сохранение `profiles`), `src/hooks/useAuth.js` (сессия), `src/lib/format.js` (`formatTime`, `cx`, `localDateKey`), `src/pages/pages.render.test.jsx`
- Modify: `src/main.jsx` (остаётся только монтирование `<App/>`)

**Interfaces:**
- Consumes: существующие props компонентов, без изменений. Каждый вынесенный компонент получает те же props, что и сейчас.
- Produces: `default export` из каждого файла; `useProfile({ supabase, session }): { user, setUser, profileLoaded: React.MutableRefObject<boolean> }`.

- [ ] **Шаг 1: тест `pages.render.test.jsx`** (до выноса): `react-dom/server` `renderToString` для `Dashboard`, `Journey`, `Certificate` с готовыми данными (демо-профиль) не падает и содержит ключевые тексты («Hey», «30-day journey», «certificate»). Новых зависимостей не нужно.
- [ ] **Шаг 2: порядок выноса** (после каждого шага `npm run build` и `npm test`): `ChatPanel` → `AuthModal` → `Certificate`+`CertificateArtwork` → `Journey` → `Dashboard` → `LessonModal` → хуки профиля и сессии → `Sidebar`/`Topbar`. Поведение, названия классов и тексты не менять.
- [ ] **Шаг 4: ручное сравнение.** Прогнать в `web-demo`: дашборд, урок, запись (кнопка), повторение, достижения, диалог, игры, сертификат на 390 и 1440 px, до и после (скриншоты). Различий быть не должно.
- [ ] **Шаг 5: коммит** отдельно на каждый вынесенный компонент (`Extract ChatPanel`, …), чтобы откат был точечным.

### Задача 5: Перевести 509 цветов на токены

**Files:**
- Modify: `src/styles.css`, `src/components/*.css`
- Create: `scripts/css-tokenize.mjs`

**Interfaces:**
- Consumes: токены из задачи 2 и результат `npm run audit:css`.
- Produces: файл `design-system/30english/css-map.json` (hex → токен) для воспроизводимости замены.

- [ ] **Шаг 1:** из аудита взять топ-25 hex (они покрывают большую часть). Составить `css-map.json`; цвета, которым нет токена (градиенты сертификата, оверлеи фото), остаются как есть и перечисляются в списке исключений.
- [ ] **Шаг 2: `css-tokenize.mjs`** заменяет hex на `var(--…)` по карте, печатает число замен и остаток. Сначала запуск в режиме `--dry-run`.
- [ ] **Шаг 3: проверка вида.** Скриншоты 1440/390 страниц до и после в светлой теме: допускается разница в 1–2 оттенка, не больше. Любое видимое отличие — откат этой замены.
- [ ] **Шаг 4:** `npm run audit:css` показывает остаток hex только из списка исключений. Коммит `Move colours to design tokens`.

### Задача 6: Тёмная тема и переключатель

**Files:**
- Create: `src/lib/theme.js`, `src/lib/theme.test.js`, `src/lib/contrast.js`, `src/lib/contrast.test.js`, `src/components/ThemeToggle.jsx`
- Modify: `src/styles/tokens.css` (значения для `[data-theme="dark"]` и `@media (prefers-color-scheme: dark)`), `src/hooks/useGamification.js` (хранить `extra.theme`), `src/components/Sidebar.jsx`

**Interfaces:**
- Produces: `THEMES = ["system","light","dark"]`, `resolveTheme(pref: string, systemDark: boolean): "light"|"dark"` (неизвестное значение → `system`), `applyTheme(pref): void` (ставит `data-theme` на `<html>`), `contrastRatio(fg: string, bg: string): number`.

- [ ] **Шаг 1: тесты.** `resolveTheme("system", true) === "dark"`; `resolveTheme(undefined, false) === "light"`; `resolveTheme("bad", true) === "dark"`. `contrastRatio("#ffffff","#000000") ≈ 21`. Матрица: для каждой пары токенов текст/фон в обеих темах `contrastRatio ≥ 4.5` (`--text` на `--bg`, `--text-muted` на `--surface`, `--on-primary` на `--primary-strong` и т. д.). Тест читает токены из `tokens.css`.
- [ ] **Шаг 2: реализовать.** Тёмная палитра не инверсия, а отдельные приглушённые тона. Предпочтение сохраняется в `localStorage` и в `extra.theme`; для профиля без поля по умолчанию `system`.
- [ ] **Шаг 3: исключения.** Сертификат и его печать остаются светлыми в обеих темах. Оверлеи поверх фото проверить отдельно (текст на градиенте ≥ 4.5:1).
- [ ] **Шаг 4: проверка вида.** `resize_window` с `colorScheme: dark` на 390 и 1440 px: все страницы, формы, модальные окна. Мигания светлой темы при загрузке нет (атрибут ставится до отрисовки, в `index.html`).
- [ ] **Шаг 5: коммит** `Add dark theme with toggle`.

### Задача 7: Шкала шрифтов и минимальные размеры

**Files:**
- Modify: `src/styles.css` (154 объявления ≤ 11 px), `src/components/*.css`
- Modify: `scripts/css-audit.mjs` (код возврата 1, если остались `font-size` < 12px вне списка разрешённых)

- [ ] **Шаг 1:** список объявлений < 12px сгруппировать по классам (подписи, бейджи, подсказки). Основной текст и кнопки поднять до `--fs-sm`/`--fs-md`; декоративные микро-подписи (счётчики на иконках) оставить в списке разрешённых.
- [ ] **Шаг 2:** размеры в `rem`, чтобы работало увеличение шрифта в браузере. Проверить зум 200% на 1440 px: нет обрезанного текста и горизонтального скролла.
- [ ] **Шаг 3:** `npm run audit:css` без ошибок. Скриншоты до/после на 390 px. Коммит `Raise minimum font sizes`.

### Задача 8: Состояния загрузки, офлайн, ошибки

**Files:**
- Create: `src/components/Skeleton.jsx`, `src/components/OfflineBanner.jsx`, `src/components/ErrorBoundary.jsx`, `src/hooks/useOnline.js`, `src/components/states.css`, `src/components/states.render.test.jsx`
- Modify: `src/App.jsx` (оборачивание страниц), `src/components/Review.jsx`, `src/components/Achievements.jsx` (скелетоны вместо «Loading…»)

**Interfaces:**
- Produces: `<Skeleton lines={number} />`, `<OfflineBanner />` (показывается при `navigator.onLine === false`), `<ErrorBoundary fallback?>` с кнопкой «Reload this page», `useOnline(): boolean`.

- [ ] **Шаг 1: тесты (renderToString).** `Skeleton` с `lines=3` даёт 3 блока и `aria-busy="true"`; `ErrorBoundary` рендерит детей без ошибки; при брошенной ошибке показывает запасной текст (проверить через вызов `getDerivedStateFromError`).
- [ ] **Шаг 2: реализовать.** Анимация мерцания только `opacity`, отключается при `prefers-reduced-motion`. Баннер офлайн имеет `role="status"`.
- [ ] **Шаг 3:** проверить в браузере: отключить сеть (инструмент `read_network_requests` не нужен, достаточно `navigator.onLine` через эмуляцию), баннер появляется и исчезает; сброшенный запрос повторения слов остаётся в очереди и уходит после возврата сети.
- [ ] **Шаг 4: коммит** `Add loading, offline and error states`.

### Задача 9: Движение со смыслом

**Files:**
- Create: `src/components/motion.css`
- Modify: `src/components/Review.jsx` (переход карточек), `src/components/Achievements.jsx` (заполнение полосы уровня), `src/main.jsx`/`App.jsx` (тост значка)
- Test: `src/lib/motion.test.js`

- [ ] **Шаг 1: тест `motion.test.js`:** каждый CSS-файл в `src/components/` и `src/styles.css`, где есть `@keyframes` или `transition`, содержит блок `@media (prefers-reduced-motion: reduce)` (читает файлы, проверяет строкой).
- [ ] **Шаг 2: реализовать** на токенах `--dur-*`/`--ease-out`: плавное появление следующей карточки (`opacity` + `transform: translateY`), рост полосы уровня, всплытие тост-значка. Без анимации ширины и высоты.
- [ ] **Шаг 3:** проверить вручную и при включённом `prefers-reduced-motion` (анимации отключены). Коммит `Add purposeful motion`.

### Задача 10: Доступность, второй проход

**Files:**
- Modify: `src/App.jsx`, `src/components/Sidebar.jsx`, `src/components/Topbar.jsx`, `src/components/*.css`
- Create: `scripts/a11y-run.md` (инструкция), dev-зависимость `axe-core` (после `vet-before-install`)

- [ ] **Шаг 1:** добавить «Skip to main content» первой ссылкой, `<main id="content">`, `<nav aria-label>`, заголовки без пропуска уровней, `aria-current="page"` на активном пункте меню, `aria-live` для тостов.
- [ ] **Шаг 2:** меню как drawer на мобильном: фокус возвращается на кнопку меню после закрытия, `Esc` закрывает, фон не получает фокус.
- [ ] **Шаг 3: автоматический прогон.** `axe-core` подключить в предпросмотре через `javascript_tool`, прогнать на каждой странице в светлой и тёмной темах; нарушения уровня serious и critical исправить.
- [ ] **Шаг 4: проверка с клавиатуры.** Пройти все страницы только клавишами (Tab, Enter, Space, Esc, стрелки в группах `radiogroup`/`tablist`); отчёт по найденному в `docs/superpowers/reports/a11y-2026-11.md`. Проверку скринридером (NVDA/VoiceOver) выполняет владелец, это нужно сказать в отчёте.
- [ ] **Шаг 5: коммит** `Improve accessibility structure and keyboard use`.

---

## Этап 3. Обучение

### Задача 11: Категории ошибок в ответах ИИ

**Files:**
- Create: `src/data/mistake-tags.js`, `src/data/mistake-tags.test.js`
- Modify: `server/cloudflare-ai.js` (промпт и разбор `grammarCorrections`), `server/dialogue.js` (`buildSummaryMessages`, `parseSummary`), `server/dialogue.test.js`

**Interfaces:**
- Produces: `MISTAKE_TAGS = ["articles","tenses","prepositions","agreement","word-order","word-choice","plurals","other"]`, `normalizeTag(tag: unknown): string` (значение из списка или `"other"`). Поправки теперь `{ original: string, corrected: string, tag: string }`.

- [ ] **Шаг 1: тесты.** `normalizeTag("Tenses")` → `"tenses"`; `normalizeTag("???")` → `"other"`; `normalizeTag(undefined)` → `"other"`. В `dialogue.test.js`: `parseSummary` оставляет `tag` из списка, неизвестный заменяет на `other`, поправка по-прежнему отбрасывается, если `original` не сказан учеником.
- [ ] **Шаг 2:** добавить в оба промпта поле `tag` и перечень допустимых значений; в `parseFeedback` и `parseSummary` пропускать тег через `normalizeTag`. Поведение для ответов без `tag` не ломать (старый формат допустим).
- [ ] **Шаг 3:** тесты проходят. Коммит `Tag grammar corrections by mistake type`.

### Задача 12: Банк ошибок (хранение)

**Files:**
- Create: `supabase/migrations/007_mistakes.sql`, `src/hooks/useMistakes.js`, `src/lib/mistakes.js`, `src/lib/mistakes.test.js`
- Modify: `src/App.jsx` (после отзыва по уроку и после итога диалога вызывать `add`)

**Interfaces:**
- Produces: таблица `learner_mistakes(id bigint identity pk, user_id uuid references auth.users on delete cascade, source text check in ('lesson','dialogue'), tag text, original text, corrected text, lesson_index int null, created_at timestamptz default now(), unique(user_id, original, corrected))` с RLS «только свои», права `select, insert`. `useMistakes({ supabase, userId }): { status, items, add(corrections, source, lessonIndex?) }`. `mistakeStats(items, now, days = 30): { tag: string, count: number }[]` (по убыванию). `mistakeKey(original: string, corrected: string): string` (`m:` + 8 символов FNV-1a).

- [ ] **Шаг 1: тесты.** `mistakeStats` считает только записи за последние `days`, сортирует по числу, пустой список даёт `[]`; повтор той же пары не удваивает счёт (уникальность); `mistakeKey` стабилен и различает пары.
- [ ] **Шаг 2:** миграция с `if not exists` и `drop policy if exists`. Хук с запасным вариантом в `localStorage` без аккаунта (как у колоды слов) и состояние `unavailable`, если таблицы нет.
- [ ] **Шаг 3:** выполнить миграцию в Supabase (после вашего разрешения) и проверить вставку своей записью.
- [ ] **Шаг 4: коммит** `Store learner mistakes`.

### Задача 13: Практика ошибок («Fix it»)

**Files:**
- Modify: `src/lib/mistakes.js` (добавить `makeFixCard`), `src/hooks/useWordCards.js` (метод `addMistakes`), `src/components/Review.jsx` (вид карточки `fix`), `src/lib/mistakes.test.js`

**Interfaces:**
- Consumes: `mistakeKey`, колонки `custom_term` (исправленная фраза) и `custom_example` (исходная с ошибкой) из миграции 006, `source = 'mistake'`.
- Produces: `makeFixCard(original: string, corrected: string, rng?): { options: string[], answer: string }` (два варианта в случайном порядке), `addMistakes(items: {original, corrected}[]): number` в хуке.

- [ ] **Шаг 1: тесты.** `makeFixCard` всегда содержит оба варианта, `answer === corrected`, порядок зависит от `rng`; `addMistakes` не создаёт дубль уже существующей карточки; не более 5 новых карточек ошибок в день.
- [ ] **Шаг 2: интерфейс.** В сессии повторения карточка «Which sentence is correct?» с двумя кнопками. Верно с первого раза → Good, быстро → Easy, неверно → Again (как cloze). После ответа показать правильный вариант и тег («Tenses»).
- [ ] **Шаг 3:** автоматически добавлять в колоду до 5 последних ошибок после каждого отзыва. Проверить в браузере на демо-данных: карточка появляется, оценка записывается, перезагрузка сохраняет.
- [ ] **Шаг 4: коммит** `Practise past mistakes with fix-it cards`.

### Задача 14: Режим «Трудные слова»

**Files:**
- Modify: `src/lib/srs.js`, `src/lib/srs.test.js`, `src/components/Review.jsx`

**Interfaces:**
- Produces: `hardWords(rows: Row[], n = 10): Row[]`, `pickHardSession(rows, size = 10): Row[]`.

- [ ] **Шаг 1: тесты.** В трудные попадают карточки с `lapses ≥ 2` или в состоянии Relearning, но не `New`; порядок: больше `lapses`, затем меньше `stability`; пустой список дает `[]`; не мутирует вход.
- [ ] **Шаг 2:** на странице повторения кнопка «Difficult words (N)»; при N = 0 текст «No difficult words yet» без кнопки. Сессия использует тот же интерфейс карточек.
- [ ] **Шаг 3: коммит** `Add difficult words mode`.

### Задача 15: «Фокус дня» и адаптивные подсказки

**Files:**
- Create: `src/data/grammar-tags.js`, `src/lib/focus.js`, `src/lib/focus.test.js`
- Modify: `src/pages/Dashboard.jsx` (карточка «Today’s focus»), `src/components/Dialogue.jsx` (параметр `focusTag`), `api/dialogue.js`, `server/dialogue.js` (`buildTurnMessages(..., focusTag?)`), `server/dialogue.test.js`

**Interfaces:**
- Produces: `TAG_TO_GRAMMAR: Record<string, string[]>` (тег ошибки → значения `grammarFocus` уроков, например `tenses` → `present simple`, `past simple`, `present perfect`, `used to`), `recommendFocus(stats, completedIndexes, lessons): { tag: string, count: number, lessonIndexes: number[] } | null` (нужно ≥ 3 ошибок одного тега за 30 дней, иначе `null`).

- [ ] **Шаг 1: тесты.** `recommendFocus` возвращает `null` при < 3 ошибок; выбирает самый частый тег; `lessonIndexes` содержит только пройденные уроки с подходящей грамматикой; не предлагает тег `other`. `buildTurnMessages` с допустимым `focusTag` добавляет строку про создание возможности использовать эту тему, с недопустимым не добавляет.
- [ ] **Шаг 2: реализовать.** Карточка на дашборде: «You often slip on articles. Practise it in a conversation» (кнопка открывает диалог с `focusTag`). Порядок уроков и их открытие не менять.
- [ ] **Шаг 3:** сервер валидирует `focusTag` через `MISTAKE_TAGS`; квоты диалога без изменений.
- [ ] **Шаг 4: коммит** `Suggest a daily focus from learner mistakes`.

### Задача 16: «Say it» (самопроверка произношения без ИИ)

**Files:**
- Create: `src/components/SayIt.jsx`, `src/components/sayit.css`, `src/lib/sayit.js`, `src/lib/sayit.test.js`
- Modify: `src/components/Games.jsx` (вкладка «Say it»)

**Interfaces:**
- Produces: `pickSayItWords(pool: Word[], n = 5, rng?): Word[]` (только слова, у которых есть записанное аудио по `audioBase`).

- [ ] **Шаг 1: тест.** `pickSayItWords` не возвращает слов без аудиофайла, не больше `n`, без повторов.
- [ ] **Шаг 2: интерфейс.** Прослушать слово, записать себя (до 5 секунд, `MediaRecorder`), прослушать обе записи подряд. Запись остаётся в памяти страницы и не отправляется. Кнопки оценки «Close / Needs work» только для себя, в данные не пишутся.
- [ ] **Шаг 3:** текст на экране: «Compare your voice with the recording. This is self-check, nothing is sent». Ошибка доступа к микрофону показывает понятную подсказку.
- [ ] **Шаг 4: коммит** `Add say-it self-check`.

### Задача 17: Спайк серверной озвучки

**Files:**
- Create: `docs/superpowers/spikes/tts.md`

- [ ] **Шаг 1:** проверить (документация Cloudflare Workers AI через `context7` или сайт), есть ли модель синтеза речи, её цена и лимиты. Эти факты сейчас не проверены.
- [ ] **Шаг 2:** на 5 фразах из диалогов замерить задержку, понятность и стоимость за 1000 символов; сравнить с 3 голосами браузера (Windows, Android, iOS по возможности).
- [ ] **Шаг 3: критерии решения:** ответ до 1,5 секунд, речь понятна без напряжения, стоимость не больше бесплатных лимитов. Записать таблицу и решение: оставить голос браузера или добавить `api/tts.js` с флагом `AI_TTS_ENABLED`.
- [ ] **Шаг 4:** если принято «добавить», оформить отдельную задачу с квотой и кэшем фраз (в этот план не входит). Прослушивание и выбор голоса за владельцем. Коммит документа спайка.

---

## Этап 4. Возвращаемость

### Задача 18: Итоги недели

**Files:**
- Create: `src/lib/weekly.js`, `src/lib/weekly.test.js`, `src/components/WeeklyCard.jsx`
- Modify: `api/remind.js` (по воскресеньям добавить недельное сообщение), `src/pages/Dashboard.jsx`, `server/telegram.js`

**Interfaces:**
- Produces: `weekRange(today: string): { start: string, end: string }` (понедельник–воскресенье, ключи дней `YYYY-MM-DD`), `weeklySummary({ days, reviewLog, submissions, dialogues, mistakes, streak, today }): { activeDays: number, reviews: number, newWords: number, lessons: number, conversations: number, streak: number, topTag: string | null }`, `formatWeekly(summary: Summary): string` (короткий текст для Telegram и карточки).

- [ ] **Шаг 1: тесты.** `weekRange("2026-11-15")` (воскресенье) → `2026-11-09…2026-11-15`; границы месяца и года; `weeklySummary` для пустой недели возвращает нули и `formatWeekly` отвечает мягко («Quiet week. One short lesson restarts it»), без упрёков; не учитывает события вне недели.
- [ ] **Шаг 2: интерфейс.** Карточка «This week» на дашборде: активные дни, слова, уроки, беседы, главная тема ошибок.
- [ ] **Шаг 3: Telegram.** В `api/remind.js` дневное напоминание остаётся; в воскресенье (по `Asia/Oral`) добавляется недельный итог тем, кто привязал бота и не получил его сегодня. Один cron в день (на Hobby нельзя чаще), поэтому отдельный cron не добавлять. Повторная отправка в тот же день невозможна (`last_sent_on`).
- [ ] **Шаг 4: проверка.** Юнит-тесты и ручной прогон функции на фикстуре. Реальную отправку проверить только после вашего подтверждения (она идёт реальным пользователям, для тестов использовать ваш чат).
- [ ] **Шаг 5: коммит** `Add weekly summary`.

### Задача 19: Цель на неделю и недельная серия

**Files:**
- Modify: `src/lib/weekly.js`, `src/lib/weekly.test.js`, `src/hooks/useGamification.js`, `src/components/Achievements.jsx`, `src/lib/badges.js`

**Interfaces:**
- Produces: `weeklyGoalProgress({ days, goalDays, today }): { done: number, target: number, met: boolean }`, `weeklyStreak(history: Record<string, number>, goalDays: number, today: string): number` (число подряд идущих недель, где цель выполнена; текущая неделя не обрывает серию, пока идёт). Поля `extra.weeklyGoal` (по умолчанию 4) и `extra.weekHistory` (последние 12 недель). Значок `rhythm-4` («Four-week rhythm»).

- [ ] **Шаг 1: тесты.** Профиль без `weeklyGoal` и `weekHistory` работает с умолчаниями (4, `{}`); неделя с 3 днями при цели 4 не засчитана; текущая неделя не сбрасывает серию; пропущенная неделя обрывает; значок выдаётся один раз.
- [ ] **Шаг 2: интерфейс.** На странице достижений выбор цели (3, 4, 5, 6 дней) и полоска недели; дневная серия и её заморозки остаются как есть.
- [ ] **Шаг 3: коммит** `Add weekly goal and weekly streak`.

### Задача 20: PWA и офлайн-кэш

**Files:**
- Create: `public/manifest.webmanifest`, `public/sw.js`, `public/sw-rules.js`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `src/pwa.js`, `src/lib/sw-rules.test.js`
- Modify: `index.html` (ссылка на манифест, `theme-color`), `vite.config.js` (`define` с `__BUILD_ID__`), `src/App.jsx` (кнопка «Install app» и сообщение «New version ready»)

**Interfaces:**
- Produces: `swRules.shouldCache(url: string, method: string): "network-first" | "cache-first" | "never"` в `public/sw-rules.js` (классический скрипт, подключается через `importScripts`, в тесте загружается через `new Function`).

- [ ] **Шаг 1: тесты `sw-rules.test.js`.** `/api/*` → `never`; любой не-GET метод → `never`; `/audio/*.m4a` и `/photos/*` → `cache-first`; `/` и `/assets/*.js` → `network-first`; внешние домены → `never`.
- [ ] **Шаг 2: service worker.** Имя кэша включает `__BUILD_ID__`; при активации удаляются кэши с другим идентификатором; `skipWaiting` + сообщение клиенту «new version»; кэш аудио наполняется по мере прослушивания (181 файла заранее не качаем).
- [ ] **Шаг 3: иконки.** PNG 192 и 512 сделать однократно через холст в предпросмотре (без новых зависимостей) из компаса бренда в цвете navy. Использовать только в манифесте.
- [ ] **Шаг 4: проверка.** Собрать и запустить через `npm start` (только в продакшен-сборке `sw.js` регистрируется), проверить установку в Chrome, загрузку без сети (страница и прослушанные слова доступны), обновление после новой сборки. Повторение слов офлайн работает через существующую очередь.
- [ ] **Шаг 5: коммит** `Add installable app and offline cache`.

### Задача 21: Друзья и недельная лига (после серверного XP)

> **Зависимость:** требует перенос начисления XP на сервер, а это относится к отложенному этапу безопасности. Делать только после него. Пока этот раздел служит описанием, не планом на ближайшие сессии.

**Files:**
- Create: `supabase/migrations/0NN_league.sql`, `api/league.js`, `src/components/League.jsx`, `src/lib/league.js`, `src/lib/league.test.js`

**Interfaces:**
- Produces: таблицы `public_profiles(user_id pk, nickname unique, visible boolean)`, `friendships(user_id, friend_id, status)`, `weekly_xp(user_id, week_start, xp)`; функция `award_xp(p_event text, p_ref text)` (security definer, сама определяет число очков и запрещает повтор по `p_ref`); `leaderboard(friendIds: string[], weekStart: string): { nickname, xp }[]`.

- [ ] **Шаг 1: правила.** Участие только по согласию (`visible = true`), никнейм вместо имени, выход из рейтинга и удаление в один клик, приглашение по коду. Без публичной таблицы всех пользователей.
- [ ] **Шаг 2: тесты.** `leaderboard` считает только выбранных друзей и согласившихся, сортирует по XP и неделе, не показывает невидимых; повтор `award_xp` с тем же `p_ref` не добавляет очков.
- [ ] **Шаг 3:** реализовать после согласования модели угроз на этапе безопасности. Коммит отдельно.

---

## Этап 5. Контент

### Задача 22: Курсы вместо жёсткого «30»

**Files:**
- Create: `src/courses.js`, `src/courses.test.js`, `src/lessons/kazakhstan-30.js` (перенос текущего `lessons.js`)
- Modify: `src/lessons.js` (реэкспорт для совместимости), `src/pages/Dashboard.jsx`, `src/pages/Journey.jsx`, `src/pages/Certificate.jsx`, `src/hooks/useProfile.js`, `src/lib/deck.js`

**Interfaces:**
- Produces: `courses: { id: string, title: string, level: string, lessons: Lesson[] }[]`, `getCourse(id?: string): Course` (по умолчанию `"kazakhstan-30"`), `courseProgress(course, submissions): { completed: number, total: number }`. Профиль получает необязательное поле `courseId`. Прогресс выводится из `submissions[].cardId`, поэтому у каждого курса свой префикс id уроков (`day-01`… у первого).

- [ ] **Шаг 1: тесты.** `getCourse()` без аргумента → курс из 30 уроков; неизвестный id → курс по умолчанию; `courseProgress` с фикстурой из двух курсов разной длины (30 и 24) считает «12 из 24», не «12 из 30»; профиль без `courseId` работает (Review Focus 2 и 5).
- [ ] **Шаг 2:** найти все места с литералом `30` (`grep -n "30" src/*.jsx src/pages src/components`) и заменить на `course.lessons.length`; список мест записать в описание коммита. Сертификат берёт название и число из курса.
- [ ] **Шаг 3:** `api/*.js` и `server/*.js` импортируют `lessons` из `src/lessons.js`: оставить реэкспорт первого курса, диалоги и отзыв по урокам принимают `courseId` и `lessonIndex`.
- [ ] **Шаг 4: проверка.** Вся логика (повторение, достижения, игры) с курсом по умолчанию ведёт себя как раньше; прогнать тесты и ручной проход. Коммит `Introduce courses`.

### Задача 23: Свои фото вместо Unsplash

**Files:**
- Create: `scripts/fetch-photos.mjs`, `public/photos/` (60 файлов), `src/lib/photos.js`, `src/lib/photos.test.js`, `public/photos/CREDITS.md`
- Modify: `src/lessons/kazakhstan-30.js` (поле `photoAlt`), `src/pages/*.jsx` (использовать `photoUrl`)

**Interfaces:**
- Produces: `photoUrl(lesson: Lesson, size: 450 | 1100): string` (`/photos/<lessonId>-<size>.webp`).

- [ ] **Шаг 1: разрешение.** Скачивание 60 файлов (30 фото в двух размерах, ориентировочно 10–25 МБ суммарно, размер не проверялся) по правилам требует вашего явного «да»: источник `images.unsplash.com`, имена `<lessonId>-<size>.webp`. Без него шаг не выполняется.
- [ ] **Шаг 2: тесты.** Для каждого урока существуют оба файла и непустое `photoAlt`; `photoUrl` возвращает корректный путь.
- [ ] **Шаг 3: реализовать.** Скрипт скачивает через параметр `fm=webp` (без новых зависимостей), задаёт размеры. В разметке заданы `width` и `height`, ленивая загрузка ниже первого экрана. В `CREDITS.md` перечислены идентификаторы фото и лицензия Unsplash.
- [ ] **Шаг 4: проверка.** Сеть на вкладке Network: нет запросов к `images.unsplash.com`; общий вес страницы падает; PWA-кэш из задачи 20 подхватывает `/photos/*`. Коммит `Host lesson photos locally`.

### Задача 24: Проверка казахских переводов носителем

**Files:**
- Create: `scripts/kk-review.mjs`, `src/data/kk-overrides.json`, `src/lib/kk.js`, `src/lib/kk.test.js`
- Modify: `src/lib/deck.js` (брать `kk` через `applyKkOverrides`)

**Interfaces:**
- Produces: `exportKkRows(lessons): { key, term, kk, ru, example }[]`, `applyKkOverrides(word, overrides): Word`, `validateKkCsv(rows, lessons): { ok: boolean, errors: string[] }`.

- [ ] **Шаг 1: тесты.** `validateKkCsv` отклоняет пустое `kk`, неизвестный `key`, изменённый `term` или `ru`; принимает исправленный `kk`; `applyKkOverrides` подменяет только `kk` и не трогает остальное.
- [ ] **Шаг 2:** `node scripts/kk-review.mjs export` создаёт CSV (около 153 уникальных слов); при желании выгрузить в Google Таблицу через коннектор Sheets, чтобы носитель правил прямо там.
- [ ] **Шаг 3: человек.** Носитель языка исправляет колонку `kk`; результат возвращается файлом. Это шаг владельца, я его не выполню.
- [ ] **Шаг 4:** `node scripts/kk-review.mjs apply <file>` валидирует и пишет `kk-overrides.json`; файл уроков не правим руками. Коммит `Apply reviewed Kazakh translations`.

### Задача 25: Второй курс (30 уроков)

**Files:**
- Create: `src/lessons/work-study-30.js`, `scripts/validate-lessons.mjs`, `src/lessons/lessons.test.js`
- Modify: `src/courses.js`

**Interfaces:**
- Produces: курс `"work-study-30"` («Work and Study in Kazakhstan», уровень B2): 5 модулей по 6 уроков. Схема урока та же, что у `kazakhstan-30` (поля `id`, `title`, `level`, `quickFact`, `questions` ≥ 4, `words` ровно 6 с `term`/`kk`/`ru`/`example`, `starters`, длительности, `targetVocabulary` равно списку `term`, `requiredElements`, `grammarFocus`, `feedbackRules`, `nextGoal`, `photo`, `photoAlt`).

**Модули (предложение, подтвердить с владельцем):** 1. Городская жизнь (транспорт, жильё, покупки, сервисы, соседи, праздники); 2. Работа и карьера (собеседование, офис, переговоры, удалённая работа, обучение на работе, увольнение и поиск); 3. Образование и наука (университет, исследования, стажировки, гранты, наука в Казахстане, учёба за рубежом); 4. Здоровье и образ жизни (врач, спорт, питание, стресс, отпуск, дом и семья); 5. Технологии и будущее (ИИ, цифровые услуги, зелёная энергетика, стартапы, культура онлайн, Казахстан 2050).

- [ ] **Шаг 1: валидатор сначала.** `lessons.test.js` для всех курсов: уникальные id, ровно 6 слов, слова не повторяются в уроке, `kk` и `ru` не пусты, пример содержит своё слово (`makeCloze(example, term) !== null`), `targetVocabulary` совпадает с `term`, `questions ≥ 4`, длительности согласованы. Запустить на первом курсе; найденные нарушения исправить или внести в явный список исключений с причиной.
- [ ] **Шаг 2: партиями по 5 уроков.** Черновик пишется по шаблону, затем валидатор, затем ваша вычитка и проверка казахских переводов (задача 24). Партия не вливается без зелёного валидатора.
- [ ] **Шаг 3: аудио.** Для 180 новых слов нужны записи: либо вы записываете, либо временно слово читает голос браузера (так работает уже сейчас). Имя файла по `wordKey`. Тест из задачи 1 для второго курса допускает «аудио не записано» только из списка ожидающих.
- [ ] **Шаг 4: UI.** Выбор курса на дашборде, прогресс и сертификат у каждого курса свои; слова второго курса попадают в общую колоду повторения после прохождения урока (дедупликация по `wordKey` уже работает).
- [ ] **Шаг 5: коммит** по каждой партии (`Add work-study lessons 1–5`).

### Задача 26: Сценарии диалога: с 8 до 20

**Files:**
- Modify: `src/data/scenarios.js`
- Test: `server/dialogue.test.js` (существующие проверки: слова из уроков, уникальные id, диапазон `unlockAfterLesson`)

**Interfaces:**
- Produces: 12 новых сценариев в той же схеме (`id`, `title`, `aiRole`, `userGoal`, `opening`, `targetWords`, `unlockAfterLesson`, `level`).

**Темы:** врач (описать симптомы), такси и дорога, аренда квартиры, собеседование на работу, покупки на базаре, звонок в службу поддержки, университетская консультация, встреча с коллегой из другой страны, жалоба в отеле, путешествие по Шёлковому пути, рассказ о своём городе, обсуждение новости. Для сценариев второго курса `unlockAfterLesson` считается по его урокам.

- [ ] **Шаг 1:** тест на существующие правила для новых сценариев уже есть; добавить проверку, что на каждый уровень B1 и B2 приходится не меньше 8 сценариев.
- [ ] **Шаг 2:** написать сценарии с реалистичными ролями и целями; слова брать из уроков, доступных к моменту открытия.
- [ ] **Шаг 3:** прочитать вслух по 2–3 сценария и проверить в браузере открытие и закрытие по числу пройденных уроков. Коммит `Add 12 conversation scenarios`.

---

## Решения, нужные от вас

1. **Тема по умолчанию:** «как в системе» (рекомендую) или всегда светлая.
2. **Носитель казахского** для проверки переводов (кто и когда). Без этого задача 24 остановится на шаге 3.
3. **Темы второго курса** (модули в задаче 25) подтвердить или заменить.
4. **Аудио для новых слов:** вы записываете или пока читает голос браузера.
5. **Скачивание фото** (задача 23): разрешить ли загрузку 60 файлов с Unsplash.
6. **Миграции 007+** применять мне через панель Supabase, как делали раньше, или вы.
7. **Серверная озвучка:** решаем после спайка 17.
8. **Лига друзей:** брать ли после этапа безопасности (задача 21) или отказаться.

## Оценка и порядок работы

Грубо, в рабочих сессиях по 1–2 часа: этап 1 — 2–3; этап 2 — 8–10; этап 3 — 8–10; этап 4 без лиги — 5–6; этап 5 (код без авторской работы над уроками) — 6–8; авторская работа над вторым курсом и переводами зависит от людей и не оценивается. Рекомендуемая очередность: 1 → 2 → 3 → 4 → 5, контент параллельно.

## Самопроверка плана

- **Покрытие:** все пункты из выбранных 2, 3, 4, 5 списка идей имеют задачу (адаптивные уроки 15, разбор ошибок 12–13, трудные слова 14, самопроверка произношения 16, голос 17, сценарии 26, PWA и офлайн 20, недельные итоги 18, цели недели 19, лига 21, тёмная тема 6, токены 2 и 5, разбиение `main.jsx` 4, состояния 8, анимации 9, доступность 10, шрифты 7, переводы 24, слова «Озвучка 2» 3, второй курс 22 и 25, фото 23). Дополнительно найдена и закрыта задачей 1 проблема с аудио 14 слов.
- **Согласованность типов:** `mistakeKey`, `MISTAKE_TAGS`, `normalizeTag`, `recommendFocus`, `weekRange`, `audioBase`, `getCourse` определены в одной задаче и используются позже с теми же именами и сигнатурами.
- **Не проверено при написании плана:** содержимое 14 переименованных аудиофайлов на слух, доступность серверной озвучки, размеры файлов фото, ограничения cron на Hobby для второго задания (используется один cron).
