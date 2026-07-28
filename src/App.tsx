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
import {
  SimulationProvider,
  useSimulationControls,
  useSimulationFrame,
  useSimulationKpi,
} from '@/state/SimulationContext';

const CANVAS_ZONES = ['Смешивание и компоненты', 'Сборка, вулканизация и отделка'];

/** Tabs that describe the product rather than the running plant. */
const REFERENCE_MODES = new Set(['anatomy', 'materials']);

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

function Workspace() {
  const { demoMode } = useSimulationControls();
  const reference = REFERENCE_MODES.has(demoMode);

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
