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
    text: 'Организатор сохраняет управление накопленной аудиторией, каналами и аналитикой запуска.',
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
    step: '1',
    title: 'Конструктор предложения',
    text: 'Настройка цен, пакетов и условий совместных запусков. Оффер собирается под формат события, аудиторию и партнёрскую модель.',
  },
  {
    step: '2',
    title: 'Маршрут аудитории',
    text: 'Сегментация, триггеры, напоминания и приглашения. Система выстраивает путь от первого интереса к подтверждённому участию.',
  },
  {
    step: '3',
    title: 'Панель расчётов',
    text: 'Прозрачные условия, автоматический клиринг и отчёты. Каждая сторона видит свой результат без ручной сверки.',
  },
]

const settlementRows = [
  { label: 'Организатор', value: '77%' },
  { label: 'Партнёрские выплаты', value: '20%' },
  { label: 'Эквайринг', value: '3%' },
]

const distributionCards = [
  'Витрины и персональные ссылки',
  'Партнёрские подписки и промокоды',
  'Интерактивные списки ожидания',
  'Аналитика эффективности в реальном времени',
]

const pricingCards = [
  {
    name: 'Community',
    text: 'Для бесплатных событий, первых запусков и тестирования механик роста аудитории.',
    price: 'Бесплатно',
    features: [
      'Базовый интерфейс Spi.Ski',
      'Вход через mainSpi.Ski',
      'Страница события с регистрацие',
      'Страница события с регистрацией',
      'Метрики аудитории и привлечения',
      'Партнёрские и реферальные механики',
      'Готовые посты и сторис',
      'Открытые и закрытые события',
      'Списки приглашённых',
      'Сканер билетов и check-in',
      'Роли организатора и сканера',
    ],
  },
  {
     name: 'Enterprise',
    text: 'Для платных событий, брендов и команд, которым нужен собственный контур продаж и управления.',
    pricePrimary: '10 000 ₽ / месяц',
    priceSecondary: '100 000 ₽ / год',
    note: 'Специальные условия запуска: 5 000 ₽ / месяц · 50 000 ₽ / год',
    features: [
      'Всё из тарифа Community',
      'Брендированный интерфейс',
      'Вход через вашего Telegram-бота',
      'Кабинет организатора и промоутера',
      'Подключение платёжной системы',
      'Маршрутизация платежей и выплат',
      'Управление сервисным сбором',
      'Расширенная аналитика продаж',
      'Роли: организатор, промоутер, сканер',
    ],
    accent: true,
  },
  {
    name: 'Entertainment',
    text: 'Для сетевых организаторов, продюсерских команд, клубных систем и сложных event-процессов.',
    price: 'Стоимость индивидуально',
    features: [
      'Всё из предыдущих тарифов',
      'Кастомный интерфейс',
      'Дополнительные API и интеграции',
      'Сложные роли и права доступа',
      'Выделенный контур поддержки',
      'Кастомная логика продаж и инвайтов',
      'Бизнес-процессы под вашу команду',
      'Архитектура под сеть событий и площадок',
    ],
  },
]

const pricingMetaByName: Record<string, {
  primary: string
  secondary?: string
  noteLabel?: string
  note?: string
}> = {
  Community: {
    primary: 'Бесплатно',
  },
  Enterprise: {
    primary: '10 000 ₽ / месяц',
    secondary: '100 000 ₽ / год',
    noteLabel: 'Специальные условия запуска',
    note: '5 000 ₽ / месяц · 50 000 ₽ / год',
  },
  Entertainment: {
    primary: 'Стоимость индивидуально',
  },
}

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  lead: string
  compact?: boolean
}

function SectionHeader({ eyebrow, title, lead, compact = false }: SectionHeaderProps) {
  return (
    <div className={`section-header ${compact ? 'section-header-compact' : ''}`.trim()}>
      {eyebrow ? <p className="section-eyebrow text-on-bg-stroke">{eyebrow}</p> : null}
      <h2 className="section-title text-on-bg-stroke">{title}</h2>
      <p className="section-lead text-on-bg-stroke">{lead}</p>
    </div>
  )
}

function ActionLink({ href, children, variant = 'primary' }: { href: string; children: ReactNode; variant?: 'primary' | 'secondary' }) {
  return <a className={`button ${variant === 'primary' ? 'button-primary' : 'button-secondary'}`} href={href}>{children}</a>
}

function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass-card ${className}`.trim()}>{children}</div>
}

function TelegramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="telegram-icon">
      <path
        fill="currentColor"
        d="M19.8 4.2a1.2 1.2 0 0 0-1.23-.15L4.18 10.4c-.53.23-.5 1 .05 1.19l3.61 1.15 1.4 4.37c.17.52.84.63 1.16.18l2.02-2.84 3.96 2.92c.48.35 1.16.08 1.27-.5l2.53-11.6c.09-.4-.1-.81-.48-1.05Zm-9.23 8.11-.55 4.08-.87-2.71 8.05-6.84-6.63 5.47Z"
      />
    </svg>
  )
}

function TopNav() {
  return (
    <header className="site-nav-wrap">
      <div className="container nav-shell glass-card glass-card-soft">
        <a className="brand-mark" href="#hero">Spi.Ski</a>
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
        <div className="phone-notch" />
        <div className="phone-screen">
          <img
            className="phone-screen-image"
            src="/assets/image_2026-03-23_17-08-49.png"
            alt="????????? ?????????? Spi.Ski"
            loading="eager"
          />
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
                <p className="section-eyebrow">Экосистема для продвижения событий</p>
                <h1 className="hero-title">Персональное приложение для событий и собственной аудитории</h1>
                <p className="hero-lead text-on-bg-stroke">
                  Одна платформа для запуска событий, распределения выручки, управления приглашениями и роста доверительных рекомендаций.
                </p>
                <div className="hero-actions">
                  <ActionLink href="#final-cta">Подключение</ActionLink>
                  <ActionLink href="#pricing" variant="secondary">Демо</ActionLink>
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
                title="Партнёры, медиа и комьюнити работают в единой системе"
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
                title="Уровни подключения под масштаб проекта"
                lead="От первых совместных событий до системной event-инфраструктуры — по мере роста задач, команды и операционной сложности."
              />
              <div className="feature-grid feature-grid-3 pricing-grid">
                {pricingCards.map((item) => {
                  const priceMeta = pricingMetaByName[item.name as keyof typeof pricingMetaByName]

                  return (
                    <GlassCard key={item.name} className={item.accent ? 'pricing-card pricing-card-accent' : 'pricing-card'}>
                      <div className="pricing-card__body">
                        <div className="pricing-card__head">
                          <h3>{item.name}</h3>
                          <p className="pricing-copy">{item.text}</p>
                        </div>
                        <ul className="pricing-list pricing-card__features">
                          {item.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                        <div className="pricing-card__price">
                          {item.name === 'Enterprise' ? (
                            <>
                              <div className="pricing-card__price-base">
                                <div className="pricing-card__price-label">БАЗОВЫЕ УСЛОВИЯ</div>
                                {priceMeta.secondary ? (
                                  <div className="pricing-card__price-base-value pricing-card__price-base-value--striked">
                                    {priceMeta.primary} · {priceMeta.secondary}
                                  </div>
                                ) : null}
                              </div>
                              {priceMeta.note ? (
                                <div className="pricing-card__price-note">
                                  <div className="pricing-card__price-note-label">{priceMeta.noteLabel}</div>
                                  <div className="pricing-card__price-note-value">{priceMeta.note}</div>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <p className="pricing-card__price-main">{priceMeta.primary}</p>
                              {priceMeta.secondary ? <p className="pricing-card__price-secondary">{priceMeta.secondary}</p> : null}
                              {priceMeta.note ? (
                                <div className="pricing-card__price-note">
                                  <p className="pricing-card__price-note-label">{priceMeta.noteLabel}</p>
                                  <p className="pricing-card__price-note-value">{priceMeta.note}</p>
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          </section>

                    <section className="section section-cta" id="final-cta">
            <div className="container">
              <GlassCard className="final-cta-band">
                <div className="final-cta-copy">
                  <p className="section-eyebrow">Финальный контур</p>
                  <h2 className="section-title">Готовы работать в своем приложении?</h2>
                  <p className="section-lead">
                    Мы покажем, как будет выглядеть ваше собственное приложение, витрина событий и контур работы с накопленной аудиторией.
                  </p>
                </div>
                <div className="hero-actions final-cta-actions">
                  <ActionLink href="https://t.me/spiski_support">Подключение</ActionLink>
                  <ActionLink href="#hero" variant="secondary">Демо</ActionLink>
                </div>
              </GlassCard>
            </div>
          </section>
        </main>

                        <footer className="site-footer">
          <div className="container footer-grid">
            <p className="footer-copy">
              Платформа для организаторов, собственной аудитории и премиальных запусков.
            </p>
            <div className="footer-meta">
              <a
                className="footer-telegram"
                href="https://t.me/spiski_support"
                target="_blank"
                rel="noreferrer"
              >
                <TelegramIcon />
                <span>@spiski_support</span>
              </a>
            </div>
          </div>

          <div className="container footer-bottom">
            <span>Spi.Ski © 2025–2026</span>
          </div>
        </footer>
      </div>
      <DevPanel />
    </div>
  )
}

export default App
