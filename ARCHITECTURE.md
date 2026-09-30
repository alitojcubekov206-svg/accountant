# Архитектура

## Статус и ответственность
Проектная спецификация целевой системы; в P00.1 подготовлен минимальный каркас Next.js. Реализованные части и проверки — TASKS.md; перечисление технологии здесь не означает её установки. Финансовые определения — BUSINESS_RULES.md, права — SECURITY.md, схема — DATABASE.md, AI-контракты — AI_RULES.md.

## Стек
- Next.js App Router, TypeScript strict, Node.js LTS: единый web/backend.
- Tailwind и shadcn/ui: дизайн-токены и только необходимые компоненты.
- Server Actions: мутации собственного UI; Route Handlers: AI streaming, файлы, webhooks и интеграции.
- PostgreSQL: журнал, ограничения, транзакции, numeric и RLS.
- Drizzle + node-postgres: типизированные запросы и контролируемый SQL.
- Zod: runtime-валидация внешних контрактов.
- Decimal.js: финансовая арифметика; точность и округление задаются явно.
- Better Auth: идентификация, сессии, восстановление доступа, MFA; бизнес-RBAC собственный.
- Amazon S3 за адаптером: приватные файлы; метаданные в БД.
- Recharts: только визуализация рассчитанных данных.
- OpenAI Responses API, официальный SDK: strict function calling за адаптером провайдера.
- pg-boss и отдельный Node worker: фоновые задания на PostgreSQL.
- Pino: структурированные технические логи; Sentry: ошибки; audit_logs: бизнес-аудит.
- Vitest: unit/integration; Playwright: e2e; ESLint: lint; Prettier: единственный форматтер; pnpm: package manager. Совместимые стабильные версии фиксируются lockfile; обновления отдельными PR.
Регион и провайдер managed PostgreSQL/вычислений выбираются до production. Модель AI — после eval; автоматической смены на latest нет.

## Слои и зависимости
UI → server entry point → application service → domain + database.
AI tool → тот же application service. Worker → тот же application service.
Server устанавливает личность; services/access проверяет актуальное членство, permission и область. Сервис управляет транзакцией и возвращает DTO.
Domain содержит чистые формулы и инварианты, не зависит от React, Next.js, БД или SDK.
Database содержит schema, репозитории и аналитические SQL-запросы. Финансовые SQL-агрегации используют единые определения и сверяются с журналом.
Интеграции не решают, разрешено ли действие. AI не обращается к БД напрямую.
HTTP/LLM/почта не выполняются внутри открытой финансовой транзакции.

## Структура
- src/app — маршруты, layouts, страницы, HTTP.
- src/components/ui, layout, shared — общие компоненты.
- src/features/<область> — UI, hooks, view models конкретного модуля.
- src/server — auth, request context, actions, queries, HTTP errors, rate limits, env.
- src/services — прикладные сценарии и авторизация.
- src/domain — money, finance, payroll, inventory, production, access.
- src/database — client, tenant-context, transactions, schema, repositories, queries.
- src/ai — orchestrator, tools, prompts, contracts, проверка оснований ответа.
- src/integrations — OpenAI, S3, почта, pg-boss.
- src/worker — обработчики, outbox.
- src/validation — Zod-схемы; src/types — общие DTO; локальные типы остаются у владельца.
- src/lib — небольшие технические утилиты, без бухгалтерской логики.
- database/migrations и database/seeds — миграции и инициализация.
- tests/unit, integration, e2e, ai, support.
Корневой database содержит артефакты, src/database — runtime-доступ. Не создаём пустые каталоги заранее.
Запрещены циклические зависимости и общий barrel, смешивающий клиентские и серверные модули.

## Транзакции и деньги
Документ, обязательства/погашения, проводки, аудит, результат идемпотентности и необходимый outbox сохраняются атомарно. Ключ идемпотентности защищает повтор команды; конкуренция остатков и погашений контролируется блокировками.
Bootstrap membership и создание первого бизнеса определены в SECURITY.md; tenant-контекст устанавливается локально в транзакции на одном соединении. Runtime не владелец таблиц и не BYPASSRLS.
Строки numeric не преобразуются в number; денежный ввод — строки, проверяемые Zod. Для API — decimal string + currency.
В графики поступают только нормализованные координаты; подписи/экспорт берут исходные точные строки. Координаты не используются для обратного расчёта денег.
Reconciliation проверяет журнал, денежные движения, взаиморасчёты и складские оценки.

## Фоновые задачи
Импорт, длительная калькуляция, отчёты, обработка файлов и уведомления выполняются worker.
Outbox связывает изменение и постановку работы. Доставка может повториться; обработчики идемпотентны.
Задание содержит tenant и исполнителя; права для пользовательского экспорта/действия повторно проверяются. Техническое обслуживание явно отделено от работы по поручению пользователя.
Не запускаем произвольные задачи через AI.

## Auth и storage
Better Auth использует общую users и auth_sessions/auth_accounts/auth_verifications/auth_two_factors; auth_accounts не финансовые accounts. Нет дублирующего organization plugin: членство управляется business_members.
Файлы: авторизация → уникальный ключ → ограниченная загрузка → проверка размера/типа/содержимого → доступность. Карантин до проверки. Выдача временной ссылки после проверки прав.
Бакеты закрыты; файл не становится доступным только из-за знания пути.

## Окружения
Dev: локальные web/worker, PostgreSQL в Docker, синтетические данные и тестовая почта.
Test/CI: отдельная одноразовая PostgreSQL, реальные миграции и runtime-роль; внешние API подменены. SQLite не заменяет RLS/transaction tests.
Staging: production-подобная сборка, отдельные БД, storage и ключи, синтетические данные.
Production: контейнеры web/worker, managed PostgreSQL с PITR, приватный S3, мониторинг.
Никаких общих production-секретов/данных с preview/dev/test. Проверка восстановления обязательна до выпуска; RPO/RTO ещё определяются.

## Конфигурация
APP_ENV, APP_URL, LOG_LEVEL; DATABASE_URL, AUTH_DATABASE_URL, WORKER_DATABASE_URL; MIGRATION_DATABASE_URL только для мигратора.
BETTER_AUTH_SECRET/URL; S3_REGION/BUCKET/ENDPOINT при необходимости; OPENAI_API_KEY, AI_MODEL, AI-лимиты; почтовые параметры; SENTRY_DSN/ENVIRONMENT/RELEASE.
Секреты — в менеджере секретов, не Git. .env.example без значений. Zod проверяет конфигурацию процесса при старте.
NEXT_PUBLIC_* доступны браузеру и обычно фиксируются сборкой: никаких секретов. Инфраструктурные credentials по возможности временные.

## Миграции и seed
Схема → проверяемая миграция → тест на чистой и предыдущей БД → staging → отдельный production job.
RLS, триггеры и специализированные ограничения входят в версионируемые SQL-миграции. Никакого schema push в production, автоматической миграции при каждом старте или редактирования применённой миграции.
Expand → backfill → switch → contract для несовместимых изменений. Откат приложения проверяется на совместимость; исправляющая миграция предпочтительнее удаления финансовой истории.
Seed: системные справочники отдельно от demo; production без demo и пользователей с известными паролями. Идемпотентность не означает перезапись настроек бизнеса.

## Наблюдаемость и проверки
Pino: request/job ID, действие, длительность, результат; секреты и финансовые документы исключены.
Sentry: исключения, окружение, release; чувствительные данные удаляются до отправки, replay первоначально выключен.
Аудит отдельно и в транзакции с изменением. Мониторим ошибки проведения, сверки, очередь и интеграции.
Будущие проверки: eslint, tsc --noEmit, vitest run, playwright test, next build, git diff --check. Матрица сценариев — [TESTING.md](TESTING.md). Команды scripts и их фактическая готовность определены в package.json и README.
Документационные изменения проверяются ссылками и согласованностью, без установки приложения ради lint.

## Решения и ввод зависимостей
Выбран один стек для MVP, замен по умолчанию нет. Версии фиксируются в package.json/packageManager/lockfile при P00.1 после проверки совместимости; существующий manifest проверяется в P00.1. Не устанавливать все выбранные библиотеки заранее.

| Фаза | Зависимости и назначение |
|---|---|
| P00.1–P00.2 | Next.js/React/TypeScript; Tailwind для стилей; ESLint и Next config для lint; Prettier для format; Vitest для проверок; Zod для env/контрактов |
| P00.3–P00.4 | Decimal.js для точной арифметики; drizzle-orm, pg и drizzle-kit для PostgreSQL/миграций |
| PHASE 1 | Better Auth + Drizzle adapter и MFA; Pino для безопасных структурированных логов |
| PHASE 2 | Только используемые shadcn/ui компоненты и их необходимые зависимости; без второй UI-системы |
| PHASE 13 | pg-boss для worker/outbox, AWS S3 SDK для storage, Recharts для графиков |
| PHASE 14 | Официальный OpenAI SDK за AIProvider; без второго AI orchestration framework |
| PHASE 15 | Sentry для tracking исключений при подготовке staging; Pino уже работает с PHASE 1 |

Authorization реализует собственный services/access с типизированным permission registry; отдельная permissions-библиотека не нужна. PostgreSQL обслуживает shared rate limits; Redis не требуется.
AIProvider принимает нейтральные сообщения, JSON Schema tools и ограничения; возвращает нормализованные tool calls/usage/errors. OpenAI-specific типы остаются в integrations/openai. Модель не получает SQL, ключ БД или произвольный tool registry.
Deploy approach: OCI/Docker image web и отдельный worker на Linux, managed PostgreSQL с PITR, приватный Amazon S3; независимые secrets и БД для staging/production, отдельный job миграций до release, health checks, rollback образа только при совместимой схеме. Провайдер compute/БД и регион — закупочное решение до staging с реальными данными, а не альтернативный стек MVP. Сейчас ничего не развёртывается.
Бизнес-логика permissions расположена в services/access и domain/access, не в components. Error contract — SECURITY.md; деньги/время — BUSINESS_RULES.md. До появления worker outbox следует правилам DATABASE.md, фиктивная доставка не отмечается успешной.

## Публичный сайт раннего доступа (ADR-042)
Отдельный контур SITE-01, разрешённый 2026-09-30: Next.js static UI + Three.js → Worker HTTP boundary/Better Auth → D1 для identities, sessions и rate limits. Sites deploy: dist/server/index.js, dist/client и dist/.openai/hosting.json + drizzle migrations. Runtime env хранится у host, не в артефакте.
Учётный backend PostgreSQL/Drizzle/NUMERIC/RLS остаётся source of truth будущих PHASE. D1 не хранит финансовые операции и не заменяет эту схему. До включения учёта нужен согласованный переход auth identities; вторая независимая tenant-модель не создаётся.
