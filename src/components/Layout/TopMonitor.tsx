import { useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useCaptureKeydown } from '../../hooks/useCaptureKeydown';

interface TopMonitorProps {
  onExit: () => void;
}

interface Process {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
}

const Table = styled('pre')(({ theme }) => ({
  margin: 0,
  color: theme.palette.text.primary,
}));

const INITIAL: Process[] = [
  { pid: 1, name: 'terminal', cpu: 12.0, mem: 4.2 },
  { pid: 7, name: 'space.mp4', cpu: 33.7, mem: 18.9 },
  { pid: 13, name: 'auth-provider', cpu: 0.3, mem: 2.1 },
  { pid: 42, name: 'gantt-renderer', cpu: 1.2, mem: 6.6 },
  { pid: 83, name: 'promise-batch', cpu: 7.7, mem: 3.3 },
  { pid: 101, name: 'snake', cpu: 0.0, mem: 0.4 },
  { pid: 404, name: 'guestbook', cpu: 0.0, mem: 0.0 },
];

const jitter = (value: number, spread: number, max: number) =>
  Math.min(max, Math.max(0, value + (Math.random() - 0.5) * spread));

function TopMonitor({ onExit }: TopMonitorProps) {
  const [processes, setProcesses] = useState<Process[]>(INITIAL);
  const [now, setNow] = useState(() => performance.now());
  const doneRef = useRef(false);

  useCaptureKeydown((event) => {
    if ((event.key === 'q' || event.key === 'Escape') && !doneRef.current) {
      doneRef.current = true;
      onExit();
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(performance.now());
      setProcesses((prev) => prev.map((proc) => ({
        ...proc,
        cpu: jitter(proc.cpu, 6, 99.9),
        mem: jitter(proc.mem, 1, 42),
      })));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const seconds = Math.floor(now / 1000);
  const uptime = `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  const header = [
    `wattry.com top — uptime ${uptime}`,
    heap ? `js heap: ${(heap.usedJSHeapSize / 1048576).toFixed(1)} MiB` : null,
    '',
    '  PID  NAME            CPU%   MEM%',
  ].filter((line): line is string => line !== null);
  const body = processes.map((proc) =>
    `${String(proc.pid).padStart(5)}  ${proc.name.padEnd(14)}  ${proc.cpu.toFixed(1).padStart(5)}  ${proc.mem.toFixed(1).padStart(5)}`
  );

  return (
    <>
      <Table>{[...header, ...body].join('\n')}</Table>
      <Typography>q or Esc exits</Typography>
    </>
  );
}

export default TopMonitor;
