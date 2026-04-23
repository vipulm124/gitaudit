/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/webview/index.html",
    "./src/webview/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vscode: {
          bg: 'var(--vscode-editor-background)',
          fg: 'var(--vscode-foreground)',
          border: 'var(--vscode-widget-border)',
          hover: 'var(--vscode-list-hoverBackground)',
          focus: 'var(--vscode-focusBorder)',
          sidebar: 'var(--vscode-sideBar-background)',
          input: 'var(--vscode-input-background)',
          'input-fg': 'var(--vscode-input-foreground)',
          button: 'var(--vscode-button-background)',
          'button-fg': 'var(--vscode-button-foreground)',
          'button-hover': 'var(--vscode-button-hoverBackground)',
          chart: {
            blue: 'var(--vscode-charts-blue)',
            green: 'var(--vscode-charts-green)',
            yellow: 'var(--vscode-charts-yellow)',
            red: 'var(--vscode-charts-red)',
          }
        }
      }
    },
  },
  plugins: [],
}
