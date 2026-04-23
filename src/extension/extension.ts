import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { analyzeRepo, getCurrentBranch } from "../analyzer/gitEngine";
import { scoreFiles } from "../analyzer/scorer";
import { detectForbiddenFiles } from "../analyzer/forbidden";
import { createAuthorChart } from "../analyzer/authorchart";
import { saveCache } from "../cache/cache";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("gitaudit.start", () => {
    GitAuditPanel.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(disposable);

  const analyzeCommand = vscode.commands.registerCommand(
    "gitaudit.analyze",
    async () => {
      vscode.window.showInformationMessage("Analyzing Repository....");
      await GitAuditPanel.runAnalyzer(context.extensionUri);
      vscode.window.showInformationMessage(
        "Repository analysis complete. Opening dashboard",
      );
      GitAuditPanel.createOrShow(context.extensionUri);
    },
  );
  context.subscriptions.push(analyzeCommand);
}

class GitAuditPanel {
  public static currentPanel: GitAuditPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Listen for messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "READY":
            this._loadDataAndSend();
            break;
          case "RUN_ANALYZER":
            await GitAuditPanel.runAnalyzer(this._extensionUri);
            vscode.window.showInformationMessage("Re-analyzed repo. Loading updated Dashboard");
            this._loadDataAndSend();
            vscode.window.showInformationMessage("Updated Dashboard loaded.");
            break;
        }
      },
      null,
      this._disposables,
    );
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (GitAuditPanel.currentPanel) {
      GitAuditPanel.currentPanel._panel.reveal(column);
      GitAuditPanel.currentPanel._loadDataAndSend();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "gitAudit",
      "GitAudit",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist")],
        retainContextWhenHidden: true,
      },
    );

    GitAuditPanel.currentPanel = new GitAuditPanel(panel, extensionUri);
  }

  public static async runAnalyzer(extensionUri: vscode.Uri) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const repoPath = workspaceFolders[0].uri.fsPath;
    vscode.window.showInformationMessage(repoPath);

    const metrics = await analyzeRepo(repoPath, (msg, current, total) => {
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      process.stdout.write(`\r   ${msg} ${pct}%   `);
    });
    const currentBranch = getCurrentBranch(repoPath);

    // Step 3 — Score
    const scoredFiles = scoreFiles(metrics.files);

    // Step 4 — Forbidden files
    const forbiddenFiles = detectForbiddenFiles(scoredFiles);

    // Step 5 — Get author statistics
    const authorStats = createAuthorChart(repoPath);

    // Step 6 — Save cache
    saveCache(repoPath, currentBranch, metrics, scoredFiles, forbiddenFiles, authorStats);
  }

  private async _loadDataAndSend() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const rootPath = workspaceFolders[0].uri.fsPath;
    const cachePath = path.join(
      rootPath,
      ".vscode",
      "archaeologist-cache.json",
    );

    try {
      if (fs.existsSync(cachePath)) {
        const content = fs.readFileSync(cachePath, "utf8");
        const data = JSON.parse(content);
        this._panel.webview.postMessage({ type: "DATA_LOADED", data });
      } else {
        vscode.window.showWarningMessage(
          "Archaeologist cache file not found in .vscode folder.",
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error loading cache: ${error}`);
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "dist",
        "webview",
        "assets",
        "index.js",
      ),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "dist",
        "webview",
        "assets",
        "index.css",
      ),
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <link href="${styleUri}" rel="stylesheet">
        <title>GitAudit</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  public dispose() {
    GitAuditPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
