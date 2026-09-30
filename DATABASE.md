# PostgreSQL: логическая схема

## Статус
Целевая схема для поэтапной реализации; SQL/миграции ещё не созданы. Таблицы добавляются только вместе с проверяемым модулем.
Финансовые определения — BUSINESS_RULES.md, RLS и полномочия — SECURITY.md.
Глобальны users, auth-таблицы, currencies, permissions. Остальные предметные данные принадлежат business. businesses — корень tenant с PK id без ссылки business_id на самого себя; служебные глобальные исключения перечислены ниже.

## Общие соглашения
PK каждой обычной таблицы = id UUID, если строка ниже не указывает другой PK.
Каждая дочерняя tenant-таблица содержит business_id NOT NULL → businesses.id; для PK id также UNIQUE(business_id,id).
Все её FK к tenant-объектам составные: (business_id, target_id) → (business_id,id).
Для связей, обязанных оставаться в одной организации, добавляются organization_id и соответствующие UNIQUE/FK. Совпадение UUID само по себе не проверяет tenant/организацию.
Общие поля: created_at, где применимо updated_at, created_by_member_id → business_members, version для конкурентного изменения. Даты хозяйственных событий — date, технические моменты — timestamptz. Контракт дат и API-имён — BUSINESS_RULES.md §12.
PK/UNIQUE дают индексы. Ниже U — unique, I — B-tree. Для tenant-таблиц business_id подразумевается первым полем каждого указанного индекса.
Все часто используемые FK покрываются индексом с начальным набором FK-полей; не создавать дубли при наличии подходящего составного индекса.
ON DELETE RESTRICT для финансовых оснований; каскадное удаление финансовой истории запрещено.
Стрелка поля означает FK. 1:N задаётся FK дочерней таблицы; U(FK) даёт 1:1; таблица связей — M:N.

## Точные значения
Типы колонок, precision/scale, округление и формат обмена задаёт BUSINESS_RULES.md §11 (Money Policy); схема обязана им соответствовать.
Пределы проверяются до реализации на максимумах бизнеса. Никаких float/real/double precision, NaN или Infinity для финансов.
Доли хранятся долями единицы, проценты UI преобразуются явно. Валюта → currencies.code.
numeric передаётся строкой; Decimal в расчётах. Округление итогов по правилам валюты, не просто по scale.
JSONB — проверяемые нефинансовые параметры/снимки; AI-копии денежных значений только decimal strings. Журнал и суммы документов — типизированные колонки.

## Идентификация и доступ
| Таблица | Назначение / основные поля и FK | PK (если не id); обязательные дополнительные индексы |
|---|---|---|
| users | email_normalized, display_name, verified_at, status; общая идентичность Better Auth | U(email_normalized) |
| auth_accounts | user_id → users, provider_id, provider_account_id, защищённые credentials | U(provider_id,provider_account_id); I(user_id) |
| auth_sessions | user_id → users, token, expires_at; поля по согласованной схеме Better Auth | U(token); I(user_id); I(expires_at) |
| auth_verifications | identifier, value, expires_at; схема провайдера auth | I(identifier); I(expires_at) |
| auth_two_factors | user_id → users, зашифрованный секрет, recovery-данные по схеме MFA | U(user_id) |
| currencies | code, name, minor_units | PK code |
| permissions | code, description, допустимые scope_types, sensitivity | PK code |
| businesses | name, status, base_currency_code → currencies, timezone | I(status,created_at) |
| business_members | user_id → users, status, joined_at, authorization_version | U(user_id); глобальный I(user_id,status,business_id) |
| roles | code, name, protected | U(code) |
| role_permissions | role_id → roles, permission_code → permissions, scope_type | U(role_id,permission_code,scope_type) |
| member_roles | member_id → business_members, role_id → roles, valid_from/to | U(member_id,role_id) для одного действующего назначения |
| role_scope_bindings | member_role_id → member_roles, role_permission_id → role_permissions, organization_id/department_id/warehouse_id → соответствующий объект | I(member_role_id,role_permission_id); отдельные FK-индексы |
| report_access_grants | member_role_id → member_roles, report_code, доступные показатели, детализация, export_allowed, область | U(member_role_id,report_code) для одной конфигурации |
| business_invitations | email, invited_by → business_members, token_hash, expires_at, status | U(token_hash); I(email,status) |
| invitation_roles | invitation_id → business_invitations, role_id → roles | PK (business_id,invitation_id,role_id); I(role_id) |
| business_settings | typed settings: locale, fiscal_year_start, accounting_policy_version | PK business_id → businesses |
| business_modules | module_code, status, template_version, enabled_at | PK (business_id,module_code) |
| organizations | name, legal_details, status | I(name) |
| departments | organization_id → organizations, parent_id → departments, code, name | U(organization_id,code) |
| document_status_events | document_id → documents, effective_at, recorded_at, old/new state, actor → business_members | I(document_id,effective_at,id) |

Auth-схема уточняется по закреплённой версии библиотеки; это не второй users и не финансовые accounts. Секреты auth не доступны tenant-API.
Для role_scope_bindings проверяется соответствие роли обоим FK и допустимость ровно нужного типа объекта. SELF/ASSIGNED вычисляются политикой, не произвольными клиентскими IDs.
Периоды назначений/цен/правил не должны иметь запрещённых пересечений; обеспечивается DB-ограничением либо сериализованной проверкой, не только UI.

## Контрагенты и сотрудники
| Таблица | Назначение / основные поля и FK | PK/индексы |
|---|---|---|
| parties | kind, display_name, contacts, tax_identifier, archived_at | I(display_name); I(tax_identifier) |
| customers | party_id → parties, payment_terms, credit_limit | U(party_id) |
| suppliers | party_id → parties, payment_terms | U(party_id) |
| employees | party_id → parties, member_id → business_members необязательно, employee_number, status | U(party_id); U(employee_number); частичный U(member_id) |
| employment_assignments | employee_id → employees, organization_id → organizations, department_id → departments, schedule_id → work_schedules, position, valid_from/to | I(employee_id,valid_from); I(organization_id,valid_to) |

Контрагент может иметь обе роли. Персональные поля сотрудника защищаются отдельно, в том числе через parties. Employee не равен user.

## Документы и журнал
| Таблица | Назначение / основные поля и FK | PK/индексы |
|---|---|---|
| documents | organization_id → organizations, document_type, number, document_date, status, version, reversal_of_id → documents | U(organization_id,document_type,number) для присвоенных номеров; I(document_type,document_date); I(status,created_at) |
| document_lines | document_id → documents, line_no, description | U(document_id,line_no) |
| financial_categories | code, name, category_type, parent_id → financial_categories | U(code) |
| ledger_accounts | code, name, account_class, parent_id → ledger_accounts, status | U(code) |
| accounting_periods | organization_id → organizations, start_date, end_date, status | U(organization_id,start_date); I(organization_id,end_date) |
| journal_entries | document_id → documents, organization_id → organizations, period_id → accounting_periods, recognition_date, event_key, status, reversal_of_id → journal_entries | U(document_id,event_key); I(organization_id,recognition_date) |
| journal_lines | journal_entry_id → journal_entries, line_no, ledger_account_id → ledger_accounts, debit/credit, amount_base, amount_original, currency_code → currencies, rate, category_id → financial_categories, party_id → parties, source_line_id → document_lines | U(journal_entry_id,line_no); I(ledger_account_id,journal_entry_id); I(party_id,journal_entry_id) |

Типизированный заголовок документа использует PK id, который одновременно FK → documents.id. Аналогично типизированная строка id → document_lines.id.
Проверяются тип документа, соответствие строки заголовку, организация, период и tenant.
Одна сторона проводки, положительная сумма; баланс всего journal_entry в базовой валюте. Межстрочный баланс проверяется механизмом проведения/отложенным триггером, не построчным CHECK.
Начальные остатки и сторно — отдельные документы. Проведённые записи неизменяемы.

## Деньги и взаиморасчёты
| Таблица | Назначение / основные поля и FK | PK/индексы |
|---|---|---|
| accounts | organization_id → organizations, code, kind, currency_code → currencies, ledger_account_id → ledger_accounts, status | U(organization_id,code) |
| payments | id → documents, direction IN/OUT/TRANSFER, kind, party_id → parties (NULL для перевода), amount, currency_code → currencies, payment_date, paid_at nullable, refund_of_payment_id → payments nullable, purpose, provider_code/external_id | I(party_id,payment_date); I(refund_of_payment_id); частичный U(provider_code,external_id) |
| cash_transactions | payment_id → payments, account_id → accounts, direction, flow_kind EXTERNAL/INTERNAL_TRANSFER, amount, payment_date, occurred_at nullable, journal_line_id → journal_lines, reversal_of_id → cash_transactions для технического исправления | I(account_id,payment_date,id); I(reversal_of_id); U(journal_line_id) |
| obligations | organization_id → organizations, party_id → parties, kind, debit/credit side, amount, currency_code → currencies, due_date, document_id → documents, journal_line_id → journal_lines, installment_no | I(party_id,currency_code,due_date); I(kind,due_date); U(journal_line_id,installment_no) |
| settlement_allocations | debit_obligation_id/credit_obligation_id → obligations, amount, effective_date, document_id → documents, line_no, reversal_of_id → settlement_allocations | I(debit_obligation_id); I(credit_obligation_id); U(document_id,line_no) |
| planned_cash_flows | organization_id → organizations, account_id → accounts, party_id → parties, obligation_id → obligations при наличии, planned_date, amount, currency_code → currencies, scenario_code, status | I(scenario_code,planned_date,status) |

obligations — субрегистр взаиморасчётов, включая начисленные требования и суммы для зачёта. Продажа создаёт требование, оплата — противоположную сумму; allocation связывает их. Незачтённая сумма классифицируется как аванс либо неразнесённая оплата.
Проверяются контрагент, организация, валюта, направления и доступные остатки. Рассрочка — несколько obligations на одну строку с installment_no, сумма графика сверяется с основанием.
Распределения/их сторно сохраняют историю дат. Проверки выполняются с блокировкой источников.
Каждый денежный счёт должен иметь однозначную аналитику журнала: либо отдельный ledger account, либо обязательный account_id в соответствующей строке; для MVP выбирается отдельный ledger account на accounts и U(ledger_account_id).
Внутренний перевод — две связанные одним payment_id ноги с flow_kind INTERNAL_TRANSFER, разными accounts и равными суммами в одной валюте; обе проводятся атомарно и исключаются из общего cash flow бизнеса. Комиссия — отдельная внешняя операция.
flow_kind и связь исправления задаются backend по документу, не произвольным полем формы. Техническое исправление ссылается на исходную денежную строку и документ сторно; проверяются tenant, организация, счёт, валюта, обратное направление и доступная для исправления сумма. Циклы ссылок запрещены.
Реальный возврат — самостоятельная внешняя операция с фактическим направлением и датой; reversal_of_id для неё не используется. При отчёте техническое исправление уменьшает исходную категорию потока, а реальный возврат попадает в поток по своему направлению.

### Представления, не самостоятельные финансовые таблицы
income_entries — представление внешних поступлений денег из cash_transactions с проведёнными payments/documents и journal_entries; логический ключ cash_transaction_id. Поля: business_id, organization_id, account_id, payment_id, cash_transaction_id, payment_date, occurred_at nullable, currency_code, signed_amount, исходная строка для технического исправления. Внутренние переводы и начальные остатки исключены. Техническое сторно входящего потока даёт отрицательный вклад в поступления; реальный возврат клиенту относится к выплатам.
recognized_income_entries — проведённые строки признанных доходов из journal_lines/journal_entries и ledger_accounts, с recognition_date и видом дохода REVENUE/OTHER; логический ключ journal_line_id. Сумма credit − debit, техническое закрытие исключено. Только это представление доходов используется для выручки и прибыли.
expense_entries — проведённые строки признанных расходов; логический ключ journal_line_id.
debts — остатки обязательств по начислениям и зачётам на дату; логический ключ obligation_id для заданного D.
У обычных views нет собственного PK/FK/индексов; используются индексы источников. income_entries и recognized_income_entries имеют разные основания и даты и не подменяют друг друга. Представления сохраняют RLS/права вызывающего и не дают обход доступа.
Остатки/прибыль не являются редактируемыми значениями; возможные кэши восстанавливаются и сверяются.

## Каталог и продажи
| Таблица | Назначение / основные поля и FK | PK/индексы |
|---|---|---|
| units | code, name, dimension, quantity_precision | U(code) |
| products | type PRODUCT/SERVICE/MANUFACTURED_PRODUCT, sku, name, base_unit_id → units, parent_product_id → products, roles, typed attributes | U(sku); I(type,archived_at); I(parent_product_id) |
| services | product_id → products, duration_norm, execution_method | PK product_id; только подтип SERVICE |
| product_unit_conversions | product_id → products, from/to_unit_id → units, factor | U(product_id,from_unit_id,to_unit_id) |
| product_prices | product_id → products, price_type, amount, currency_code → currencies, valid_from/to | I(product_id,price_type,valid_from) |
| orders | id → documents, customer_id → customers, currency_code → currencies, due_date, fulfillment_status | I(customer_id,due_date); I(fulfillment_status,due_date) |
| order_items | id → document_lines, order_id → orders, product_id → products, quantity, unit_id → units, price, discount, tax, total, configuration | I(order_id); I(product_id,order_id) |
| sales | id → documents, customer_id → customers, recognition_date, original_sale_id → sales | I(customer_id,recognition_date) |
| sale_items | id → document_lines, sale_id → sales, order_item_id → order_items, product_id → products, quantity, price, discount, tax, total, original_item_id → sale_items | I(sale_id); I(order_item_id); I(product_id,sale_id) |
| purchases | id → documents, supplier_id → suppliers, currency_code → currencies, expected_date, fulfillment_status | I(supplier_id,expected_date) |
| purchase_items | id → document_lines, purchase_id → purchases, product_id → products, quantity, unit_id → units, price, discount, tax, total | I(purchase_id); I(product_id,purchase_id) |
| purchase_receipts | id → documents, supplier_id → suppliers, received_date, original_receipt_id → purchase_receipts | I(supplier_id,received_date) |
| purchase_receipt_items | id → document_lines, receipt_id → purchase_receipts, purchase_item_id → purchase_items, product_id → products, quantity, cost, original_item_id → purchase_receipt_items | I(receipt_id); I(purchase_item_id) |

Заказ/поступление/реализация/оплата — разные документы. Один заказ допускает частичные реализации. Возврат денег не подменяет возврат товара.
Варианты имеют конкретный SKU; параметры изделия на заказ сохраняются в строке. Финансовые суммы вне JSON.

## Склад
| Таблица | Назначение / основные поля и FK | PK/индексы |
|---|---|---|
| warehouses | organization_id → organizations, code, name | U(organization_id,code) |
| inventory_locations | warehouse_id → warehouses, code, kind | U(warehouse_id,code) |
| inventory_items | product_id → products, receipt_item_id → purchase_receipt_items при наличии, lot_code, serial_number, dimensions, received_at | I(product_id,received_at); частичный U(product_id,serial_number) |
| inventory_transactions | id → documents, transaction_type, occurred_at, source_document_id → documents | I(transaction_type,occurred_at) |
| inventory_transaction_lines | id → document_lines, transaction_id → inventory_transactions, inventory_item_id → inventory_items, from/to_location_id → inventory_locations, quantity_base, source_line_id → document_lines | I(transaction_id); I(inventory_item_id,transaction_id); индексы мест хранения |
| inventory_reservations | order_item_id → order_items, product_id → products, inventory_item_id → inventory_items при наличии, location_id → inventory_locations, quantity, status | I(order_item_id); I(product_id,status) |
| inventory_valuation_entries | movement_line_id → inventory_transaction_lines, product_id → products, inventory_item_id → inventory_items, amount, valuation_date, method/version, journal_line_id → journal_lines | I(movement_line_id); I(product_id,valuation_date) |
| inventory_cost_allocations | incoming/outgoing_entry_id → inventory_valuation_entries, quantity, amount | U(outgoing_entry_id,incoming_entry_id); I(incoming_entry_id) |
| inventory_reorder_rules | product_id → products, warehouse_id → warehouses, minimum_quantity, target_quantity | U(product_id,warehouse_id) |

Количество выводится из движений, стоимость — из оценок; никаких свободно редактируемых balances. Направления приход/выбытие задаются типом события, ненужная сторона места может быть NULL. Перемещение требует обе стороны.
Услуга не создаёт складской остаток. Стоимость конкретного листа и пригодного остатка распределяется без дублирования.
Универсальная конвертация лист→м² недопустима при разных размерах.

## Производство
| Таблица | Назначение / основные поля и FK | PK/индексы |
|---|---|---|
| bom_versions | product_id → products, version_number, base_output_quantity, valid_from/to, status, parameters | U(product_id,version_number); I(product_id,status,valid_from) |
| product_materials | bom_version_id → bom_versions, line_no, component_product_id → products, quantity, unit_id → units, dimensional_rule, loss_rule | U(bom_version_id,line_no); I(component_product_id) |
| bom_operations | bom_version_id → bom_versions, sequence_no, work_type, duration_norm, costing_rule | U(bom_version_id,sequence_no) |
| production_records | id → documents, product_id → products, bom_version_id → bom_versions, order_item_id → order_items, planned_quantity, dates, status | I(status,planned_end_date); I(order_item_id); I(product_id,started_at) |
| production_material_requirements | production_record_id → production_records, component_product_id → products, unit_id → units, bom_material_id → product_materials, quantity, snapshot_rule, line_no | U(production_record_id,line_no) |
| production_operations | production_record_id → production_records, bom_operation_id → bom_operations, sequence_no, planned_work, status | U(production_record_id,sequence_no) |
| production_outputs | production_record_id → production_records, kind, product_id → products, quantity, output_date, movement_line_id → inventory_transaction_lines | I(production_record_id,output_date); U(movement_line_id) |
| production_cost_entries | production_record_id → production_records, cost_type, amount, valuation_entry_id → inventory_valuation_entries ИЛИ salary_entry_id → salary_entries ИЛИ journal_line_id → journal_lines, status | I(production_record_id,cost_type); FK-индексы источников |
| production_cost_allocations | cost_entry_id → production_cost_entries, production_output_id → production_outputs при наличии, target_kind, amount, calculation_version | I(cost_entry_id); I(production_output_id) |

У затраты ровно один типизированный источник. У распределения target_kind различает выпуск/НЗП/потери. Суммы и область задания сверяются.
Снимок требований/операций защищён от изменения исходной BOM. Циклы состава запрещены. Полуфабрикат включается по стоимости один раз.

## Зарплаты
| Таблица | Назначение / основные поля и FK | PK/индексы |
|---|---|---|
| work_schedules | code, name, timezone, version_number, rules | U(code,version_number) |
| work_calendar_days | schedule_id → work_schedules, work_date, day_type, norm_hours | U(schedule_id,work_date) |
| salary_rules | rule_code, version_number, component_type, rate/amount, currency_code → currencies, basis, rounding, restrictions | U(rule_code,version_number) |
| employee_salary_rules | assignment_id → employment_assignments, salary_rule_id → salary_rules, valid_from/to, compatibility_group | I(assignment_id,valid_from,valid_to) |
| salary_periods | organization_id → organizations, start/end_date, pay_date, status | U(organization_id,start_date,end_date) |
| salary_runs | salary_period_id → salary_periods, run_number, kind, status, actor → business_members | U(salary_period_id,run_number) |
| salary_statements | id → documents, salary_run_id → salary_runs, employee_id → employees, assignment_id → employment_assignments, currency_code → currencies | U(salary_run_id,assignment_id) |
| salary_entries | id → document_lines, statement_id → salary_statements, rule_id → salary_rules, deduction_authorization_id → deduction_authorizations при необходимости, kind, quantity, base, rate, amount, effective_date, original_entry_id → salary_entries | I(statement_id); I(rule_id) |
| work_records | employee_id → employees, work_date, hours/days/accepted_quantity, order_item_id → order_items, production_operation_id → production_operations, status, approved_by → business_members | I(employee_id,work_date,status); I(production_operation_id) |
| sale_employee_allocations | sale_item_id → sale_items, employee_id → employees, allocation_group, share | U(sale_item_id,employee_id,allocation_group); I(employee_id) |
| employee_awards | id → documents, employee_id → employees, salary_period_id → salary_periods, amount, reason, approval | I(employee_id,salary_period_id) |
| deduction_authorizations | employee_id → employees, kind, legal_basis, limits, recipient_party_id → parties, source_document_id → documents, valid_from/to | I(employee_id,valid_from,valid_to) |
| salary_entry_sources | salary_entry_id → salary_entries, work_record_id → work_records ИЛИ sale_allocation_id → sale_employee_allocations ИЛИ award_id → employee_awards ИЛИ assigned_rule_id → employee_salary_rules, base, contribution, source_snapshot | I(salary_entry_id); частичные U по entry+выбранный источник |

Один источник на строку связи; у начисления может быть много источников. Оклад связывается с назначенным правилом и нужным табелем отдельными связями.
Дедупликация начислений охватывает правило, источник, период и вид расчёта; повтор/коррекция различаются.
Авансы и выплаты через общие payments/obligations/allocations. Табель не равен утверждённому начислению. Налоговые правила страны уточняются отдельным модулем, произвольные формулы не исполняются.

## ИИ, файлы и эксплуатация
| Таблица | Назначение / основные поля и FK | PK/индексы |
|---|---|---|
| ai_conversations | member_id → business_members, title, retention_policy | I(member_id,updated_at) |
| ai_messages | conversation_id → ai_conversations, role, content, created_at | I(conversation_id,created_at,id) |
| ai_runs | message_id → ai_messages, model, prompt_version, status, duration | I(message_id); I(status,created_at) |
| ai_fact_sets | member_id → business_members, filters, period, data_version, completeness, payload, expires_at | I(member_id,created_at); I(expires_at) |
| ai_tool_calls | ai_run_id → ai_runs, sequence_no, tool_name, validated_arguments, fact_set_id → ai_fact_sets, status | U(ai_run_id,sequence_no) |
| ai_insights | fact_set_id → ai_fact_sets, ai_run_id → ai_runs, kind, text, severity, status | I(kind,created_at); I(status,created_at) |
| action_proposals | requested_by → business_members, action_type, document_id → documents ИЛИ employee_id → employees, target_version, payload/hash, expires_at, status | I(requested_by,status,created_at); I(expires_at) |
| action_approvals | proposal_id → action_proposals, approver_id → business_members, payload_hash, approved_at | U(proposal_id,approver_id) |
| action_executions | proposal_id → action_proposals, idempotency_key, status, result_document_id → documents, error_code | U(proposal_id); U(idempotency_key) |
| notifications | member_id → business_members, kind, message, document_id → documents, insight_id → ai_insights, read_at | I(member_id,created_at); частичный индекс непрочитанных |
| files | storage_key, original_name, mime, size_bytes, checksum, status, uploaded_by → business_members | U(storage_key); I(uploaded_by,created_at) |
| document_attachments | document_id → documents, file_id → files | PK (business_id,document_id,file_id); I(file_id,document_id) |
| audit_logs | actor_member_id → business_members при наличии, system_actor, action, entity_type/id, occurred_at, request_id, result, previous_value, new_value, metadata, schema_version | I(entity_type,entity_id,occurred_at); I(actor_member_id,occurred_at) |
| security_events | actor при наличии, event_type, occurred_at, request_id, reason, безопасные метаданные | I(event_type,occurred_at); I(request_id) |
| idempotency_requests | actor_member_id → business_members, operation_scope, request_key, request_hash, status, result_document_id → documents, expires_at | U(actor_member_id,operation_scope,request_key); I(expires_at) |
| outbox_events | event_type, document_id → documents при наличии, payload, available_at, status, attempts | частичный I(available_at,id) ожидающих |

Неавторизованные события входа не имеют tenant: хранятся в отдельном глобальном auth security log с отдельными правами, а не через nullable business_id в tenant-таблицах.
Audit entity_type/id — намеренно историческая ссылка, может пережить удалённый черновик; для финансовых оснований такой подход запрещён.
Очередь pg-boss использует собственную служебную схему, миграции её версии контролируются. Не смешивать её таблицы с предметными.
AI payload не источник финансовой истины. Схема action_proposals расширяется типизированно; нет произвольного SQL/исполняемого JSON.

## Контроль целостности и границы
RLS на всех tenant-таблицах, отдельные политики глобальных auth. Views не обходят права.
Runtime не может редактировать проведённый журнал, audit или схему. Пересечения периодов/правил, равенство проводок и сумма allocation — транзакционные/межстрочные проверки.
Проверки миграций: чистая БД, обновление предыдущей схемы, runtime-RLS, cross-tenant FK, конкуренция, numeric и восстановление.
Отраслевые авто/рецептуры/сметы, SaaS billing, сложные налоги и универсальные custom fields проектируются отдельными миграциями. Их отсутствие в первом срезе не заменяется непроверяемым JSON.

## Уточнения ограничений MVP
- organizations: UNIQUE(business_id) обеспечивает одну организацию MVP; переход к нескольким — отдельная миграция. Валюта всех денежных объектов равна businesses.base_currency_code; проверка сервиса и constraint trigger внутри transaction. Запрет смены валюты/часового пояса после первого проведения — BUSINESS_RULES.md.
- business_members: U(user_id) в таблице означает UNIQUE(business_id,user_id), а не глобальную уникальность user_id. Глобальный I(user_id,status,business_id) ускоряет поиск членств пользователя.
- business root, создание первого membership и начальных ролей — через узкий bootstrap-контракт из SECURITY.md. created_by_member_id для самой начальной записи допускает NULL до создания member в той же transaction; итоговый аудит содержит actor и member.
- documents.status валидируется по document_type; статусы исполнения orders и salary_runs отдельны. journal_entries.status не меняется на REVERSED: отчёт всегда включает POSTED-исходник и POSTED-коррекцию по своим датам. Матрица и история — BUSINESS_RULES.md §13.
- payments.refund_of_payment_id имеет составной FK, совпадающие организацию/валюту/контрагента, обратное внешнее направление; self-reference и циклы запрещены. Реальный возврат не использует cash_transactions.reversal_of_id.
- payment_date обязателен у payments и cash_transactions; FK/constraint trigger сверяет дату дочерних движений с документом. paid_at/occurred_at nullable; известный timestamp должен давать ту же payment_date в timezone бизнеса. Оба плеча перевода имеют одну дату.
- journal_entries.recognition_date находится в [accounting_periods.start_date,end_date); периоды одной организации не пересекаются. Блокировка периода сериализует проведение/закрытие. Структуру проводок, ограничение суммы зачётов и immutable POSTED проверяют SQL-ограничения/триггеры, а не только UI.
- audit_logs: previous_value и new_value — nullable JSONB с allowlist-проекцией, metadata — ограниченный JSONB, schema_version обязательна. Контракт и права — SECURITY.md. Ссылки денежных документов остаются типизированными; audit JSON не замена журналу.
- Глобальные инфраструктурные исключения: auth_security_events, auth_rate_limits и служебная схема pg-boss. Они не содержат tenant-финансов; tenant-операции пишут security_events с business_id. auth_rate_limits — схема Better Auth выбранной версии; tenant_rate_limits содержит business_id, action/bucket key, window_start/count/expires_at и уникальность по корзине. Срок жизни счётчиков ограничен; доступны только серверным ролям.
- Outbox создаётся при P06.1; до P13.3 события остаются PENDING без обещания выполненной доставки. Бизнес-проведение не ждёт worker. Потребитель по версии payload игнорирует повторно исполненные события, не рассылает устаревшие уведомления при первом запуске; применимость старой задачи перепроверяется.
