# SeatMapBuilder

Editor visual interactivo para diseñar mapas de asientos. Inspirado en Seats.io, permite crear y editar filas, asientos, áreas y mesas.

## Setup

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Decisiones Técnicas

### Stack
- **Next.js 16.1.6** - Framework React con App Router
- **React 19** - Biblioteca UI con latest features
- **TypeScript** - Tipado estático para robustez
- **Tailwind CSS 4** - Estilos utilitarios
- **Zustand** - Gestión de estado global con persistencia

### Arquitectura

#### Canvas SVG
Se eligió SVG sobre Canvas HTML porque:
- Eventos por elemento nativos (click, hover)
- CSS styling directo
- Escalabilidad vectorial
- Mejor para interacción directa con elementos individuales

#### Gestión de Estado (Zustand)
- Store centralizado con todas las entidades (rows, seats, areas, tables)
- Persistencia automática en localStorage
- Acciones inmutables con spread operator
- Selector automático de estado

#### Coordinate System
- Coordenadas virtuales "mundiales"
- Transformación SVG para zoom/pan
- Conversión screen-to-SVG para interacciones precisas

### Estructura de Datos

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

## Features Implementadas

### MVP Completado
- ✅ Visualización de filas, asientos, áreas y mesas
- ✅ Crear filas con cantidad configurable de asientos
- ✅ Selección individual y múltiple (Shift+click)
- ✅ Etiquetado de todos los elementos
- ✅ Bulk labeling con patrones ({n}, {N}, prefijos)
- ✅ Zoom y pan del canvas
- ✅ Import/Export JSON completo
- ✅ "Nuevo mapa" con confirmación
- ✅ Persistencia en localStorage

### Controles
| Acción | Método |
|--------|--------|
| Seleccionar | Click |
| Multi-selección | Shift + Click |
| Pan | Alt + Drag o tool Pan |
| Zoom | Mouse wheel o botones +/- |
| Crear fila | Tool "Add Row" + click |
| Crear área | Tool "Add Area" + click |
| Crear mesa | Tool "Add Table" + click |
| Eliminar | Botón Delete o confirmación |

## Supuestos Asumidos

1. Estado en memoria (localStorage) sin backend requerido
2. Un solo mapa activo por sesión
3. Navegador moderno (ES2020+)
4. Resolución mínima 1280x720
5. Mapa 2D (no 3D)
6. Asientos posicionados automáticamente en filas/mesas

## Estructura del Proyecto

```
app/
├── components/
│   ├── canvas/
│   │   ├── SeatMapCanvas.tsx
│   │   ├── Seat.tsx
│   │   ├── Row.tsx
│   │   ├── Area.tsx
│   │   └── Table.tsx
│   ├── toolbar/
│   │   └── Toolbar.tsx
│   └── inspector/
│       └── InspectorPanel.tsx
├── store/
│   └── seatMapStore.ts
├── types/
│   └── index.ts
└── page.tsx
```

## Posibles Mejoras Futuras

- Undo/Redo con histórico de acciones
- Drag de elementos para reposicionar
- Rotación de filas y mesas
- Curvatura de filas
- Colores personalizables por área
- Preview de impresión
- Colaboración en tiempo real

