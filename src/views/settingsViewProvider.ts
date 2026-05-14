import * as vscode from 'vscode';

export class SettingsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'opencode.settings';
  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    webviewView.webview.onDidReceiveMessage((data) => {
      this.handleMessage(data);
    });
  }

  private async handleMessage(data: any): Promise<void> {
    switch (data.type) {
      case 'open-settings':
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'opencode'
        );
        break;
    }
  }

  private getHtmlContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #1e1e1e;
            color: #e0e0e0;
            padding: 15px;
            font-size: 13px;
          }
          
          h2 {
            color: #4ec9b0;
            margin-bottom: 15px;
            font-size: 16px;
          }
          
          .setting-group {
            background-color: #252526;
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 12px;
            border-left: 3px solid #4ec9b0;
          }
          
          .setting-label {
            font-weight: bold;
            color: #ce9178;
            margin-bottom: 5px;
          }
          
          .setting-value {
            color: #9cdcfe;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            word-break: break-all;
          }
          
          .setting-description {
            color: #858585;
            font-size: 12px;
            margin-top: 5px;
          }
          
          .btn {
            display: block;
            width: 100%;
            padding: 10px;
            background-color: #4ec9b0;
            color: #1e1e1e;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 15px;
            font-size: 13px;
            transition: background-color 0.2s;
          }
          
          .btn:hover {
            background-color: #5ed4b8;
          }
          
          .shortcuts {
            background-color: #252526;
            padding: 12px;
            border-radius: 5px;
            margin-top: 15px;
          }
          
          .shortcut {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #3e3e42;
          }
          
          .shortcut:last-child {
            border-bottom: none;
          }
          
          .shortcut-key {
            background-color: #1e1e1e;
            padding: 4px 8px;
            border-radius: 3px;
            color: #4ec9b0;
            font-family: 'Monaco', monospace;
            font-size: 11px;
            font-weight: bold;
          }
          
          .status {
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
            text-align: center;
          }
          
          .status.connected {
            background-color: #1e4620;
            color: #89d185;
            border: 1px solid #4caf50;
          }
          
          .status.error {
            background-color: #5f2c2c;
            color: #f48771;
            border: 1px solid #d4534f;
          }
        </style>
      </head>
      <body>
        <h2>⚙️ Settings</h2>
        
        <div class="setting-group">
          <div class="setting-label">📡 API URL</div>
          <div class="setting-value">http://localhost:1234</div>
          <div class="setting-description">
            URL where your Qwen LLM server is running
          </div>
        </div>
        
        <div class="setting-group">
          <div class="setting-label">🤖 Model</div>
          <div class="setting-value">qwen</div>
          <div class="setting-description">
            The model name to use for requests
          </div>
        </div>
        
        <div class="setting-group">
          <div class="setting-label">📊 Max Tokens</div>
          <div class="setting-value">2048</div>
          <div class="setting-description">
            Maximum tokens for API responses
          </div>
        </div>
        
        <div class="setting-group">
          <div class="setting-label">🌡️ Temperature</div>
          <div class="setting-value">0.7</div>
          <div class="setting-description">
            Controls randomness (0-2). Lower = more focused
          </div>
        </div>
        
        <button class="btn" id="settingsBtn">Open Settings</button>
        
        <div class="shortcuts">
          <h3 style="color: #4ec9b0; margin-bottom: 10px;">⌨️ Keyboard Shortcuts</h3>
          
          <div class="shortcut">
            <span>Generate Code</span>
            <span class="shortcut-key">Ctrl+Shift+G</span>
          </div>
          
          <div class="shortcut">
            <span>Explain Code</span>
            <span class="shortcut-key">Ctrl+Shift+E</span>
          </div>
          
          <div class="shortcut">
            <span>Refactor Code</span>
            <span class="shortcut-key">Ctrl+Shift+R</span>
          </div>
          
          <div class="shortcut">
            <span>Run Code</span>
            <span class="shortcut-key">Ctrl+Shift+X</span>
          </div>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          document.getElementById('settingsBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'open-settings' });
          });
        </script>
      </body>
      </html>
    `;
  }
}
