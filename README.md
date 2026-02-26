# SeatMapBuilder

Interactive visual editor for designing seat maps. Inspired by Seats.io, it allows creating and editing rows, seats, areas, and tables.

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

Developed with **Windsurf IDE** and **Kimi k2.5** LLM model.

## Technical Decisions

### Stack
- **Next.js 16.1.6** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Static typing for robustness
- **Tailwind CSS 4** - Utility-first styling
- **Zustand** - Global state management with persistence

### Architecture

#### SVG Canvas
SVG was chosen over HTML Canvas because:
- Native per-element events (click, hover)
- Direct CSS styling
- Vector scalability
- Better for direct interaction with individual elements

#### State Management (Zustand)
- Centralized store with all entities (rows, seats, areas, tables)
- Automatic persistence in localStorage
- Immutable actions with spread operator
- Automatic state selection

#### Coordinate System
- Virtual "world" coordinates
- SVG transformation for zoom/pan
- Screen-to-SVG conversion for precise interactions

### Data Structure

```typescript
interface Seat {
  id: string;
  label: string;
  position: { x, y };
  type: 'seat' | 'wheelchair' | 'companion' | 'vip';
  status: 'available' | 'occupied' | 'blocked';
  rowId?: string;
  tableId?: string;
}

interface Row {
  id: string;
  label: string;
  position: { x, y };
  seats: string[];
}

interface Area {
  id: string;
  label: string;
  position: { x, y };
  size: { width, height };
  color?: string;
}

interface Table {
  id: string;
  label: string;
  position: { x, y };
  shape: 'round' | 'rectangular';
  size: { width, height };
  seats: string[];
}
```

## Implemented Features

### MVP Completed
- ✅ Visualization of rows, seats, areas, tables, and structures
- ✅ Create rows with configurable number of seats
- ✅ Create multiple rows at once with bulk configuration
- ✅ Individual and multiple selection (Shift+click, box selection)
- ✅ Labeling of all elements with bulk patterns ({n}, {N}, prefixes)
- ✅ Canvas zoom, pan, and spacebar temporary pan mode
- ✅ Multi-element drag to reposition
- ✅ Element rotation (areas, tables, structures)
- ✅ Element resizing (areas, tables, structures)
- ✅ Layer management (bring to front, send to back)
- ✅ Section system with colors, pricing, and seat inheritance
- ✅ Structures (stage, bar, entrance, exit, custom)
- ✅ Lines and freehand drawing
- ✅ Complete JSON Import/Export
- ✅ Context menu for quick actions
- ✅ "New map" with confirmation
- ✅ Persistence in localStorage
- ✅ Edit selected elements modal

### Controls
| Action | Method |
|--------|--------|
| Select | Click |
| Multi-selection | Shift + Click or Box selection |
| Pan | Alt + Drag, Spacebar hold, or Pan tool |
| Zoom | Mouse wheel or +/- buttons |
| Create row | "Add Row" tool + click |
| Create multiple rows | "Add Multiple Rows" tool + click |
| Create area | "Add Area" tool + click |
| Create table | "Add Table" tool + click |
| Create structure | "Add Structure" tool + click |
| Create line | "Add Line" tool + click and drag |
| Delete | Delete button, confirmation, or context menu |
| Context menu | Right-click on element |
| Rotate | Rotate handle on selected elements |
| Resize | Resize handles on selected elements |
| Layer order | Bring to front / Send to back buttons |

## Assumptions

1. In-memory state (localStorage) with no backend required
2. Only one active map per session
3. Modern browser (ES2020+)
4. Minimum resolution 1280x720
5. 2D map (no 3D)
6. Seats automatically positioned in rows/tables

## Project Structure

```
app/
├── components/
│   ├── canvas/
│   │   ├── SeatMapCanvas.tsx
│   │   ├── Seat.tsx
│   │   ├── Row.tsx
│   │   ├── Area.tsx
│   │   ├── Table.tsx
│   │   ├── Structure.tsx
│   │   ├── ResizeHandles.tsx
│   │   └── RotateHandle.tsx
│   ├── toolbar/
│   │   └── Toolbar.tsx
│   ├── inspector/
│   │   └── InspectorPanel.tsx
│   ├── modals/
│   │   ├── CreateRowModal.tsx
│   │   ├── CreateMultipleRowsModal.tsx
│   │   ├── CreateAreaModal.tsx
│   │   ├── CreateTableModal.tsx
│   │   ├── CreateStructureModal.tsx
│   │   ├── CreateLineModal.tsx
│   │   ├── EditSelectionModal.tsx
│   │   └── ConfirmationModal.tsx
│   └── ContextMenu.tsx
├── store/
│   └── seatMapStore.ts
├── types/
│   └── index.ts
└── page.tsx
```

## Future Improvements

- Undo/Redo with action history
- Drag elements to reposition
- Rotation of rows and tables
- Row curvature
- Custom colors per area
- Print preview
- Real-time collaboration
