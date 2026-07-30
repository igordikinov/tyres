import { useState } from 'react';
import { AnatomyView } from '@/components/anatomy/AnatomyView';
import { ProductionCanvas } from '@/components/canvas/ProductionCanvas';
import { KpiSidebar } from '@/components/kpi/KpiSidebar';
import { ThroughputPanel } from '@/components/kpi/ThroughputPanel';
import { Header } from '@/components/layout/Header';
import { ParameterPanel } from '@/components/layout/ParameterPanel';
import { TimelineBar } from '@/components/layout/TimelineBar';
import { MaterialsView } from '@/components/materials/MaterialsView';
import { ApsOverlay } from '@/components/modes/ApsOverlay';
import { ChapterRail } from '@/components/modes/ChapterRail';
import { CompareView } from '@/components/modes/CompareView';
import { NarrationBanner } from '@/components/modes/NarrationBanner';
import { usePresentationDirector } from '@/components/modes/usePresentationDirector';
import { Pressable } from '@/components/ui/Pressable';
import { BoltIcon, PresentationChartLineIcon, Squares2X2Icon } from '@/components/ui/icons';
import { SheetPanel } from '@/components/ui/SheetPanel';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  SimulationProvider,
  useSimulationControls,
  useSimulationFrame,
  useSimulationKpi,
} from '@/state/SimulationContext';

const CANVAS_ZONES = ['Смешивание и компоненты', 'Сборка, вулканизация и отделка'];

/** Tabs that describe the product rather than the running plant. */
const REFERENCE_MODES = new Set(['anatomy', 'materials']);

type PanelKey = 'kpi' | 'params' | 'chart';

const TOOLBAR: Array<{ key: PanelKey; label: string; icon: typeof BoltIcon }> = [
  { key: 'kpi', label: 'KPI', icon: Squares2X2Icon },
  { key: 'params', label: 'Параметры', icon: BoltIcon },
  { key: 'chart', label: 'График', icon: PresentationChartLineIcon },
];

const SHEET_TITLES: Record<PanelKey, string> = {
  kpi: 'KPI цеха',
  params: 'Параметры',
  chart: 'Выработка в час',
};

/** The only part of the layout that reconciles on every animation frame. */
function CanvasStage() {
  const { scenario, variantId, variants, tocMode, apsMode, demoMode } = useSimulationControls();
  const variantColor = variants.find((variant) => variant.id === variantId)?.tokenColor;
  const { snapshot } = useSimulationFrame();
  const { kpi } = useSimulationKpi();
  const presentation = usePresentationDirector();

  if (demoMode === 'anatomy') return <AnatomyView />;
  if (demoMode === 'materials') return <MaterialsView />;
  if (demoMode === 'compare') return <CompareView />;

  const narration = presentation.chapter?.narration ?? snapshot.narration;
  const eyebrow = presentation.chapter
    ? presentation.chapter.title
    : tocMode
      ? 'Теория ограничений'
      : 'Процесс';
  const emphasis = Boolean(presentation.chapter?.toc || (tocMode && kpi.bottleneckId));

  return (
    <>
      <div className="surface-card min-h-0 flex-1 overflow-hidden p-2">
        <ProductionCanvas
          scenario={scenario}
          snapshot={snapshot}
          tocMode={tocMode}
          informationFlow={apsMode}
          zones={CANVAS_ZONES}
          variantColor={variantColor}
        />
      </div>
      {narration ? (
        <NarrationBanner eyebrow={eyebrow} text={narration} emphasis={emphasis} />
      ) : null}
      <ApsOverlay />
      {demoMode === 'presentation' ? (
        <ChapterRail index={presentation.index} chapters={presentation.chapters} />
      ) : null}
    </>
  );
}

function DesktopWorkspace({ reference }: { reference: boolean }) {
  return (
    <main className="flex min-h-0 flex-1 gap-3 p-3">
      {reference ? null : (
        <aside className="scroll-thin hidden w-[268px] shrink-0 overflow-y-auto md:block xl:w-[292px]">
          <KpiSidebar />
        </aside>
      )}

      <section className="relative flex min-w-0 flex-1 flex-col">
        <CanvasStage />
      </section>

      {reference ? null : (
        <aside className="hidden w-[268px] shrink-0 flex-col gap-3 lg:flex xl:w-[292px]">
          <ThroughputPanel />
          <div className="min-h-0 flex-1">
            <ParameterPanel />
          </div>
        </aside>
      )}
    </main>
  );
}

function MobileWorkspace({ reference }: { reference: boolean }) {
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  return (
    <>
      <main className="relative flex min-h-0 flex-1 flex-col p-3">
        <section className="relative flex min-w-0 flex-1 flex-col">
          <CanvasStage />
        </section>
      </main>

      {reference ? null : (
        <nav
          aria-label="Панели"
          className="flex shrink-0 items-stretch gap-2 border-t border-line bg-surface px-3 py-2"
        >
          {TOOLBAR.map(({ key, label, icon: Icon }) => (
            <Pressable
              key={key}
              label={label}
              pressed={openPanel === key}
              onPress={() => setOpenPanel(key)}
              className="h-11 flex-1 gap-2 rounded-xl text-[12px] font-semibold text-ink-700"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Pressable>
          ))}
        </nav>
      )}

      <SheetPanel
        open={openPanel !== null}
        title={openPanel ? SHEET_TITLES[openPanel] : ''}
        onClose={() => setOpenPanel(null)}
      >
        {openPanel === 'kpi' ? <KpiSidebar /> : null}
        {openPanel === 'params' ? <ParameterPanel /> : null}
        {openPanel === 'chart' ? <ThroughputPanel /> : null}
      </SheetPanel>
    </>
  );
}

function Workspace() {
  const { demoMode } = useSimulationControls();
  const reference = REFERENCE_MODES.has(demoMode);
  const tier = useBreakpoint();

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-surface-muted"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Header />
      {tier === 'desktop' ? (
        <DesktopWorkspace reference={reference} />
      ) : (
        <MobileWorkspace reference={reference} />
      )}
      <TimelineBar />
    </div>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <Workspace />
    </SimulationProvider>
  );
}
