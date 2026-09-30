# Accountant

Публичный сайт будущего ИИ-бухгалтера: интерактивная 3D-сцена, учебная финансовая демонстрация и реальные аккаунты раннего доступа.

- Сайт: https://accountant.tojcubekovali98.chatgpt.site (публикация отслеживается в TASKS.md).
- Репозиторий: https://github.com/alitojcubekov206-svg/accountant.
- Сейчас: регистрация, вход, кабинет, выход, смена пароля, удаление собственного аккаунта, условия, конфиденциальность, контакты.
- Учёт реальных операций, зарплаты, налогов и настоящий ИИ ещё разрабатываются. Примерные показатели не являются данными пользователя. PHASE 0–15 не объявляются завершёнными.

## Source of truth

| Документ | Область |
|---|---|
| [PROJECT.md](PROJECT.md) | Продукт и границы текущей версии |
| [BUSINESS_RULES.md](BUSINESS_RULES.md) | Финансовые формулы и история |
| [SECURITY.md](SECURITY.md) | Сессии, permissions, tenant isolation |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Стек и границы слоёв |
| [DATABASE.md](DATABASE.md) | Учётная схема PostgreSQL |
| [AI_RULES.md](AI_RULES.md) | AI tools и рабочий цикл |
| [TASKS.md](TASKS.md) | План, фактические проверки, публикация |
| [DECISIONS.md](DECISIONS.md) | Решения и исключения для публичного сайта |

[AGENTS.md](AGENTS.md) — постоянные инструкции; [TESTING.md](TESTING.md) — проверки; [AUDIT.md](AUDIT.md) — исторический аудит. Приоритет предметный. Конфликты фиксируются до зависимой реализации.

## Локальный запуск

Node.js 24.19.0, pnpm 10.34.5. Команды выполнять из корня проекта. В PowerShell с ограничением .ps1 использовать pnpm.cmd.

```sh
pnpm install --frozen-lockfile
node scripts/setup-local-site.mjs
pnpm db:migrate:site
pnpm build:site
pnpm preview:site
```

Полный сайт с регистрацией: http://127.0.0.1:8787. setup-local-site создаёт ignored .dev.vars с случайным локальным секретом и сохраняет существующий файл. db:migrate:site применяется только к локальной D1. Нужен Worker для API аккаунтов.

pnpm dev запускает Next.js на 127.0.0.1:3000 для работы над интерфейсом; этот процесс не предоставляет Worker API регистрации. pnpm build / pnpm start проверяют обычный Next.js build. next.config.ts сохраняет agentRules: false, чтобы Next не изменял AGENTS.md.

## Команды

| Команда | Назначение |
|---|---|
| pnpm dev | Разработка интерфейса Next.js |
| pnpm build / pnpm start | Обычная production-сборка / локальный Next.js |
| pnpm build:site | Static UI + серверный Worker + assets + миграции в dist |
| pnpm preview:site | Локальный Worker с настоящим auth API |
| pnpm typecheck | Строгий TypeScript приложения, тестов и Worker |
| pnpm lint | ESLint, без допустимых warnings |
| pnpm test | Свежая build:site, отдельная тестовая D1 и полный Playwright suite |
| pnpm test:watch | Playwright UI; перед запуском подготовить локальное окружение, build:site и тестовую D1 |
| pnpm db:migrate:site | Только локальные миграции аккаунтов сайта |

Для тестов установить браузер: pnpm exec playwright install chromium --only-shell. В Linux: добавить --with-deps. Установленный Edge можно использовать через PLAYWRIGHT_CHANNEL=msedge; используются отдельные профили, пользовательская сессия браузера не читается. Результаты и screenshots находятся в ignored test-results.

Unit suite/Vitest, format/Prettier, env validation основного приложения, Money и PostgreSQL db:generate/db:migrate/db:seed остаются задачами PHASE 0. Не добавлять пустые scripts и не считать их выполненными.

## Устройство сайта

- src/app и src/components — публичные страницы, формы, 3D и кабинет.
- worker/auth.ts — единственная конфигурация Better Auth; worker/index.ts — origin/consent/body checks, разрешённые endpoints, проверка кабинета, safe responses и security headers.
- drizzle/0000_site_accounts.sql — схема аккаунтов, сессий и лимитов, сгенерированная из Better Auth. Финансовых таблиц нет.
- .openai/hosting.json — ID Sites и binding DB. Production env хранится в Sites.
- scripts/build-site.mjs — пакет публикации в dist; runtime secrets не копируются.
- tests/site.spec.ts — desktop/mobile, WebGL/fallback/reduced motion, точный учебный пример, auth lifecycle, изоляция, consent/origin/body/rate limits и 404.

Сайт использует document navigation: каждый переход в кабинет проходит серверную проверку. Next client routing для этого контура не используется. Соответствующие две рекомендации Next ESLint отключены с объяснением; остальные правила сохранены. ESLint 9.39.5 выбран по заявленным peer dependencies плагинов Next; переход на ESLint 10 запланирован после их поддержки.

## Публикация и секреты

Sites размещает Worker и D1 для регистрации. PostgreSQL/NUMERIC/RLS остаются архитектурой финансового приложения. Учебное демо изолировано и подписано; product LLM, реальные документы, платежи и бизнес permissions ещё не включены.

Перед публикацией: typecheck → lint → pnpm test (включает свежую production-сборку) → git diff/check/stat/status → commit и push точного source state. Archive должен быть построен из этого commit. Только сохранённая версия отправляется в deploy; проверяется конечный статус и общедоступный URL.

BETTER_AUTH_SECRET и SITE_URL — runtime env. .env.example содержит только пустые значения. Реальные секреты не записываются в код, Git, docs, вывод или снимки. .gitignore исключает .env*, .dev.vars*, .wrangler, node_modules, .next, out, dist и результаты тестов.

## Git workflow

main; по необходимости короткие feature branches. Небольшие коммиты с feat:, fix:, test:, docs:, chore:. Проверять полный diff, включая новые файлы. Без отдельной команды запрещены reset --hard, clean -fd, force push, удаление важных веток/БД, массовое удаление данных и несвязанные изменения production.

## Инструменты

Новые Skills/MCP не устанавливались. Использованы уже доступный Sites для размещения, Git/gh для GitHub, публичная документация и Playwright для изолированной проверки приложения. Доступ LLM к базе сайта не предоставляется.

Официальные основания: [Sites](https://github.com/openai/sites), [Better Auth D1](https://better-auth.com/blog/1-5#cloudflare-d1-support), [rate limits](https://better-auth.com/docs/concepts/rate-limit), [Cloudflare assets](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/). Фактические результаты — TASKS.md.
