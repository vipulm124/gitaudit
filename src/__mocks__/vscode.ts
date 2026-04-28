import { vi } from 'vitest';

export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn((key, defaultValue) => defaultValue),
  })),
  workspaceFolders: [],
  onDidSaveTextDocument: vi.fn(),
};

export const window = {
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
};

export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn(),
};

export enum ViewColumn {
  One = 1,
  Two = 2,
  Three = 3,
}

export const Uri = {
  file: vi.fn((path) => ({ fsPath: path, path, scheme: 'file' })),
  parse: vi.fn((path) => ({ fsPath: path, path, scheme: 'file' })),
  joinPath: vi.fn((uri, ...parts) => ({ ...uri, path: uri.path + '/' + parts.join('/') })),
};

export class Disposable {
  static from(...disposables: any[]) {
    return { dispose: vi.fn() };
  }
  dispose() {}
}

export const EventEmitter = vi.fn().mockImplementation(() => ({
  event: vi.fn(),
  fire: vi.fn(),
  dispose: vi.fn(),
}));
