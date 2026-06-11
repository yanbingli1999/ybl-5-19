import { create } from 'zustand';
import type {
  Material,
  GridConfig,
  BoundaryConditions,
  HeatSource,
  ExperimentConfig,
  TemperatureSnapshot,
  ExperimentResult,
  SimulationMode,
} from '@shared/types';

interface HistoryState {
  temperature: number[][];
  heatSources: HeatSource[];
}

interface SimulationState {
  mode: SimulationMode;
  currentStep: number;
  currentTemperature: number[][];
  temperatureHistory: number[][][];
  
  grid: GridConfig;
  boundaryConditions: BoundaryConditions;
  materialId: string;
  materials: Material[];
  diffusionCoefficient: number;
  initialHeatSources: HeatSource[];
  totalSteps: number;
  timeStep: number;
  playbackSpeed: number;
  minTemp: number;
  maxTemp: number;
  brushSize: number;
  brushTemperature: number;
  drawMode: 'heat' | 'erase' | 'none';
  
  snapshots: TemperatureSnapshot[];
  experiments: ExperimentConfig[];
  favorites: ExperimentResult[];
  
  currentExperimentId: string | null;
  hoveredCell: { x: number; y: number } | null;
  
  undoStack: HistoryState[];
  redoStack: HistoryState[];
  maxHistorySize: number;
  
  setMode: (mode: SimulationMode) => void;
  setCurrentStep: (step: number) => void;
  setCurrentTemperature: (temp: number[][]) => void;
  addTemperatureToHistory: (temp: number[][]) => void;
  clearHistory: () => void;
  
  setGrid: (grid: GridConfig) => void;
  setBoundaryConditions: (bc: BoundaryConditions) => void;
  setMaterialId: (id: string) => void;
  setMaterials: (materials: Material[]) => void;
  setDiffusionCoefficient: (alpha: number) => void;
  setInitialHeatSources: (sources: HeatSource[]) => void;
  addHeatSource: (source: HeatSource) => void;
  removeHeatSource: (index: number) => void;
  clearHeatSources: () => void;
  setTotalSteps: (steps: number) => void;
  setTimeStep: (dt: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setBrushSize: (size: number) => void;
  setBrushTemperature: (temp: number) => void;
  setDrawMode: (mode: 'heat' | 'erase' | 'none') => void;
  setTempRange: (min: number, max: number) => void;
  
  setSnapshots: (snapshots: TemperatureSnapshot[]) => void;
  addSnapshot: (snapshot: TemperatureSnapshot) => void;
  removeSnapshot: (id: string) => void;
  setExperiments: (experiments: ExperimentConfig[]) => void;
  setFavorites: (favorites: ExperimentResult[]) => void;
  setCurrentExperimentId: (id: string | null) => void;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
  
  pushHistory: () => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearUndoRedo: () => void;
  
  reset: () => void;
}

const DEFAULT_GRID: GridConfig = {
  width: 50,
  height: 50,
  cellSize: 12,
};

const DEFAULT_BC: BoundaryConditions = {
  top: 25,
  bottom: 25,
  left: 25,
  right: 25,
  type: 'dirichlet',
};

function createEmptyTemperature(grid: GridConfig): number[][] {
  const data: number[][] = [];
  for (let y = 0; y < grid.height; y++) {
    data[y] = new Array(grid.width).fill(25);
  }
  return data;
}

function deepCloneTemperature(data: number[][]): number[][] {
  return data.map(row => [...row]);
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  mode: 'idle',
  currentStep: 0,
  currentTemperature: createEmptyTemperature(DEFAULT_GRID),
  temperatureHistory: [],
  
  grid: DEFAULT_GRID,
  boundaryConditions: DEFAULT_BC,
  materialId: 'copper',
  materials: [],
  diffusionCoefficient: 117e-6,
  initialHeatSources: [],
  totalSteps: 500,
  timeStep: 0.1,
  playbackSpeed: 30,
  minTemp: 0,
  maxTemp: 100,
  brushSize: 2,
  brushTemperature: 100,
  drawMode: 'heat',
  
  snapshots: [],
  experiments: [],
  favorites: [],
  
  currentExperimentId: null,
  hoveredCell: null,
  
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,
  
  setMode: (mode) => set({ mode }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setCurrentTemperature: (temp) => set({ currentTemperature: temp }),
  addTemperatureToHistory: (temp) =>
    set((state) => ({
      temperatureHistory: [...state.temperatureHistory, temp],
    })),
  clearHistory: () => set({ temperatureHistory: [], currentStep: 0 }),
  
  setGrid: (grid) =>
    set({
      grid,
      currentTemperature: createEmptyTemperature(grid),
      temperatureHistory: [],
      currentStep: 0,
      undoStack: [],
      redoStack: [],
    }),
  setBoundaryConditions: (bc) => set({ boundaryConditions: bc }),
  setMaterialId: (id) => {
    const material = get().materials.find(m => m.id === id);
    if (material) {
      set({
        materialId: id,
        diffusionCoefficient: material.diffusionCoefficient,
      });
    }
  },
  setMaterials: (materials) => set({ materials }),
  setDiffusionCoefficient: (alpha) => set({ diffusionCoefficient: alpha }),
  setInitialHeatSources: (sources) => set({ initialHeatSources: sources }),
  addHeatSource: (source) =>
    set((state) => ({
      initialHeatSources: [...state.initialHeatSources, source],
    })),
  removeHeatSource: (index) =>
    set((state) => ({
      initialHeatSources: state.initialHeatSources.filter((_, i) => i !== index),
    })),
  clearHeatSources: () => set({ initialHeatSources: [] }),
  setTotalSteps: (steps) => set({ totalSteps: steps }),
  setTimeStep: (dt) => set({ timeStep: dt }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushTemperature: (temp) => set({ brushTemperature: temp }),
  setDrawMode: (mode) => set({ drawMode: mode }),
  setTempRange: (min, max) => set({ minTemp: min, maxTemp: max }),
  
  setSnapshots: (snapshots) => set({ snapshots }),
  addSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
    })),
  removeSnapshot: (id) =>
    set((state) => ({
      snapshots: state.snapshots.filter(s => s.id !== id),
    })),
  setExperiments: (experiments) => set({ experiments }),
  setFavorites: (favorites) => set({ favorites }),
  setCurrentExperimentId: (id) => set({ currentExperimentId: id }),
  setHoveredCell: (cell) => set({ hoveredCell: cell }),
  
  pushHistory: () => {
    const state = get();
    if (state.mode === 'running') return;
    
    const currentState: HistoryState = {
      temperature: deepCloneTemperature(state.currentTemperature),
      heatSources: state.initialHeatSources.map(s => ({ ...s })),
    };
    
    set((prev) => {
      let newUndoStack = [...prev.undoStack, currentState];
      if (newUndoStack.length > prev.maxHistorySize) {
        newUndoStack = newUndoStack.slice(newUndoStack.length - prev.maxHistorySize);
      }
      return {
        undoStack: newUndoStack,
        redoStack: [],
      };
    });
  },
  
  undo: () => {
    const state = get();
    if (state.mode === 'running') return false;
    if (state.undoStack.length === 0) return false;
    
    const previousState = state.undoStack[state.undoStack.length - 1];
    const currentState: HistoryState = {
      temperature: deepCloneTemperature(state.currentTemperature),
      heatSources: state.initialHeatSources.map(s => ({ ...s })),
    };
    
    set((prev) => ({
      undoStack: prev.undoStack.slice(0, -1),
      redoStack: [...prev.redoStack, currentState],
      currentTemperature: deepCloneTemperature(previousState.temperature),
      initialHeatSources: previousState.heatSources.map(s => ({ ...s })),
      temperatureHistory: [],
      currentStep: 0,
    }));
    
    return true;
  },
  
  redo: () => {
    const state = get();
    if (state.mode === 'running') return false;
    if (state.redoStack.length === 0) return false;
    
    const nextState = state.redoStack[state.redoStack.length - 1];
    const currentState: HistoryState = {
      temperature: deepCloneTemperature(state.currentTemperature),
      heatSources: state.initialHeatSources.map(s => ({ ...s })),
    };
    
    set((prev) => ({
      redoStack: prev.redoStack.slice(0, -1),
      undoStack: [...prev.undoStack, currentState],
      currentTemperature: deepCloneTemperature(nextState.temperature),
      initialHeatSources: nextState.heatSources.map(s => ({ ...s })),
      temperatureHistory: [],
      currentStep: 0,
    }));
    
    return true;
  },
  
  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  
  clearUndoRedo: () => set({ undoStack: [], redoStack: [] }),
  
  reset: () =>
    set((state) => ({
      mode: 'idle',
      currentStep: 0,
      currentTemperature: createEmptyTemperature(state.grid),
      temperatureHistory: [],
      undoStack: [],
      redoStack: [],
    })),
}));

export default useSimulationStore;
