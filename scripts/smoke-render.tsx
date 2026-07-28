/**
 * Headless render smoke test.
 *
 * Boots the real application inside jsdom, lets the animation loop run and
 * asserts that the canvas, KPI panel and controls are actually produced.
 * Run with:  npm run smoke
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});

const view = dom.window as unknown as Window & typeof globalThis;
const globalAny = globalThis as unknown as Record<string, unknown>;

globalAny.window = view;
globalAny.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  get: () => dom.window.navigator,
});
globalAny.HTMLElement = dom.window.HTMLElement;
globalAny.SVGElement = dom.window.SVGElement;
globalAny.Element = dom.window.Element;
globalAny.Node = dom.window.Node;
globalAny.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalAny.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalAny.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalAny.IS_REACT_ACT_ENVIRONMENT = false;

class StubObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalAny.ResizeObserver = StubObserver;
globalAny.IntersectionObserver = StubObserver;
(dom.window as unknown as Record<string, unknown>).ResizeObserver = StubObserver;

// jsdom ships no canvas backend; lottie-web probes one when it loads.
dom.window.HTMLCanvasElement.prototype.getContext = (() => ({
  fillStyle: '',
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: [] }),
  putImageData: () => {},
  createImageData: () => [],
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  restore: () => {},
  beginPath: () => {},
  closePath: () => {},
  measureText: () => ({ width: 0 }),
})) as unknown as HTMLCanvasElement['getContext'];

const matchMedia = () => ({
  matches: false,
  media: '',
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
globalAny.matchMedia = matchMedia;
(dom.window as unknown as Record<string, unknown>).matchMedia = matchMedia;

const { createElement } = await import('react');
const { createRoot } = await import('react-dom/client');
const { default: App } = await import('../src/App');
const { getScenario } = await import('../src/core/scenario');

const container = dom.window.document.getElementById('root')!;
const root = createRoot(container);
root.render(createElement(App));

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const press = (label: string) => {
  const target = container.querySelector(`[aria-label="${label}"]`);
  target?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
};
const clock = () =>
  container.querySelector('[role="slider"][aria-label="Таймлайн симуляции"]')?.getAttribute('aria-valuenow') ??
  '';

await wait(400);
const failures: string[] = [];
const expect = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};
const scenario = getScenario();

const idleClock = clock();
press('Пуск');
await wait(900);
const runningClock = clock();
expect(runningClock !== idleClock, 'the simulation clock did not advance after Play');
expect(Number(runningClock) > 0, `expected a positive clock, got "${runningClock}"`);

press('Показать ТОС');
await wait(200);
press('Показать APS');
await wait(200);
expect(container.textContent?.includes('Планировщик по мощности') === true, 'the APS overlay did not open');
press('Пауза');
await wait(120);

// Reference tabs: anatomy of the product and its bill of materials.
press('Анатомия');
await wait(300);
const anatomyText = container.textContent ?? '';
for (const part of scenario.construction) {
  expect(anatomyText.includes(part.name), `anatomy tab is missing "${part.name}"`);
}
for (const layer of scenario.assemblyLayers) {
  expect(anatomyText.includes(layer.name), `assembly sequence is missing "${layer.name}"`);
}
expect(anatomyText.includes('Зелёная шина'), 'the green tire result is missing');

press('Материалы');
await wait(300);
const materialsText = container.textContent ?? '';
for (const material of scenario.materials) {
  expect(materialsText.includes(material.name), `materials tab is missing "${material.name}"`);
}
expect(materialsText.includes('ПОТОК ИНФОРМАЦИИ'), 'the information flow legend is missing');
expect(materialsText.includes('ПОТОК МАТЕРИАЛОВ'), 'the material flow legend is missing');

press('Онлайн');
await wait(200);

const html = container.innerHTML;
const text = container.textContent ?? '';
const svgCount = container.querySelectorAll('svg').length;

expect(/запущено\s+[1-9]/i.test(text), 'no tires were released into the line');

expect(html.length > 5000, `expected a rich DOM, got ${html.length} characters`);
expect(svgCount >= 2, `expected the production canvas and the chart, found ${svgCount} SVG roots`);
for (const node of scenario.nodes) {
  expect(text.includes(node.name), `station "${node.name}" is missing from the canvas`);
}
for (const label of ['Выработка', 'Время цикла', 'НЗП', 'Очередь', 'Загрузка', 'Узкое место', 'Готовые шины']) {
  expect(text.includes(label), `KPI card "${label}" is missing`);
}
for (const label of ['Стадии шины', 'Зелёная', 'Вулканизированная']) {
  expect(text.includes(label), `appearance-stage legend is missing "${label}"`);
}
// Summer has no studding params, so the «Ошиповка» group must not render at all.
expect(!text.includes('Ошиповка'), 'the empty «Ошиповка» parameter group must not render for summer');
for (const control of ['Пуск', 'Шаг', 'Сброс', 'Показать ТОС', 'Показать APS']) {
  expect(
    container.querySelector(`[aria-label="${control}"]`) !== null,
    `control "${control}" is missing`,
  );
}
expect(
  container.querySelector('[role="slider"][aria-label="Таймлайн симуляции"]') !== null,
  'the timeline scrubber is missing',
);
expect(container.querySelectorAll('button').length === 0, 'native <button> elements must not be used');
expect(container.querySelectorAll('input').length === 0, 'native <input> elements must not be used');

// Switching to the studded variant reveals the studding line and its slider group.
const canvasImagesSummer = container.querySelectorAll('svg image').length;
press('Шипы');
await wait(250);
for (const label of ['Время ошиповки', 'Автоматы ошиповки', 'Отлёжка']) {
  expect(
    container.querySelector(`[aria-label="${label}"]`) !== null,
    `studding slider "${label}" is missing for the studded variant`,
  );
}
// The three new stations render as photos, so the canvas gains <image> elements.
expect(
  container.querySelectorAll('svg image').length > canvasImagesSummer,
  'studded stations did not add photo <image> elements to the canvas',
);
const studdedText = container.textContent ?? '';
for (const node of ['Ошиповка', 'Контроль шипов', 'Отлёжка', 'Ошипованная']) {
  expect(studdedText.includes(node), `studded canvas/legend is missing "${node}"`);
}
expect(
  container.querySelectorAll('button').length === 0 && container.querySelectorAll('input').length === 0,
  'native <button>/<input> elements must not appear after switching variant',
);
press('Анатомия');
await wait(300);
const studdedAnatomy = container.textContent ?? '';
expect(studdedAnatomy.includes('Шип противоскольжения'), 'studded anatomy is missing the stud construction element');
expect(studdedAnatomy.includes('Анатомия шипа'), 'the StudCallout is missing from studded anatomy');
expect(
  container.querySelector('img[alt*="шипованной"]') !== null,
  'studded anatomy is missing the studded cutaway/exploded imagery',
);
expect(
  container.querySelector('img[alt="Готовая шипованная шина"]') !== null,
  'studded anatomy is missing the finished-studded photo',
);
press('Материалы');
await wait(300);
const studdedMaterials = container.textContent ?? '';
expect(studdedMaterials.includes('Шипы противоскольжения'), 'studded materials table is missing the stud row');
expect(studdedMaterials.includes('единственный материал'), 'studded materials is missing the post-vulcanisation note');
press('Онлайн');
await wait(150);
press('Лето');
await wait(150);

// Mixed flow: the «Микс» switch reveals the plan/policy controls and its sliders.
press('Микс');
await wait(250);
const mixedText = container.textContent ?? '';
for (const label of ['Межсезонье', 'Пик зимы', 'FIFO', 'Кампании']) {
  expect(mixedText.includes(label), `mixed-flow panel is missing the "${label}" control`);
}
for (const slider of ['Переналадка формы', 'Размер кампании']) {
  expect(container.querySelector(`[aria-label="${slider}"]`) !== null, `mixed-flow slider "${slider}" is missing`);
}
press('Пик зимы');
await wait(150);
expect((container.textContent ?? '').includes('10 / 40 / 50'), 'switching to the peak-winter plan did not update the mix ratio');
press('Кампании');
await wait(150);
press('Лето');
await wait(150);

// Presentation script now travels in scenario data; the director must run it.
press('Презентация');
await wait(400);
expect(
  (container.textContent ?? '').includes('полуфабрикаты компонентов'),
  'the presentation did not open its first chapter from scenario data',
);
press('Онлайн');
await wait(150);

// Compare mode offers a pair selector; the variant pair mirrors two plants.
press('Сравнение');
await wait(300);
expect((container.textContent ?? '').includes('База vs Оптимизация'), 'the compare pair selector is missing');
press('Лето vs Зима шип.');
await wait(300);
expect(
  (container.textContent ?? '').includes('Зимняя шипованная'),
  'the variant compare pane did not switch to the studded plant',
);
press('Онлайн');
await wait(150);

// Studding and stud-check stations render as realistic photos, like the rest
// of the line (tyre-tvz.2), not inline SVG.
const { MACHINE_IMAGES } = await import('../src/components/machines/machineImages');
for (const kind of ['studding', 'studcheck', 'reststack']) {
  const href = (MACHINE_IMAGES as Record<string, string | undefined>)[kind];
  expect(typeof href === 'string' && href.length > 0, `MACHINE_IMAGES is missing a photo for "${kind}"`);
}

// Product-variant token: green → cured → studded, rim tinted by the variant.
const { TireToken } = await import('../src/components/canvas/TireToken');
const VARIANT_RIM = '#5D7A94';
const tokenHosts = [0, 1, 2].map((stage) => {
  const host = dom.window.document.createElement('div');
  createRoot(host).render(
    createElement(
      'svg',
      null,
      createElement(TireToken, {
        x: 0,
        y: 0,
        stage,
        variantColor: VARIANT_RIM,
        moving: false,
        highlighted: false,
        dimmed: false,
      }),
    ),
  );
  return host;
});
await wait(120);
const [greenToken, curedToken, studdedToken] = tokenHosts.map((host) => host.innerHTML);
const studCount = (svg: string) => (svg.match(/r="1\.5"/g) ?? []).length;
const treadCount = (svg: string) => (svg.match(/rotate\(/g) ?? []).length;
expect(treadCount(greenToken) === 0 && studCount(greenToken) === 0, 'green tire must be smooth (no tread, no studs)');
expect(treadCount(curedToken) >= 3 && studCount(curedToken) === 0, 'cured tire must show tread and no studs');
expect(studCount(studdedToken) === 8, `studded tire must show 8 studs, got ${studCount(studdedToken)}`);
expect(
  greenToken.includes(VARIANT_RIM) && studdedToken.includes(VARIANT_RIM),
  'token rim must use the variant colour',
);

root.unmount();

if (failures.length > 0) {
  console.error('SMOKE RENDER FAILED');
  failures.forEach((message) => console.error(`  - ${message}`));
  process.exit(1);
}
console.log(
  `SMOKE RENDER PASSED — ${html.length} characters of DOM, ${svgCount} SVG roots, clock at ${runningClock} min`,
);
process.exit(0);
