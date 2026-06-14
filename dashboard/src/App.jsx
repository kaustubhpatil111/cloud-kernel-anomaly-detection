import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import useSocket from './hooks/useSocket';
import Header from './components/Header/Header';
import ChartSection from './components/ChartSection/ChartSection';
import SyscallsPanel from './components/SyscallsPanel/SyscallsPanel';
import AlertsPanel from './components/AlertsPanel/AlertsPanel';
import DebugPanel from './components/DebugPanel/DebugPanel';
import Footer from './components/Footer/Footer';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import styles from './App.module.css';

export default function App() {
  const {
    connected,
    status,
    syscalls,
    syscallNames,
    currentLoss,
    lossHistory,
    timestamps,
    queueSize,
    totalCaptured,
    lastUpdate,
    alertHistory,
    stats,
    anomalyThreshold,
    setAnomalyThreshold,
    resetData,
  } = useSocket();

  const [showDebug, setShowDebug] = useState(false);
  const displaySyscalls = syscallNames.length > 0 ? syscallNames : syscalls.map(num => `sys_${num}`);
  const uniqueSyscalls = new Set(syscalls).size;
  const anomalyPercentage = lossHistory.length > 0
    ? ((lossHistory.filter(l => l > anomalyThreshold).length / lossHistory.length) * 100).toFixed(1)
    : 0;

  // Animated background particles (25+ feature: subtle floating dots)
  const particles = Array.from({ length: 15 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 8 + 4}px`,
        height: `${Math.random() * 8 + 4}px`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${Math.random() * 20 + 15}s`,
      }}
    />
  ));

  return (
    <ThemeProvider>
      <div className={styles.app}>
        {/* Animated floating particles */}
        <div className="background-particles">{particles}</div>

        <div className={styles.content}>
          <Header
            connected={connected}
            currentLoss={currentLoss}
            anomalyThreshold={anomalyThreshold}
            queueSize={queueSize}
            totalCaptured={totalCaptured}
            anomalyPercentage={anomalyPercentage}
            stats={stats}
            onReset={resetData}
            onToggleDebug={() => setShowDebug(!showDebug)}
            showDebug={showDebug}
            themeToggle={<ThemeToggle />}
            lossHistory={lossHistory}
          />

          <main className={styles.main}>
            <ChartSection
              lossHistory={lossHistory}
              timestamps={timestamps}
              currentLoss={currentLoss}
              anomalyThreshold={anomalyThreshold}
              onThresholdChange={setAnomalyThreshold}
            />

            <div className={styles.twoColumn}>
              <SyscallsPanel
                displaySyscalls={displaySyscalls}
                syscalls={syscalls}
                uniqueSyscalls={uniqueSyscalls}
              />
              <AlertsPanel
                alertHistory={alertHistory}
                stats={stats}
              />
            </div>

            {showDebug && (
              <DebugPanel
                connected={connected}
                status={status}
                queueSize={queueSize}
                totalCaptured={totalCaptured}
                currentLoss={currentLoss}
                anomalyThreshold={anomalyThreshold}
                lossHistoryLength={lossHistory.length}
                alertHistoryLength={alertHistory.length}
                uniqueSyscalls={uniqueSyscalls}
                displaySyscalls={displaySyscalls}
                onClose={() => setShowDebug(false)}
              />
            )}
          </main>

          <Footer lastUpdate={lastUpdate} />
        </div>
      </div>
    </ThemeProvider>
  );
}