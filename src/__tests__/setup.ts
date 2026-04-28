import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock VS Code
vi.mock('vscode', () => {
  return {
    workspace: {
      getConfiguration: vi.fn(() => ({
        get: vi.fn((key, defaultValue) => defaultValue),
      })),
      workspaceFolders: [],
      onDidSaveTextDocument: vi.fn(),
    },
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      createWebviewPanel: vi.fn(() => ({
        webview: {
          onDidReceiveMessage: vi.fn(),
          postMessage: vi.fn(),
          asWebviewUri: vi.fn((uri) => uri),
          cspSource: 'vscode-resource:',
        },
        reveal: vi.fn(),
        onDidDispose: vi.fn(),
        dispose: vi.fn(),
      })),
      activeTextEditor: undefined,
      visibleTextEditors: [],
    },
    commands: {
      registerCommand: vi.fn(),
      executeCommand: vi.fn(),
    },
    ViewColumn: {
      One: 1,
      Two: 2,
      Three: 3,
    },
    Uri: {
      file: vi.fn((path) => ({ fsPath: path, path, scheme: 'file' })),
      parse: vi.fn((path) => ({ fsPath: path, path, scheme: 'file' })),
      joinPath: vi.fn((uri, ...parts) => ({ ...uri, path: uri.path + '/' + parts.join('/') })),
    },
    EventEmitter: vi.fn().mockImplementation(() => ({
      event: vi.fn(),
      fire: vi.fn(),
      dispose: vi.fn(),
    })),
    Disposable: class {
      static from = vi.fn();
      dispose = vi.fn();
    }
  };
});

// Mock child_process
vi.mock('child_process', () => {
  const mockExec = vi.fn();
  return {
    execSync: mockExec,
    default: {
      execSync: mockExec,
    },
    __esModule: true
  };
});

// Web APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

(global as any).acquireVsCodeApi = () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
});

if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    toJSON: () => ({}),
  } as DOMRect);
}
