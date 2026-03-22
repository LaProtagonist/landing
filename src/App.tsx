import type { ReactNode } from 'react'
import { useEffect } from 'react'
import GlobalSphereBackground from './components/background/GlobalSphereBackground'
import DevPanel from './components/dev/DevPanel'
import { applyUIThemeToRoot, getStoredUITheme } from './lib/uiTheme'
import './index.css'

const navItems = [
  { label: 'Что это', href: '#what' },
  { label: 'Аудитория', href: '#audience' },
  { label: 'Система', href: '#system' },
  { label: 'Тарифы', href: '#pricing' },
  { label: 'Запросить доступ', href: '#final-cta' },
]

const valueCards = [
  {
    title: 'Продажи и продвижение',
    text: 'Организаторы, партнёры и аудитория работают в одной системе, а не в разрозненных таблицах и чатах.',
  },
  {
    title: 'Прозрачные взаиморасчёты',
    text: 'Правила распределения выручки фиксируются заранее и считаются автоматически.',
  },
  {
    title: 'Эффект сети',
    text: 'Приглашения, рекомендации и повторные касания формируют накопительный рост вокруг каждого события.',
  },
  {
    title: 'Контроль данных',
    text: 'Организатор сохраняет управление аудиторией, каналами и аналитикой запуска.',
  },
]

const audienceCards = [
  {
    title: 'Рекомендации',
    text: 'Доверительные приглашения и микро-амбассадоры усиливают запуск без ощущения массовой рекламы.',
  },
  {
    title: 'Сегменты и ожидание',
    text: 'Списки ожидания, приоритеты и повторные касания превращают интерес в управляемый спрос.',
  },
  {
    title: 'Повторная коммуникация',
    text: 'Запуск не заканчивается продажей: система удерживает внимание и возвращает аудиторию в следующие сценарии.',
  },
]

const systemCards = [
  {
    step: '01',
    title: 'Конструктор предложения',
    text: 'Настройка цен, пакетов и условий совместных запусков. Оффер собирается под формат события, аудиторию и партнёрскую модель.',
  },
  {
    step: '02',
    title: 'Маршрут аудитории',
    text: 'Сегментация, триггеры, напоминания и приглашения. Система выстраивает переход от первого интереса к подтверждённому участию.',
  },
  {
    step: '03',
    title: 'Панель расчётов',
    text: 'Прозрачные условия, автоматический клиринг и отчёты. Каждая сторона видит свой результат без ручной сверки.',
  },
]

const settlementRows = [
  { label: 'Организатор', value: '58%' },
  { label: 'Партнёрские каналы', value: '27%' },
  { label: 'Коммуникационные сервисы', value: '15%' },
]

const distributionCards = [
  'Витрины и персональные ссылки',
  'Партнёрские подписки и промокоды',
  'Интерактивные списки ожидания',
  'Аналитика эффективности в реальном времени',
]

const pricingCards = [
  {
    name: 'Studio',
    text: 'Для камерных запусков и первых партнёрских сценариев.',
    features: ['Базовая инфраструктура события', 'Простые партнёрские механики', 'Базовые отчёты'],
  },
  {
    name: 'Pro',
    text: 'Для регулярных запусков и растущей сети партнёров.',
    features: ['Сегменты и сценарии аудитории', 'Автоматизация взаиморасчётов', 'Персональные офферы и маршруты'],
    accent: true,
  },
  {
    name: 'Enterprise',
    text: 'Для системной event-инфраструктуры и сложных сетевых моделей.',
    features: ['API и интеграции', 'Роли и сложные процессы', 'Выделенный контур поддержки'],
  },
]

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  lead: string
  compact?: boolean
}

function SectionHeader({ eyebrow, title, lead, compact = false }: SectionHeaderProps) {
  return (
    <div className={`section-header ${compact ? 'section-header-compact' : ''}`.trim()}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title">{title}</h2>
      <p className="section-lead">{lead}</p>
    </div>
  )
}

function ActionLink({ href, children, variant = 'primary' }: { href: string; children: ReactNode; variant?: 'primary' | 'secondary' }) {
  return <a className={`button ${variant === 'primary' ? 'button-primary' : 'button-secondary'}`} href={href}>{children}</a>
}

function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass-card ${className}`.trim()}>{children}</div>
}

function TopNav() {
  return (
    <header className="site-nav-wrap">
      <div className="container nav-shell glass-card glass-card-soft">
        <a className="brand-mark" href="#hero">Spiski</a>
        <nav className="site-nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <a key={item.href} className="nav-link" href={item.href}>{item.label}</a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function PhoneMockup() {
  return (
    <div className="phone-stage">
      <div className="phone-shell glass-card glass-card-soft">
        <div className="phone-frame">
          <div className="phone-notch" />
          <div className="phone-screen">
            <div className="phone-screen-head">
              <span className="phone-screen-label">Preview</span>
              <span className="phone-screen-tag">Future video slot</span>
            </div>
            <div className="phone-video-slot">
              <div className="phone-video-label">App preview</div>
              <div className="phone-video-frame" />
            </div>
            <div className="phone-ui-stack">
              <GlassCard className="phone-ui-card phone-ui-card-primary">
                <div>
                  <strong>Launch control</strong>
                  <p>Audience, partners, settlements</p>
                </div>
              </GlassCard>
              <div className="phone-ui-row">
                <GlassCard className="phone-ui-chip">Invites</GlassCard>
                <GlassCard className="phone-ui-chip">Clearing</GlassCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  useEffect(() => {
    applyUIThemeToRoot(getStoredUITheme())
  }, [])

  return (
    <div className="app-shell">
      <GlobalSphereBackground />
      <div className="page-overlay" />
      <div className="site-layer">
        <TopNav />
        <main>
          <section className="section hero-section" id="hero">
            <div className="container hero-grid">
              <div className="hero-copy">
                <p className="section-eyebrow">Платформа для премиальных событий</p>
                <h1 className="hero-title">Персональное приложение для событий и собственной аудитории</h1>
                <p className="hero-lead">
                  Одна платформа для запуска событий, распределения выручки, управления приглашениями и роста доверительных рекомендаций.
                </p>
                <div className="hero-actions">
                  <ActionLink href="#final-cta">Запросить демо</ActionLink>
                  <ActionLink href="#pricing" variant="secondary">Скачать презентацию</ActionLink>
                </div>
                <div className="hero-story-grid">
                  <GlassCard className="hero-story-card">
                    <p className="hero-story-title">Система запуска</p>
                    <p className="hero-story-text">Сценарии продвижения, партнёрские механики, прозрачные расчёты и единый маршрут аудитории.</p>
                  </GlassCard>
                  <GlassCard className="hero-story-card">
                    <p className="hero-story-title">Контур роста</p>
                    <p className="hero-story-text">Повторные касания, списки ожидания, рекомендации и накопление собственной сети вокруг каждого запуска.</p>
                  </GlassCard>
                </div>
              </div>
              <PhoneMockup />
            </div>
          </section>

          <section className="section section-tight" id="what">
            <div className="container section-stack section-stack-tight">
              <SectionHeader
                eyebrow="Что такое Spiski"
                title="Единый контур управления событиями"
                lead="От формирования аудитории до финальных взаиморасчётов между всеми сторонами — в одной платформе."
              />
              <div className="feature-grid feature-grid-2x2">
                {valueCards.map((item) => (
                  <GlassCard key={item.title} className="feature-card feature-card-rich">
                    <h3 className="feature-card-title">{item.title}</h3>
                    <p className="feature-card-text">{item.text}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          </section>

          <section className="section section-tight" id="audience">
            <div className="container split-layout split-layout-balanced">
              <SectionHeader
                eyebrow="Как растёт аудитория"
                title="Доверие и повторные касания собираются в управляемый рост"
                lead="Spiski усиливает запуск не объёмом шума, а качеством маршрута: рекомендации, ожидание и возвращаемость работают как система."
              />
              <div className="feature-stack feature-stack-dense">
                {audienceCards.map((item) => (
                  <GlassCard key={item.title} className="feature-card feature-card-rich feature-card-compact">
                    <h3 className="feature-card-title">{item.title}</h3>
                    <p className="feature-card-text">{item.text}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          </section>

          <section className="section section-tight" id="system">
            <div className="container section-stack section-stack-tight">
              <SectionHeader
                eyebrow="Как работает система"
                title="От оффера до пост-коммуникации — единый сценарий запуска"
                lead="Команда видит предложение, маршрут аудитории и финансовую модель как связанную инфраструктуру, а не набор разрозненных инструментов."
              />
              <div className="feature-grid feature-grid-3">
                {systemCards.map((item) => (
                  <GlassCard key={item.step} className="process-card">
                    <span className="process-step">{item.step}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          </section>

          <section className="section section-tight">
            <div className="container split-layout split-layout-tight split-layout-balanced">
              <SectionHeader
                eyebrow="Расчёты и распределение"
                title="Операционный блок без ручной сверки"
                lead="Условия фиксируются заранее, а распределение выручки и аналитика по запуску собираются в один прозрачный рабочий контур."
              />
              <GlassCard className="settlement-panel">
                <div className="settlement-list">
                  {settlementRows.map((item) => (
                    <div key={item.label} className="settlement-row">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <GlassCard className="settlement-accent">
                  <span>Прозрачный клиринг</span>
                  <strong>24 часа</strong>
                </GlassCard>
              </GlassCard>
            </div>
          </section>

          <section className="section section-tight">
            <div className="container section-stack section-stack-tight">
              <SectionHeader
                eyebrow="Инструменты распространения"
                title="Партнёры, медиа и комьюнити работают в одном канале"
                lead="Нужные механики продвижения собраны в аккуратный набор инструментов без лишней тяжести в интерфейсе."
                compact
              />
              <div className="feature-grid feature-grid-2x2 feature-grid-light">
                {distributionCards.map((item) => (
                  <GlassCard key={item} className="feature-card feature-card-lite feature-card-inline">
                    <p className="feature-card-text">{item}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          </section>

          <section className="section" id="pricing">
            <div className="container section-stack">
              <SectionHeader
                eyebrow="Тарифы"
                title="Ценностные уровни под масштаб и сложность запуска"
                lead="От первых совместных событий до системной event-инфраструктуры — без искусственных price chips и фальшивых акцентов."
              />
              <div className="feature-grid feature-grid-3 pricing-grid">
                {pricingCards.map((item) => (
                  <GlassCard key={item.name} className={item.accent ? 'pricing-card pricing-card-accent' : 'pricing-card'}>
                    <div className="pricing-head">
                      <h3>{item.name}</h3>
                      <p className="pricing-copy">{item.text}</p>
                    </div>
                    <ul className="pricing-list">
                      {item.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </GlassCard>
                ))}
              </div>
            </div>
          </section>

          <section className="section section-cta" id="final-cta">
            <div className="container">
              <GlassCard className="final-cta-band">
                <div>
                  <p className="section-eyebrow">Финальный контур</p>
                  <h2 className="section-title">Готовы вывести события на новый масштаб?</h2>
                  <p className="section-lead">
                    Оставьте заявку — мы соберём архитектуру запуска и покажем, как Spiski усилит ваш следующий проект.
                  </p>
                </div>
                <div className="hero-actions">
                  <ActionLink href="mailto:hello@spiski.app">Запросить консультацию</ActionLink>
                  <ActionLink href="#pricing" variant="secondary">Скачать кейсы</ActionLink>
                </div>
              </GlassCard>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="container footer-grid">
            <div>
              <p className="footer-brand">Spiski</p>
              <p className="footer-copy">Платформа для премиальных событий и партнёрских запусков.</p>
            </div>
            <div className="footer-meta">
              <a href="mailto:hello@spiski.app">hello@spiski.app</a>
              <span>Москва · Дубай · Берлин</span>
            </div>
          </div>
        </footer>
      </div>
      <DevPanel />
    </div>
  )
}

export default App
