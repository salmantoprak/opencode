import * as vscode from 'vscode';
import { QwenAPIClient } from './services/qwenClient';
import { ChatViewProvider } from './views/chatViewProvider';
import { SettingsViewProvider } from './views/settingsViewProvider';
import { CodeCommandHandler } from './handlers/codeCommandHandler';
import { TerminalManager } from './services/terminalManager';

let qwenClient: QwenAPIClient;
let codeHandler: CodeCommandHandler;
let terminalManager: TerminalManager;
let chatProvider: ChatViewProvider;
let settingsProvider: SettingsViewProvider;

export async function activate(context: vscode.ExtensionContext) {
  console.log('🚀 OpenCode extension is now active!');

  try {
    // Initialize services
    const config = vscode.workspace.getConfiguration('opencode');
    const apiUrl = config.get<string>('apiUrl') || 'http://localhost:1234';
    const model = config.get<string>('model') || 'qwen';

    qwenClient = new QwenAPIClient(apiUrl, model);
    terminalManager = new TerminalManager();
    codeHandler = new CodeCommandHandler(qwenClient, terminalManager);

    // Test connection
    const isConnected = await qwenClient.testConnection();
    if (isConnected) {
      vscode.window.showInformationMessage('✅ OpenCode: Connected to Qwen server!');
    } else {
      vscode.window.showWarningMessage(
        '⚠️ OpenCode: Could not connect to Qwen server at ' + apiUrl
      );
    }

    // Create and register view providers
    chatProvider = new ChatViewProvider(context.extensionUri, qwenClient);
    settingsProvider = new SettingsViewProvider(context.extensionUri);

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('opencode.chat', chatProvider, {
        webviewOptions: { retainContextWhenHidden: true },
      }),
      vscode.window.registerWebviewViewProvider('opencode.settings', settingsProvider, {
        webviewOptions: { retainContextWhenHidden: true },
      })
    );

    // Register commands
    registerCommands(context, codeHandler);

    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    statusBarItem.command = 'opencode.openChat';
    updateStatusBar(statusBarItem);
    context.subscriptions.push(statusBarItem);

    // Configuration change listener
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('opencode')) {
          const newConfig = vscode.workspace.getConfiguration('opencode');
          const newApiUrl = newConfig.get<string>('apiUrl') || 'http://localhost:1234';
          const newModel = newConfig.get<string>('model') || 'qwen';
          qwenClient = new QwenAPIClient(newApiUrl, newModel);
          codeHandler = new CodeCommandHandler(qwenClient, terminalManager);
          console.log('✅ Configuration updated');
        }
      })
    );

    console.log('✅ OpenCode activated successfully!');
  } catch (error) {
    console.error('❌ Error activating OpenCode:', error);
    vscode.window.showErrorMessage(
      'Failed to activate OpenCode: ' +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

function registerCommands(
  context: vscode.ExtensionContext,
  codeHandler: CodeCommandHandler
) {
  const commands = [
    {
      command: 'opencode.generateCode',
      handler: () => codeHandler.generateCode(),
    },
    {
      command: 'opencode.explainCode',
      handler: () => codeHandler.explainCode(),
    },
    {
      command: 'opencode.refactorCode',
      handler: () => codeHandler.refactorCode(),
    },
    {
      command: 'opencode.generateDocumentation',
      handler: () => codeHandler.generateDocumentation(),
    },
    {
      command: 'opencode.detectBugs',
      handler: () => codeHandler.detectBugs(),
    },
    {
      command: 'opencode.runCode',
      handler: () => codeHandler.runCode(),
    },
    {
      command: 'opencode.openChat',
      handler: () => {
        vscode.commands.executeCommand('opencode.chat.focus');
      },
    },
  ];

  commands.forEach((cmd) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd.command, cmd.handler)
    );
  });
}

function updateStatusBar(statusBarItem: vscode.StatusBarItem) {
  statusBarItem.text = '$(robot) OpenCode';
  statusBarItem.tooltip = 'Click to open OpenCode Chat (Ctrl+Shift+P → OpenCode)';
  statusBarItem.show();
}

export function deactivate() {
  console.log('👋 OpenCode extension deactivated');
}
