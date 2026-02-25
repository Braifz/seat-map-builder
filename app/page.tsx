import { Toolbar } from "./components/toolbar/Toolbar";
import { SeatMapCanvas } from "./components/canvas/SeatMapCanvas";
import { InspectorPanel } from "./components/inspector/InspectorPanel";

export default function Home() {
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <SeatMapCanvas />
        <InspectorPanel />
      </div>
    </main>
  );
}
