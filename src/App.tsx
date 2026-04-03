import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
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
    title: 'Своё приложение',
    text: 'Организатор получает приложение под свой проект — с событиями, продажами и логикой работы с аудиторией.',
  },
  {
    title: 'Своя база аудитории',
    text: 'Интерес, регистрации и история переходов остаются внутри проекта и доступны для последующих событий.',
  },
  {
    title: 'Партнёрское продвижение',
    text: 'Партнёры, рекомендации, промокоды и реферальные сценарии собраны в одной системе.',
  },
  {
    title: 'Понятная экономика',
    text: 'Подписка делает расходы предсказуемыми и сохраняет больше выручки по мере роста продаж.',
  },
]

const audienceCards = [
  {
    title: 'Приглашения и рекомендации',
    text: 'Аудитория приходит через доверительные приглашения, партнёров и рекомендации, а не только через рекламу.',
  },
  {
    title: 'Списки ожидания',
    text: 'Интерес не теряется: система собирает ожидание и возвращает людей в момент запуска.',
  },
  {
    title: 'Повторные продажи',
    text: 'После одного события база не обнуляется — с ней можно работать дальше и запускать новые продажи быстрее.',
  },
]

const systemCards = [
  {
    step: '1',
    title: 'Создаёте событие',
    text: 'Собираете страницу события, настраиваете доступ, билеты, роли и формат запуска под свою задачу.',
  },
  {
    step: '2',
    title: 'Подключаете продвижение',
    text: 'Запускаете партнёрские и реферальные механики, приглашения, промокоды и каналы распространения.',
  },
  {
    step: '3',
    title: 'Получаете продажи и аналитику',
    text: 'Система считает регистрации, продажи, выплаты и check-in, а команда видит результат по каждому запуску.',
  },
]

const settlementRows = [
  { label: 'Организатор', value: '77%' },
  { label: 'Партнёрские выплаты', value: '20%' },
  { label: 'Эквайринг', value: '3%' },
]

const distributionCards = [
  'Страницы событий и персональные ссылки',
  'Партнёрские программы и промокоды',
  'Списки ожидания и приглашения',
  'Аналитика по каналам и продажам',
]

const pricingCards = [
  {
    name: 'Community',
    text: 'Для бесплатных событий, первых запусков и тестирования механик продвижения.',
    price: 'Бесплатно',
    features: [
      'Базовый интерфейс Spi.Ski',
      'Вход через main Spi.Ski',
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
    text: 'Для платных событий и команд, которым нужно своё приложение с продажами, аудиторией и партнёрской логикой.',
    pricePrimary: '10 000 ₽ / месяц',
    priceSecondary: '100 000 ₽ / год',
    note: 'Специальные условия запуска: 5 000 ₽ / месяц · 50 000 ₽ / год',
    features: [
      'Всё из тарифа Community',
      'Брендированный интерфейс',
      'Кабинеты организатора и промоутера',
      'Накопление собственной аудитории',
      'Подключение платёжной системы',
      'Распределение платежей и выплат',
      'Управление сервисным сбором',
      'Расширенная аналитика продаж',
      'Роли: организатор, промоутер, сканер',
    ],
    accent: true,
  },
  {
    name: 'Entertainment',
    text: 'Для сетевых организаторов и проектов со сложными ролями, интеграциями и процессами.',
    price: 'Стоимость индивидуально',
    features: [
      'Всё из предыдущих тарифов',
      'Кастомный интерфейс',
      'Вход через вашего Telegram-бота',
      'Дополнительные API и интеграции',
      'Сложные роли и права доступа',
      'Выделенный контур поддержки',
      'Кастомная логика продаж и инвайтов',
      'Бизнес-процессы под вашу команду',
      'Архитектура под сеть событий и площадок',
    ],
  },
]

const pricingMetaByName: Record<
  string,
  {
    primary: string
    secondary?: string
    noteLabel?: string
    note?: string
  }
> = {
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
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title">{title}</h2>
      <p className="section-lead">{lead}</p>
    </div>
  )
}

function ActionLink({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
}) {
  return (
    <a className={`button ${variant === 'primary' ? 'button-primary' : 'button-secondary'}`} href={href}>
      {children}
    </a>
  )
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <header className="site-nav-wrap">
      <div className="container nav-shell glass-card glass-card-soft">
        <div className="nav-top-row">
          <a className="brand-mark" href="#hero">
            Spi.Ski
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={isMobileNavOpen}
            aria-label="Открыть меню"
            onClick={() => setIsMobileNavOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div className={`nav-menu${isMobileNavOpen ? ' is-open' : ''}`}>
          <nav className="site-nav" aria-label="Основная навигация">
            {navItems.map((item) => (
              <a
                key={item.href}
                className="nav-link"
                href={item.href}
                onClick={() => setIsMobileNavOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
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
            alt="Интерфейс приложения Spi.Ski"
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
      <div className="site-layer page-text-outline">
        <TopNav />
        <main>
          <section className="section hero-section" id="hero">
            <div className="container hero-grid">
              <div className="hero-copy">
                <p className="section-eyebrow">Приложение для организаторов событий</p>
                <h1 className="hero-title">Собственное приложение для событий, аудитории и продаж</h1>
                <p className="hero-lead">
                  Spi.Ski даёт организатору своё приложение для запуска событий, продаж, приглашений, партнёрских программ и работы с аудиторией — с понятной экономикой по подписке.
                </p>
                <div className="hero-actions">
                  <ActionLink href="#final-cta">Запросить доступ</ActionLink>
                  <ActionLink href="#pricing" variant="secondary">
                    Посмотреть тарифы
                  </ActionLink>
                </div>
                <div className="hero-story-grid">
                  <GlassCard className="hero-story-card">
                    <p className="hero-story-title">Своё приложение</p>
                    <p className="hero-story-text">
                      Бренд, события, продажи и коммуникация с аудиторией собраны в одном интерфейсе.
                    </p>
                  </GlassCard>
                  <GlassCard className="hero-story-card">
                    <p className="hero-story-title">Рост от запуска к запуску</p>
                    <p className="hero-story-text">
                      Партнёрские механики, рекомендации и повторные касания помогают накапливать аудиторию вокруг проекта.
                    </p>
                  </GlassCard>
                </div>
              </div>
              <PhoneMockup />
            </div>
          </section>

          <section className="section section-tight" id="what">
            <div className="container section-stack section-stack-tight">
              <SectionHeader
                eyebrow="Что это"
                title="Платформа, где событие, продажи и продвижение работают как одна система"
                lead="Организатор получает свой инструмент для запуска событий, работы с аудиторией, продаж и партнёрских сценариев — в одном контуре."
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
                title="Каждый запуск усиливает следующий"
                lead="Приглашения, ожидание, рекомендации и повторные продажи складываются в устойчивый рост вокруг проекта."
              />
              <div className="feature-stack feature-stack-dense">
                {audienceCards.map((item) => (
                  <GlassCard
                    key={item.title}
                    className="feature-card feature-card-rich feature-card-compact"
                  >
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
                eyebrow="Как это работает"
                title="Запуск, продвижение, продажи и check-in — в одной системе"
                lead="Команда работает в одном приложении и видит весь путь события целиком: от страницы запуска до результата по продажам."
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
                eyebrow="Продажи и выплаты"
                title="Выручка сразу поступает организатору"
                lead="Поскольку приложение работает на стороне организатора, деньги с продаж сразу зачисляются на его счёт — за вычетом эквайринга и партнёрских выплат."
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
                  <span>Автоматический расчёт</span>
                  <strong>24 часа</strong>
                </GlassCard>
              </GlassCard>
            </div>
          </section>

          <section className="section section-tight">
            <div className="container section-stack section-stack-tight">
              <SectionHeader
                eyebrow="Продвижение"
                title="Инструменты продвижения уже встроены в систему"
                lead="Ссылки, партнёрские сценарии, списки ожидания и аналитика помогают продвигать событие без разрозненных инструментов."
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
                title="Тарифы под формат запуска"
                lead="От первых бесплатных событий до собственного брендированного приложения с продажами, аудиторией и партнёрскими программами."
              />
              <div className="feature-grid feature-grid-3 pricing-grid">
                {pricingCards.map((item) => {
                  const priceMeta = pricingMetaByName[item.name as keyof typeof pricingMetaByName]

                  return (
                    <GlassCard
                      key={item.name}
                      className={item.accent ? 'pricing-card pricing-card-accent' : 'pricing-card'}
                    >
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
                                  <div className="pricing-card__price-note-label">
                                    {priceMeta.noteLabel}
                                  </div>
                                  <div className="pricing-card__price-note-value">
                                    {priceMeta.note}
                                  </div>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <p className="pricing-card__price-main">{priceMeta.primary}</p>
                              {priceMeta.secondary ? (
                                <p className="pricing-card__price-secondary">
                                  {priceMeta.secondary}
                                </p>
                              ) : null}
                              {priceMeta.note ? (
                                <div className="pricing-card__price-note">
                                  <p className="pricing-card__price-note-label">
                                    {priceMeta.noteLabel}
                                  </p>
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
                  <p className="section-eyebrow">Следующий шаг</p>
                  <h2 className="section-title">Покажем, как будет выглядеть ваше приложение в Spi.Ski</h2>
                  <p className="section-lead">
                    Напишите нам — подключим Ваш аккаунт к тестовому кабинету и покажем, как Spi.Ski будет работать именно под ваш формат событий.
                  </p>
                </div>
                <div className="hero-actions final-cta-actions">
                  <ActionLink href="https://t.me/spiski_support">Запросить доступ</ActionLink>
                  <ActionLink href="#pricing" variant="secondary">
                    Посмотреть тарифы
                  </ActionLink>
                </div>
              </GlassCard>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="container footer-grid">
            <p className="footer-copy">
              Платформа для организаторов событий, собственной аудитории и партнёрского роста.
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