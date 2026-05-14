import * as vscode from 'vscode';
import { QwenAPIClient } from './services/qwenClient';
import { ChatViewProvider } from './views/chatViewProvider';
import { SettingsViewProvider } from './views/settingsViewProvider';
import { CodeCommandHandler } from './handlers/codeCommandHandler';
import { TerminalManager } from './services/terminalManager';

let qwenClient: QwenAPIClient;
let codeHandler: CodeCommandHandler;
let terminalManager: TerminalManager;

export function activate(context: vscode.ExtensionContext) {
  console.log('OpenCode extension is now active!');

  // Initialize services
  const config = vscode.workspace.getConfiguration('opencode');
  const apiUrl = config.get<string>('apiUrl') || 'http://localhost:1234';
  const model = config.get<string>('model') || 'qwen';

  qwenClient = new QwenAPIClient(apiUrl, model);
  terminalManager = new TerminalManager();
  codeHandler = new CodeCommandHandler(qwenClient, terminalManager);

  // Register views
  const chatProvider = new ChatViewProvider(context.extensionUri, qwenClient);
  const settingsProvider = new SettingsViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('opencode.chat', chatProvider),
    vscode.window.registerWebviewViewProvider('opencode.settings', settingsProvider)
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
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('opencode')) {
      const newConfig = vscode.workspace.getConfiguration('opencode');
      const newApiUrl = newConfig.get<string>('apiUrl') || 'http://localhost:1234';
      const newModel = newConfig.get<string>('model') || 'qwen';
      qwenClient = new QwenAPIClient(newApiUrl, newModel);
      codeHandler = new CodeCommandHandler(qwenClient, terminalManager);
    }
  });
}

function registerCommands(
  context: vscode.ExtensionContext,
  codeHandler: CodeCommandHandler
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('opencode.generateCode', () =>
      codeHandler.generateCode()
    ),
    vscode.commands.registerCommand('opencode.explainCode', () =>
      codeHandler.explainCode()
    ),
    vscode.commands.registerCommand('opencode.refactorCode', () =>
      codeHandler.refactorCode()
    ),
    vscode.commands.registerCommand('opencode.generateDocumentation', () =>
      codeHandler.generateDocumentation()
    ),
    vscode.commands.registerCommand('opencode.detectBugs', () =>
      codeHandler.detectBugs()
    ),
    vscode.commands.registerCommand('opencode.runCode', () =>
      codeHandler.runCode()
    ),
    vscode.commands.registerCommand('opencode.openChat', () => {
      vscode.commands.executeCommand(
        'workbench.view.extension.opencode'
      );
    })
  );
}

function updateStatusBar(statusBarItem: vscode.StatusBarItem) {
  statusBarItem.text = '$(robot) OpenCode';
  statusBarItem.tooltip = 'Click to open OpenCode Chat';
  statusBarItem.show();
}

export function deactivate() {
  console.log('OpenCode extension deactivated');
}
