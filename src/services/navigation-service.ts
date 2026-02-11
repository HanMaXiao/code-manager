import * as vscode from 'vscode';

/**
 * 导航服务类
 * 负责代码位置的跳转和定位
 */
export class NavigationService {
  /**
   * 跳转到指定的代码位置
   * @param filePath 文件路径
   * @param lineNumber 行号（从1开始）
   */
  public async navigateToFilePosition(filePath: string, lineNumber: number): Promise<boolean> {
    try {
      // 将相对路径转换为绝对路径
      const absolutePath = vscode.Uri.file(filePath);
      
      // 打开文档
      const document = await vscode.workspace.openTextDocument(absolutePath);
      const editor = await vscode.window.showTextDocument(document);
      
      // 跳转到指定行
      const position = new vscode.Position(Math.max(0, lineNumber - 1), 0);
      const range = new vscode.Range(position, position);
      
      // 选中该行并居中显示
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      
      return true;
    } catch (error) {
      console.error('导航到文件位置失败:', error);
      vscode.window.showErrorMessage(`无法跳转到文件: ${filePath}`);
      return false;
    }
  }

  /**
   * 获取当前活动编辑器的信息
   */
  public getCurrentEditorInfo(): { filePath: string; lineNumber: number } | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const filePath = editor.document.uri.fsPath;
    const lineNumber = editor.selection.active.line + 1; // 行号从1开始

    return { filePath, lineNumber };
  }

  /**
   * 验证文件是否存在且可访问
   */
  public async validateFileExists(filePath: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件的基本信息
   */
  public async getFileInfo(filePath: string): Promise<{ 
    exists: boolean; 
    fileName: string; 
    fileSize?: number 
  }> {
    try {
      const uri = vscode.Uri.file(filePath);
      const stat = await vscode.workspace.fs.stat(uri);
      
      return {
        exists: true,
        fileName: uri.path.split('/').pop() || uri.path.split('\\').pop() || '',
        fileSize: stat.size
      };
    } catch {
      return {
        exists: false,
        fileName: filePath.split('/').pop() || filePath.split('\\').pop() || ''
      };
    }
  }

  /**
   * 在当前行添加装饰器标记
   */
  public highlightCurrentLine(editor: vscode.TextEditor, lineNumber: number): void {
    const line = editor.document.lineAt(lineNumber - 1);
    const range = new vscode.Range(line.range.start, line.range.end);
    
    const decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.lineHighlightBackground'),
      isWholeLine: true
    });

    editor.setDecorations(decorationType, [range]);
    
    // 3秒后清除高亮
    setTimeout(() => {
      decorationType.dispose();
    }, 3000);
  }
}