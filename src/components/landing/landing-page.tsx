"use client";

import { useEffect, useState } from "react";
import { FinanceScene } from "./finance-scene";
import { BrandMark, Icon } from "./icons";
import { SiteFooter } from "../site-chrome";

// Educational scenario from BUSINESS_RULES.md §5; never represents a user's accounts.
const scenarios = [
  { id: "advance", label: "01 · Аванс", revenue: "0", profit: "0", expenses: "0", cash: "130 000", debt: "0", progress: "30%", answer: "Клиент внёс 30 000 сом. Деньги уже на счёте, но заказ ещё не выполнен — выручка и прибыль пока равны нулю.", title: "Аванс — деньги, а не прибыль.", chart: "M0 90 L70 90 L140 60 L210 60 L280 60 L350 60 L420 60" },
  { id: "work", label: "02 · Исполнение", revenue: "100 000", profit: "30 000", expenses: "70 000", cash: "60 000", debt: "70 000", progress: "70%", answer: "Заказ выполнен: выручка 100 000 сом, расходы 70 000, прибыль 30 000. Денег осталось 60 000 сом. Клиент ещё должен 70 000.", title: "Прибыль и деньги — разные показатели.", chart: "M0 90 L70 90 L140 60 L210 60 L280 135 L350 135 L420 135" },
  { id: "paid", label: "03 · Оплата", revenue: "100 000", profit: "30 000", expenses: "70 000", cash: "130 000", debt: "0", progress: "100%", answer: "Клиент доплатил 70 000 сом. Долг закрыт, денег стало 130 000. Прибыль осталась 30 000: получение оплаты не создаёт выручку второй раз.", title: "Доплата закрывает долг.", chart: "M0 90 L70 90 L140 60 L210 60 L280 135 L350 135 L420 60" },
] as const;

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [scenarioIndex, setScenarioIndex] = useState(1);
  const scenario = scenarios[scenarioIndex] ?? scenarios[1];
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setPaused(media.matches);
    const frame = requestAnimationFrame(updateMotion); media.addEventListener("change", updateMotion);
    const closeMenu = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeMenu);
    return () => { cancelAnimationFrame(frame); media.removeEventListener("change", updateMotion); window.removeEventListener("keydown", closeMenu); };
  }, []);
  const closeMenu = () => setMenuOpen(false);

  return <>
    <a href="#main" className="skip-link">Перейти к содержимому</a>
    <header className="site-header shell">
      <a className="brand" href="#" aria-label="Accountant — на главную"><span className="brand-mark"><BrandMark /></span><span>accountant<span className="brand-dot">.</span></span><span className="brand-ai">AI</span></a>
      <nav className="desktop-nav" aria-label="Основная навигация"><a href="#features">Возможности</a><a href="#how-it-works">Как это работает</a><a href="#demo">Демо</a></nav>
      <div className="header-actions"><a className="login-link" href="/login/">Войти</a><a className="button button-dark header-cta" href="/register/">Начать бесплатно <Icon name="arrow" /></a></div>
      <button className="menu-button" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button>
      {menuOpen && <nav id="mobile-navigation" className="mobile-nav" aria-label="Мобильная навигация"><a onClick={closeMenu} href="#features">Возможности</a><a onClick={closeMenu} href="#how-it-works">Как это работает</a><a onClick={closeMenu} href="#demo">Посмотреть демо</a><a href="/login/">Войти</a><a href="/register/">Создать аккаунт</a></nav>}
    </header>

    <main id="main">
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow"><span className="status-dot" /> НОВЫЙ ВЗГЛЯД НА ФИНАНСЫ</p>
          <h1 id="hero-title">Ваш бизнес.<br />Вся картина.<br /><span>В объёме.</span></h1>
          <p className="hero-description">Когда цифры складываются в картину,<br className="desktop-break" /> принимать решения становится проще.<br className="desktop-break" /> Знакомьтесь с вашим будущим ИИ-бухгалтером.</p>
          <div className="hero-actions"><a href="/register/" className="button button-dark">Создать аккаунт <Icon name="arrow" /></a><a className="text-link" href="#demo">Исследовать демо <span>↗</span></a></div>
          <p className="hero-note"><Icon name="check" /> Бесплатный ранний доступ. Демо открыто всем.</p>
        </div>
        <div className="hero-visual">
          <span className="visual-index">FIG. 01 / FINANCIAL CLARITY</span>
          <FinanceScene paused={paused} resetKey={resetKey} />
          <div className="float-card float-card-top"><span className="float-icon"><Icon name="spark" /></span><div><small>МЕНЬШЕ ШУМА</small><strong>Больше ясности</strong></div><span className="float-dot" /></div>
          <div className="float-card float-card-bottom"><span className="float-icon dark"><Icon name="chart" /></span><div><small>ВСЯ КАРТИНА</small><strong>В одном пространстве</strong></div></div>
          <div className="scene-controls"><span><span className="tiny-dot" /> ИНТЕРАКТИВНАЯ 3D-СЦЕНА</span><div><button aria-label={paused ? "Продолжить анимацию" : "Приостановить анимацию"} aria-pressed={paused} onClick={() => setPaused(!paused)}><Icon name={paused ? "play" : "pause"} /></button><button aria-label="Сбросить поворот 3D-сцены" onClick={() => setResetKey(resetKey + 1)}><Icon name="reset" /></button></div></div>
          <p className="scene-hint">Потяните модель, чтобы сменить ракурс</p>
        </div>
      </section>

      <section className="value-strip shell" aria-label="Идея продукта"><div><span>01</span><p>Видеть <strong>всю картину</strong></p></div><div><span>02</span><p>Понимать <strong>каждую цифру</strong></p></div><div><span>03</span><p>Решать <strong>с уверенностью</strong></p></div><span className="strip-label">УЧЁТ С ЧЕЛОВЕЧЕСКИМ ЛИЦОМ</span></section>

      <section id="features" className="features-section shell" aria-labelledby="features-title">
        <div className="section-heading"><div><p className="eyebrow muted">ПРОСТРАНСТВО ВОЗМОЖНОСТЕЙ</p><h2 id="features-title">Всё связано.<br /><span>Всё понятно.</span></h2></div><p>Деньги, заказы и обязательства —<br />части одного бизнеса. Accountant<br />проектируется, чтобы объединить их.</p></div>
        <div className="feature-grid"><article className="feature-card feature-card-large"><span className="feature-icon"><Icon name="layers" /></span><p className="card-index">01 / ЕДИНАЯ КАРТИНА</p><h3>За цифрами<br />видно бизнес.</h3><p>Прибыль, остатки денег и долги показываются отдельно. У каждой суммы — своё основание.</p><div className="mini-stack" aria-hidden="true"><div className="mini-layer layer-back" /><div className="mini-layer layer-middle" /><div className="mini-layer layer-front"><BrandMark /><span>Всё на своих местах</span></div></div></article>
          <article className="feature-card"><span className="feature-icon"><Icon name="wallet" /></span><p className="card-index">02 / ФИНАНСЫ</p><h3>Деньги<br />под контролем.</h3><p>Доходы, расходы, счета и платежи в едином рабочем пространстве.</p><span className="feature-foot">Деньги ≠ прибыль <Icon name="arrow" /></span></article>
          <article className="feature-card"><span className="feature-icon"><Icon name="spark" /></span><p className="card-index">03 / ИИ-ПОМОЩНИК</p><h3>Объясняет.<br />Не выдумывает.</h3><p>Будущий помощник будет объяснять только подтверждённые и доступные вам показатели.</p><span className="feature-foot">Факты перед выводами <Icon name="arrow" /></span></article>
          <article className="feature-card feature-card-wide"><span className="feature-icon"><Icon name="shield" /></span><div><p className="card-index">04 / ВАШЕ ПРОСТРАНСТВО</p><h3>Правильным людям — правильный доступ.</h3><p>Проект предусматривает роли, изоляцию бизнесов и историю важных изменений.</p></div><span className="security-orbit" aria-hidden="true"><Icon name="shield" /></span></article>
        </div>
      </section>

      <section id="how-it-works" className="how-section shell" aria-labelledby="how-title"><p className="eyebrow muted">ОТ ДАННЫХ К РЕШЕНИЮ</p><div className="how-heading"><h2 id="how-title">Сначала факты.<br /><span>Потом понимание.</span></h2><p>Понятный путь от операции<br />до ответа на ваш вопрос.</p></div><div className="steps"><article><span className="step-number">01</span><h3>Соберите данные</h3><p>Заказы, начисления и платежи.<br />Каждое событие на своём месте.</p></article><article><span className="step-number">02</span><h3>Увидьте картину</h3><p>Что заработано, сколько денег<br />и кто кому должен.</p></article><article><span className="step-number">03</span><h3>Разберитесь в причинах</h3><p>От показателя — к деталям.<br />От деталей — к решению.</p></article></div></section>

      <section id="demo" className="demo-section" aria-labelledby="demo-title"><div className="shell"><div className="demo-heading"><div><p className="eyebrow"><span className="status-dot" /> ПОПРОБУЙТЕ СЕЙЧАС</p><h2 id="demo-title">Не просто цифры.<br /><span>Понятная история.</span></h2></div><p>Один заказ. Три этапа.<br />Посмотрите, как меняется картина.</p></div>
        <div className="demo-window"><div className="window-bar"><div className="window-dots"><i /><i /><i /></div><span>accountant / демонстрация</span><span className="demo-badge">ПРИМЕР ДАННЫХ</span></div>
          <div className="dashboard"><aside className="demo-sidebar" aria-hidden="true"><span className="sidebar-brand"><BrandMark /></span><span className="sidebar-item active"><Icon name="chart" /></span><span className="sidebar-item"><Icon name="wallet" /></span><span className="sidebar-item"><Icon name="layers" /></span><span className="sidebar-item"><Icon name="spark" /></span><span className="sidebar-bottom">a.</span></aside>
            <div className="demo-content"><div className="dashboard-heading"><div><small>ПРИМЕР · УСЛУГИ · СОМ</small><h3>Финансовый обзор</h3></div><span className="sample-label"><span className="tiny-dot" /> Учебный сценарий</span></div>
              <div className="scenario-tabs" aria-label="Этап заказа">{scenarios.map((item, index) => <button key={item.id} aria-pressed={scenarioIndex === index} onClick={() => setScenarioIndex(index)}>{item.label}</button>)}</div>
              <div className="metric-grid" aria-live="polite"><article><span>Выручка <Icon name="arrow" /></span><strong>{scenario.revenue}<small>сом</small></strong><p>Признанный доход</p></article><article className="metric-profit"><span>Прибыль до налога <Icon name="arrow" /></span><strong data-testid="profit-value">{scenario.profit}<small>сом</small></strong><p>Результат выполненной работы</p></article><article><span>Деньги на счёте <Icon name="arrow" /></span><strong data-testid="cash-value">{scenario.cash}<small>сом</small></strong><p>Доступный остаток</p></article></div>
              <div className="dashboard-bottom"><article className="cash-chart"><div className="panel-title"><h4>Движение денег</h4><span><i /> Остаток</span></div><div className="chart-area"><div className="chart-labels"><span>130 000</span><span>100 000</span><span>60 000</span></div><svg viewBox="0 0 420 180" preserveAspectRatio="none" role="img" aria-label={`Деньги на текущем этапе: ${scenario.cash} сом`}><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bce9ac" stopOpacity="0.25" /><stop offset="100%" stopColor="#bce9ac" stopOpacity="0" /></linearGradient></defs><path d="M0 60H420M0 90H420M0 135H420" className="chart-grid" /><path d={`${scenario.chart} L420 180 L0 180 Z`} fill="url(#chart-fill)" /><path d={scenario.chart} className="chart-line" /></svg></div><div className="chart-dates"><span>Старт</span><span>Аванс</span><span>Исполнение</span><span>Оплата</span></div></article><article className="order-card"><span className="order-tag">ЗАКАЗ №001</span><h4>Услуга для клиента</h4><strong>100 000 <small>сом</small></strong><div className="order-progress"><span style={{ width: scenario.progress }} /></div><div className="order-detail"><span>Расходы</span><strong>{scenario.expenses} сом</strong></div><div className="order-detail"><span>Долг клиента</span><strong data-testid="debt-value">{scenario.debt} сом</strong></div></article></div>
            </div></div></div>
        <div className="ai-explanation" aria-live="polite"><span className="ai-avatar"><Icon name="spark" /></span><div><span className="ai-caption">ОБЪЯСНЕНИЕ ПРИМЕРА</span><h3>{scenario.title}</h3><p>{scenario.answer}</p></div><span className="explanation-stamp"><Icon name="check" /> По фактам</span></div>
        <p className="demo-disclaimer">Это интерактивная демонстрация дизайна на условном заказе. Настоящие счета, операции и ИИ пока в разработке.</p>
      </div></section>

      <section className="faq-section shell" aria-labelledby="faq-title"><div><p className="eyebrow muted">ЕЩЁ НЕМНОГО ЯСНОСТИ</p><h2 id="faq-title">Хорошие<br /><span>вопросы.</span></h2></div><div className="faq-list"><details><summary>Это уже готовая бухгалтерия?<span>+</span></summary><p>Сейчас открыты публичный сайт, учебный пример, регистрация и личный аккаунт. Финансовый учёт и ИИ-помощник ещё разрабатываются. Реальные счета и документы пока не принимаются.</p></details><details><summary>Регистрация бесплатная?<span>+</span></summary><p>Да. Аккаунт раннего доступа бесплатен, банковская карта не нужна. В личном кабинете можно изменить пароль или удалить аккаунт.</p></details><details><summary>Можно посмотреть с телефона?<span>+</span></summary><p>Да. Страница адаптируется под телефон, планшет и компьютер. Если браузер не поддерживает 3D, показывается статичная композиция.</p></details><details><summary>Откуда цифры в демонстрации?<span>+</span></summary><p>Это условный заказ на 100 000 сом из контрольного примера проекта: аванс 30 000, расходы 70 000 и прибыль 30 000. Переключатели показывают разные этапы одного сценария.</p></details></div></section>

      <section className="final-cta shell"><span className="cta-orbit" aria-hidden="true"><BrandMark /></span><p className="eyebrow muted">ДОБРО ПОЖАЛОВАТЬ В ACCOUNTANT</p><h2>Посмотрите на бизнес<br /><span>под новым углом.</span></h2><a href="/register/" className="button button-dark">Создать бесплатный аккаунт <Icon name="arrow" /></a></section>
    </main>
    <SiteFooter />
  </>;
}
