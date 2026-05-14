import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export interface QwenMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface QwenResponse {
  model: string;
  created_at: string;
  message: QwenMessage;
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  eval_count: number;
  eval_duration: number;
}

export class QwenAPIClient {
  private apiClient: AxiosInstance;
  private apiUrl: string;
  private model: string;
  private conversationHistory: QwenMessage[] = [];

  constructor(apiUrl: string, model: string) {
    this.apiUrl = apiUrl;
    this.model = model;
    this.apiClient = axios.create({
      baseURL: apiUrl,
      timeout: 120000, // 2 minutes timeout
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async generateCompletion(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    try {
      const messages: QwenMessage[] = [];

      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      messages.push(...this.conversationHistory);
      messages.push({
        role: 'user',
        content: prompt,
      });

      const response = await this.apiClient.post('/api/chat', {
        model: this.model,
        messages: messages,
        stream: false,
        options: {
          temperature: this.getTemperature(),
          num_predict: this.getMaxTokens(),
        },
      });

      const assistantMessage = response.data.message.content;
      this.conversationHistory.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: assistantMessage }
      );

      // Keep conversation history to reasonable size
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return assistantMessage;
    } catch (error) {
      throw new Error(
        `Failed to generate completion: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async generateCode(prompt: string): Promise<string> {
    const systemPrompt = `You are an expert code generator. Generate only clean, working code without explanations or markdown formatting. 
Do not include code fences or language identifiers.
Generate code that is production-ready and follows best practices.`;

    const response = await this.generateCompletion(prompt, systemPrompt);
    return this.extractCode(response);
  }

  async explainCode(code: string): Promise<string> {
    const systemPrompt = `You are an expert code explainer. Explain the given code clearly and concisely.
Break down the logic step by step.
Mention any important functions or libraries used.
Explain the purpose and expected output.`;

    const prompt = `Explain this code:\n\n${code}`;
    return this.generateCompletion(prompt, systemPrompt);
  }

  async refactorCode(code: string, improvements?: string): Promise<string> {
    const systemPrompt = `You are an expert code refactorer. Improve the given code.
Focus on: readability, performance, maintainability, and best practices.
${improvements ? `Also focus on: ${improvements}` : ''}
Return only the refactored code without explanations.
Do not include code fences or language identifiers.`;

    const prompt = `Refactor this code:\n\n${code}`;
    const response = await this.generateCompletion(prompt, systemPrompt);
    return this.extractCode(response);
  }

  async generateDocumentation(code: string, language?: string): Promise<string> {
    const systemPrompt = `You are an expert technical writer. Generate comprehensive documentation for the given code.
Include: function/class descriptions, parameters, return values, usage examples, and edge cases.
${language ? `The code is written in ${language}.` : ''}
Format as clear markdown.`;

    const prompt = `Generate documentation for this code:\n\n${code}`;
    return this.generateCompletion(prompt, systemPrompt);
  }

  async detectBugs(code: string, language?: string): Promise<string> {
    const systemPrompt = `You are an expert code reviewer and security analyst.
Analyze the given code for:
1. Logic errors and bugs
2. Security vulnerabilities
3. Performance issues
4. Memory leaks
5. Edge cases not handled
${language ? `The code is written in ${language}.` : ''}
List each issue with severity level (Critical, High, Medium, Low) and suggested fixes.`;

    const prompt = `Analyze this code for bugs and issues:\n\n${code}`;
    return this.generateCompletion(prompt, systemPrompt);
  }

  async chat(message: string): Promise<string> {
    return this.generateCompletion(message);
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private extractCode(response: string): string {
    // Try to extract code from markdown code blocks
    const codeBlockRegex = /```(?:\w+)?\n?([\s\S]*?)\n?```/;
    const match = response.match(codeBlockRegex);

    if (match) {
      return match[1].trim();
    }

    // If no code blocks, return the response as is
    return response.trim();
  }

  private getMaxTokens(): number {
    const config = vscode.workspace.getConfiguration('opencode');
    return config.get<number>('maxTokens') || 2048;
  }

  private getTemperature(): number {
    const config = vscode.workspace.getConfiguration('opencode');
    return config.get<number>('temperature') || 0.7;
  }
}
