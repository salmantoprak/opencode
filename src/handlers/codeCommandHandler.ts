import * as vscode from 'vscode';
import { QwenAPIClient } from '../services/qwenClient';
import { TerminalManager } from '../services/terminalManager';

export class CodeCommandHandler {
  constructor(
    private qwenClient: QwenAPIClient,
    private terminalManager: TerminalManager
  ) {}

  async generateCode(): Promise<void> {
    const prompt = await vscode.window.showInputBox({
      placeHolder: 'Describe the code you want to generate...',
      prompt: 'What code do you want to generate?',
      validateInput: (value) => (value.length === 0 ? 'Please enter a description' : ''),
    });

    if (!prompt) {
      return;
    }

    await this.showProgress('Generating code...', async () => {
      const code = await this.qwenClient.generateCode(prompt);
      await this.insertCodeAtCursor(code);
    });
  }

  async explainCode(): Promise<void> {
    const code = this.getSelectedCode();
    if (!code) {
      vscode.window.showErrorMessage('Please select code to explain');
      return;
    }

    await this.showProgress('Explaining code...', async () => {
      const explanation = await this.qwenClient.explainCode(code);
      await this.showInPanel('Code Explanation', explanation);
    });
  }

  async refactorCode(): Promise<void> {
    const code = this.getSelectedCode();
    if (!code) {
      vscode.window.showErrorMessage('Please select code to refactor');
      return;
    }

    const improvements = await vscode.window.showInputBox({
      placeHolder: 'e.g., performance, readability, security (optional)',
      prompt: 'What aspects to improve? (optional)',
    });

    await this.showProgress('Refactoring code...', async () => {
      const refactored = await this.qwenClient.refactorCode(code, improvements);
      await this.replaceSelectedCode(refactored);
    });
  }

  async generateDocumentation(): Promise<void> {
    const code = this.getSelectedCode();
    if (!code) {
      vscode.window.showErrorMessage('Please select code to document');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId;

    await this.showProgress('Generating documentation...', async () => {
      const docs = await this.qwenClient.generateDocumentation(code, language);
      await this.showInPanel('Generated Documentation', docs);
    });
  }

  async detectBugs(): Promise<void> {
    const code = this.getSelectedCode();
    if (!code) {
      vscode.window.showErrorMessage('Please select code to analyze');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId;

    await this.showProgress('Analyzing code for bugs...', async () => {
      const analysis = await this.qwenClient.detectBugs(code, language);
      await this.showInPanel('Bug Analysis', analysis);
    });
  }

  async runCode(): Promise<void> {
    const code = this.getSelectedCode();
    if (!code) {
      vscode.window.showErrorMessage('Please select code to run');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const language = editor.document.languageId;
    const languageMap: { [key: string]: string } = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      shellscript: 'bash',
      powershell: 'powershell',
      csharp: 'csharp',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rust',
      ruby: 'ruby',
      php: 'php',
    };

    const mappedLanguage = languageMap[language] || language;

    vscode.window.showInformationMessage(
      `Running ${mappedLanguage} code in terminal...`
    );

    try {
      await this.terminalManager.runCodeInCurrentTerminal(code, mappedLanguage);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to run code: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getSelectedCode(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return '';
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      // If no selection, get entire document
      return editor.document.getText();
    }

    return editor.document.getText(selection);
  }

  private async insertCodeAtCursor(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    await editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, '\n' + code + '\n');
    });

    // Format the document if possible
    try {
      await vscode.commands.executeCommand('editor.action.formatDocument');
    } catch {
      // Formatting not available for this language
    }
  }

  private async replaceSelectedCode(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    await editor.edit((editBuilder) => {
      const selection = editor.selection;
      if (selection.isEmpty) {
        editBuilder.insert(selection.active, code);
      } else {
        editBuilder.replace(selection, code);
      }
    });

    // Format the document
    try {
      await vscode.commands.executeCommand('editor.action.formatDocument');
    } catch {
      // Formatting not available
    }
  }

  private async showInPanel(title: string, content: string): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'opencode-output',
      title,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = this.getWebviewContent(title, content);
  }

  private getWebviewContent(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: #e0e0e0;
            background-color: #1e1e1e;
          }
          h1 {
            color: #4ec9b0;
            border-bottom: 2px solid #4ec9b0;
            padding-bottom: 10px;
          }
          pre {
            background-color: #252526;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 3px solid #4ec9b0;
          }
          code {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
          }
          .copy-button {
            background-color: #4ec9b0;
            color: #1e1e1e;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
          }
          .copy-button:hover {
            background-color: #5ed4b8;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div id="content"></div>
        <script>
          const content = ${JSON.stringify(content)};
          const contentDiv = document.getElementById('content');
          
          // Check if content looks like code or markdown
          if (content.includes('\\n') && !content.includes('\\t')) {
            contentDiv.innerHTML = '<pre><code>' + 
              content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
              '</code></pre>';
          } else {
            contentDiv.textContent = content;
          }
          
          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-button';
          copyBtn.textContent = 'Copy to Clipboard';
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(content).then(() => {
              copyBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyBtn.textContent = 'Copy to Clipboard';
              }, 2000);
            });
          };
          contentDiv.parentElement.insertBefore(copyBtn, contentDiv.nextSibling);
        </script>
      </body>
      </html>
    `;
  }

  private async showProgress<T>(
    message: string,
    task: () => Promise<T>
  ): Promise<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable: false,
      },
      task
    );
  }
}
