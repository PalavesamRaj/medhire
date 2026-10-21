// Browser integration checks using installed Chrome and Node's built-in WebSocket.
// Run: node --experimental-websocket tests/candidate-browser.mjs
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const base = 'http://127.0.0.1:4175'
const output = path.resolve('artifacts/candidate-browser')
await mkdir(output, { recursive: true })
const profile = await mkdtemp(path.join(tmpdir(), 'medhire-chrome-'))
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { windowsHide: true, stdio: 'ignore' })
let chrome, socket
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function waitFor(action, label = 'condition') {
  for (let attempt = 0; attempt < 80; attempt++) { try { if (await action()) return } catch {} await sleep(100) }
  throw new Error(`Timed out waiting for ${label}`)
}
const errors = []
try {
  await waitFor(async () => (await fetch(base)).ok, 'Vite server')
  chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9335', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
  let target
  await waitFor(async () => { target = (await (await fetch('http://127.0.0.1:9335/json/list')).json()).find((entry) => entry.type === 'page'); return Boolean(target) }, 'Chrome')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  let sequence = 0
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) { const { resolve, reject, timer } = pending.get(message.id); clearTimeout(timer); pending.delete(message.id); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result) }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value || arg.description).join(' '))
  })
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 30000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })) })
  const evaluate = async (expression) => { const value = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text); return value.result?.value }
  await cdp('Page.enable'); await cdp('Runtime.enable')
  const route = async (pathname) => { await cdp('Page.navigate', { url: `${base}${pathname}` }); await waitFor(() => evaluate(`location.pathname === ${JSON.stringify(pathname.split('?')[0])} && Boolean(document.querySelector('h1'))`), pathname); await sleep(120) }
  const click = async (selector) => { assert.ok(await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`), `Missing ${selector}`); await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await sleep(150) }
  const button = async (text) => { assert.ok(await evaluate(`Boolean([...document.querySelectorAll('button')].find(el => el.textContent.trim() === ${JSON.stringify(text)}))`), `Missing button ${text}`); await evaluate(`[...document.querySelectorAll('button')].find(el => el.textContent.trim() === ${JSON.stringify(text)}).click()`); await sleep(150) }
  const fill = async (selector, value) => { await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); const prototype = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`); await sleep(80) }
  const screenshot = async (name) => { const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); await writeFile(path.join(output, name), Buffer.from(shot.data, 'base64')) }
  const routes = ['dashboard', 'profile', 'edit-profile', 'resume-management', 'privacy-settings', 'jobs', 'jobs/icu-registered-nurse', 'jobs/icu-registered-nurse/apply', 'applications', 'saved-jobs', 'summary']
  for (const width of [1440, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    for (const page of routes) {
      await route(`/candidate/${page}`)
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `${page} overflows at ${width}px`)
      const active = page.startsWith('jobs') ? 'jobs' : page
      assert.equal(await evaluate(`document.querySelector('nav[aria-label="Candidate navigation"] a[aria-current="page"]')?.getAttribute('href')`), `/candidate/${active}`, `${page} active sidebar`)
      const type = await evaluate(`(() => { const s = getComputedStyle(document.querySelector('h1')); return [s.fontSize, s.lineHeight, s.fontWeight] })()`)
      assert.deepEqual(type, ['32px', '38.4px', '700'], `${page} heading typography`)
      if (page === 'dashboard' || page === 'profile' || page === 'jobs') await screenshot(`${page}-${width}.png`)
    }
    console.log(`PASS: all 11 routes, sidebar active state, typography and overflow at ${width}px`)
  }
  await click('button[aria-label="Open navigation"]')
  assert.equal(await evaluate('document.querySelector("#candidate-navigation").getBoundingClientRect().height > 0'), true)
  await click('nav a[href="/candidate/dashboard"]')
  assert.equal(await evaluate(`document.querySelector('button[aria-label="Open navigation"]').getAttribute('aria-expanded')`), 'false')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await route('/candidate/edit-profile')
  await fill('input[name="firstName"]', '')
  await button('Save Changes')
  assert.ok(await evaluate('document.querySelector("[role=alert]")?.textContent.includes("required")'))
  await fill('input[name="firstName"]', 'Alex')
  await button('Save Changes')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Alex Johnson')
  await click('nav a[href="/candidate/edit-profile"]')
  await fill('input[name="firstName"]', 'Discarded')
  await button('Cancel')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Alex Johnson')
  await click('nav a[href="/candidate/dashboard"]')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Welcome back, Alex')
  console.log('PASS: profile validation, save, cancel and cross-page state')
  await click('nav a[href="/candidate/privacy-settings"]')
  await click('button[aria-label="Show that I am open to work"]')
  await button('Save Preferences')
  await click('nav a[href="/candidate/profile"]')
  assert.equal(await evaluate('document.querySelector("main").innerText.includes("Open to Work")'), false)
  await click('nav a[href="/candidate/jobs"]')
  await fill('input[aria-label="Job title or specialty"]', 'ICU')
  await button('Search')
  assert.equal(await evaluate('document.querySelectorAll("main article").length'), 2)
  await button('Contract')
  assert.equal(await evaluate('document.querySelectorAll("main article").length'), 1)
  await click('button[aria-label="Unsave Travel Nurse – ICU"]')
  await click('nav a[href="/candidate/saved-jobs"]')
  assert.equal(await evaluate('document.querySelectorAll("main article").length'), 2)
  console.log('PASS: privacy preferences, search, filters and saved-job state')
  await click('a[href="/candidate/jobs/icu-registered-nurse"]')
  await click('a[href="/candidate/jobs/icu-registered-nurse/apply"]')
  await button('Submit Application')
  assert.equal(await evaluate('location.pathname'), '/candidate/applications')
  assert.equal(await evaluate('document.querySelectorAll("main article").length'), 9)
  await click('a[href="/candidate/jobs/icu-registered-nurse"]')
  await click('a[href="/candidate/jobs/icu-registered-nurse/apply"]')
  await button('Submit Application')
  assert.ok(await evaluate('document.querySelector("main").innerText.includes("already applied")'))
  console.log('PASS: approved-resume application submission and duplicate protection')
  await click('nav a[href="/candidate/resume-management"]')
  const uploadFile = async (name, type) => { await evaluate(`(() => { const input = document.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File(['test resume'], ${JSON.stringify(name)}, { type: ${JSON.stringify(type)} })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(100) }
  await uploadFile('bad.exe', 'application/octet-stream')
  assert.ok(await evaluate('document.querySelector("[role=alert]")?.textContent.includes("PDF")'))
  await uploadFile('new-resume.pdf', 'application/pdf')
  await button('Add Resume')
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 5)
  assert.ok(await evaluate('document.querySelector("tbody tr").innerText.includes("Pending Review")'))
  await click('button[aria-label="Remove new-resume.pdf"]')
  await button('Cancel')
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 5)
  await click('button[aria-label="Remove new-resume.pdf"]')
  await button('Remove Resume')
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 4)
  const pdf = await fetch(`${base}/candidate-demo-resume.pdf`)
  assert.ok((await pdf.text()).startsWith('%PDF'))
  console.log('PASS: invalid file, pending resume, remove/cancel and local sample PDF')
  await evaluate(`import('/src/lib/validationConfig.js').then(module => { module.VALIDATION_CONFIG.enabled = false })`)
  await uploadFile('development-test.exe', 'application/octet-stream')
  await button('Add Resume')
  assert.ok(await evaluate('document.querySelector("tbody tr").innerText.includes("development-test.exe")'))
  await click('nav a[href="/candidate/edit-profile"]')
  await fill('input[name="firstName"]', '')
  await button('Save Changes')
  assert.equal(await evaluate('location.pathname'), '/candidate/profile')
  console.log('PASS: disabled global validation permits invalid file and empty required field')
  for (const page of ['/login', '/register/candidate', '/candidate/profile/personal', '/candidate/profile/professional', '/candidate/profile/education', '/candidate/profile/work-experience', '/candidate/profile/skills', '/candidate/profile/certifications', '/candidate/profile/career-preferences', '/candidate/profile/resume']) { await route(page); assert.equal(await evaluate(`Boolean(document.querySelector('nav[aria-label="Candidate navigation"]'))`), false) }
  await route('/candidate/jobs/not-a-job')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Job not found')
  assert.deepEqual(errors, [], 'Browser runtime errors')
  console.log('PASS: existing auth/onboarding routes, invalid job and no browser runtime errors')
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ passed: true, routes: routes.length, viewports: [1440, 390], errors }, null, 2))
} finally {
  socket?.close()
  chrome?.kill()
  server.kill()
}
