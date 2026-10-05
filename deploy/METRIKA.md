# Yandex Metrika integration

Counter: 113132820. Prepared on the `seo-optimization` branch from production
commit `bf9bc285a7e434468a10bb5bde5a5eafd1709394`. No production deployment.

## Counter and privacy

The official asynchronous initializer is in the head of index.html. The noscript
pixel is in the body. scripts/build-seo.cjs copies both into seo/en.html and
seo/uz.html; these are alternative document responses, not three counters on one
page. There was no existing analytics tag or dataLayer implementation.
All supplied options, including ecommerce:"dataLayer", remain unchanged.
No ecommerce events or additional dataLayer are created.

The form has ym-hide-content and ym-disable-submit; name, contact and comment
fields have ym-disable-keys. No form values are passed to reachGoal or hit.
Webvisor, clickmap, accurateTrackBounce and trackLinks remain enabled.

## Events

app.js initMetrikaGoals installs one delegated click listener. Only the four
elements marked data-metrika-goal="cta_apply_click" qualify: desktop header,
mobile navigation, hero and sticky mobile bar. A trusted primary-button click
(including keyboard activation) produces one parameterless reachGoal call.
Programmatic .click(), contact navigation, pricing, quiz and form submission do
not produce this goal. No listener is added again during translation.
The metrika helper tolerates unavailable or throwing analytics.

setLang sends one hit when the language actually changes without reloading.
Initial language detection and reselecting the same language produce no extra
hit. The hit URL contains only the known language, not arbitrary query values or
form data. The document title is updated before the hit.

There is NO lead_success call, and NO telegram_click, whatsapp_click or phone_click.
Ordinary Telegram/WhatsApp links retain their supported URLs and use built-in
Metrika goals. The footer phone link now uses tel:+998501113939, derived from
phoneDisplay at build time and runtime. Other WhatsApp links remain unchanged.

## Form audit and deliberately unfinished lead tracking

The form collects name, contact, service, plan, comment, language and consent.
submit prevents default navigation and validates name, contact and consent.
site.config.js still has leadEndpoint:''; there is no api/lead.js in this repo.
The active path opens a Telegram URL containing the draft message, shows the
existing Telegram status and resets the form. This is not delivery confirmation.
No WhatsApp form fallback exists. The popup may be blocked, and the existing
form still resets; this behavior has not been redesigned in this integration.

That window.open is not a normal anchor click. Built-in messenger conversion
coverage for this particular path is NOT confirmed. Do not infer coverage from
the ordinary links. A minimal future UI change would show an explicit Continue
in Telegram link after validation. Before implementation, separate the draft
text from the tracked link (for example copy draft, then use a plain t.me link),
so the outgoing tracked URL cannot contain personal data. Do not add a duplicate
messenger reachGoal as a workaround.

The dormant API path POSTs JSON {lead, message}, considers res.ok a UI success,
resets the form, and displays an error on HTTP/network failure. It does not
parse a business response: even {success:false} with HTTP 200 currently shows
the existing success message. No lead goal is emitted in any of these cases.
The new submitting guard and disabled button prevent concurrent requests and
restore availability after success/error. Endpoint configuration must remain
empty until a backend contract and UI success validation are implemented.

A real lead should mean that the backend/CRM has persisted one accepted request
and returned a documented acceptance response (for example accepted:true plus
an opaque lead identifier). Only that validated response may trigger one
lead_success, without the identifier or form data as analytics parameters.
Retries need backend idempotency and client deduplication; HTTP 2xx alone is
insufficient. This part is intentionally deferred, not simulated.

## Validation

- node --check for changed JavaScript; git diff --check.
- node --test tests/seo.test.cjs: deterministic generation, metadata/schema and
  local HTTP language/private/404 routing.
- tests/metrika.cjs with Playwright: all languages, four CTA placements,
  synthetic click exclusion, one initialization/hit, no private values in calls,
  fallback without lead, API double-submit and HTTP/network/business rejection,
  missing/throwing analytics.
- tests/browser.cjs: 320/390/768/1440 widths x RU/UZ/EN, existing interactive flows,
  plus all three no-JS documents and deterministic default language.

All external HTTPS requests in browser tests are fulfilled locally. No real
analytics hits or messages are sent. Tests validate our calls and wiring, not
the Yandex dashboard, real tag internals or built-in goal reception. Verify those
after a separately authorized deployment. Do not merge or deploy without the
owner's explicit РАЗРЕШАЮ ДЕПЛОЙ instruction.

Official references:
- https://yandex.ru/support/metrica/ru/code/counter-spa-setup
- https://yandex.ru/support/metrica/ru/code/html-markup
- https://yandex.ru/support/metrica/ru/simple-goal/messengers
