import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Save, Camera, Undo2, Redo2 } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import useSimulation from '../hooks/useSimulation';
import api from '../services/api';
import type { TemperatureSnapshot } from '@shared/types';

export const ControlBar: React.FC = () => {
  const {
    currentStep,
    totalSteps,
    currentTemperature,
    currentExperimentId,
    addSnapshot,
    undo,
    redo,
    undoStack,
    redoStack,
    maxHistorySize,
  } = useSimulationStore();

  const { play, pause, reset, stepForward, isRunning, isPaused, isFinished, isIdle } = useSimulation();

  const undoCount = undoStack.length;
  const redoCount = redoStack.length;
  const canUndoState = undoCount > 0 && !isRunning;
  const canRedoState = redoCount > 0 && !isRunning;

  const handleUndo = () => {
    if (!isRunning && undoCount > 0) {
      undo();
    }
  };

  const handleRedo = () => {
    if (!isRunning && redoCount > 0) {
      redo();
    }
  };

  const generateId = () => `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSaveSnapshot = async () => {
    const snapshot: TemperatureSnapshot = {
      id: generateId(),
      experimentId: currentExperimentId || 'default',
      step: currentStep,
      timestamp: Date.now(),
      temperatureData: currentTemperature.map(row => [...row]),
      name: `第 ${currentStep} 步`,
    };

    try {
      await api.snapshots.create(snapshot);
      addSnapshot(snapshot);
    } catch (error) {
      console.error('保存快照失败:', error);
    }
  };

  const handleSaveExperiment = async () => {
    const config = {
      id: currentExperimentId || generateId(),
      name: `实验 ${new Date().toLocaleString('zh-CN')}`,
      createdAt: Date.now(),
      grid: useSimulationStore.getState().grid,
      materialId: useSimulationStore.getState().materialId,
      boundaryConditions: useSimulationStore.getState().boundaryConditions,
      initialHeatSources: useSimulationStore.getState().initialHeatSources,
      totalSteps: useSimulationStore.getState().totalSteps,
      timeStep: useSimulationStore.getState().timeStep,
    };

    try {
      if (!currentExperimentId) {
        await api.experiments.create(config);
        useSimulationStore.getState().setCurrentExperimentId(config.id);
        useSimulationStore.getState().setExperiments([
          ...useSimulationStore.getState().experiments,
          config,
        ]);
      } else {
        await api.experiments.update(currentExperimentId, config);
      }
    } catch (error) {
      console.error('保存实验失败:', error);
    }
  };

  const formatTime = (step: number) => {
    const time = step * 0.1;
    return `${time.toFixed(1)}s`;
  };

  return (
    <div className="h-20 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-6 flex items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1">
          <button
            onClick={handleUndo}
            disabled={!canUndoState}
            className="w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all hover:scale-105 relative"
            title={`撤销 (Ctrl+Z) - 历史: ${undoCount}/${maxHistorySize}`}
          >
            <Undo2 className="w-5 h-5" />
            {undoCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {undoCount}
              </span>
            )}
          </button>
          
          <button
            onClick={handleRedo}
            disabled={!canRedoState}
            className="w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all hover:scale-105 relative"
            title={`重做 (Ctrl+Y / Ctrl+Shift+Z) - 可重做: ${redoCount}`}
          >
            <Redo2 className="w-5 h-5" />
            {redoCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {redoCount}
              </span>
            )}
          </button>
        </div>

        <div className="w-px h-10 bg-slate-700" />

        <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1">
          {isIdle || isPaused || isFinished ? (
            <button
              onClick={play}
              className="w-12 h-12 flex items-center justify-center bg-green-500 hover:bg-green-400 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-green-500/30"
              title="播放"
            >
              <Play className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              onClick={pause}
              className="w-12 h-12 flex items-center justify-center bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-yellow-500/30"
              title="暂停"
            >
              <Pause className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={stepForward}
            disabled={isRunning}
            className="w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all hover:scale-105"
            title="单步执行"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button
            onClick={reset}
            className="w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all hover:scale-105"
            title="重置"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveSnapshot}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/90 hover:bg-purple-500 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/20 text-sm font-medium"
          >
            <Camera className="w-4 h-4" />
            保存快照
          </button>
          <button
            onClick={handleSaveExperiment}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/90 hover:bg-blue-500 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/20 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            保存实验
          </button>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-center">
          <div className="text-xs text-slate-400 font-medium">当前步数</div>
          <div className="text-2xl font-bold text-white font-mono">
            {currentStep} <span className="text-sm text-slate-500">/ {totalSteps}</span>
          </div>
        </div>
        
        <div className="w-px h-10 bg-slate-700" />
        
        <div className="text-center">
          <div className="text-xs text-slate-400 font-medium">模拟时间</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {formatTime(currentStep)}
          </div>
        </div>
        
        <div className="w-px h-10 bg-slate-700" />
        
        <div className="text-center">
          <div className="text-xs text-slate-400 font-medium">状态</div>
          <div className={`text-lg font-bold ${
            isRunning ? 'text-green-400' :
            isPaused ? 'text-yellow-400' :
            isFinished ? 'text-purple-400' :
            'text-slate-400'
          }`}>
            {isRunning ? '运行中' : isPaused ? '已暂停' : isFinished ? '已完成' : '待命'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 transition-all duration-100"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 font-mono min-w-12">
          {((currentStep / totalSteps) * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

export default ControlBar;
