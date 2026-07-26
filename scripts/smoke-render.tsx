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
