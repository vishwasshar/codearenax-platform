import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "xterm-addon-fit";
import { FiChevronDown, FiChevronUp, FiTrash2 } from "react-icons/fi";
import "@xterm/xterm/css/xterm.css";

export interface TerminalHandle {
  write: (data: string) => void;
  clear: () => void;
}

const TerminalPanel = forwardRef<TerminalHandle, {}>((_props, ref) => {
  const terminalEl = useRef<HTMLDivElement | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!terminalEl.current) return;

    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      scrollback: 1000,
      fontSize: 13,
      fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
      theme: { background: "#0d1117", cursor: "#528bff" },
    });

    const fitAddOn = new FitAddon();
    term.loadAddon(fitAddOn);
    term.open(terminalEl.current);

    requestAnimationFrame(() => {
      try {
        fitAddOn.fit();
      } catch {
        // terminal not yet visible
      }
    });

    term.write("Welcome to Code Arena X Terminal\r\n");
    terminalInstance.current = term;
    fitAddonRef.current = fitAddOn;

    const handleResize = () => {
      try {
        fitAddOn?.fit();
      } catch {
        // ignore
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      term.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (collapsed) return;
    requestAnimationFrame(() => {
      try {
        fitAddonRef.current?.fit();
      } catch {
        // ignore
      }
    });
  }, [collapsed]);

  useImperativeHandle(ref, () => ({
    write: (data: string) => {
      terminalInstance.current?.write(data);
    },
    clear: () => {
      terminalInstance.current?.clear();
    },
  }));

  const handleClear = () => {
    terminalInstance.current?.clear();
  };

  return (
    <div className="flex flex-col bg-[#0d1117] border-t border-gray-700/50">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-gray-700/30 select-none">
        <div className="flex items-center gap-2">
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={() => setCollapsed((p) => !p)}
          >
            {collapsed ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
          <span className="text-xs font-medium text-gray-300">TERMINAL</span>
        </div>
        <button
          className="text-gray-500 hover:text-gray-300 transition-colors"
          onClick={handleClear}
          title="Clear"
        >
          <FiTrash2 size={13} />
        </button>
      </div>
      {!collapsed && (
        <div ref={terminalEl} className="w-full" style={{ height: 150 }} />
      )}
    </div>
  );
});

TerminalPanel.displayName = "TerminalPanel";
export default TerminalPanel;
