import * as vscode from 'vscode';
import { Bookmark } from '../models/bookmark';

/**
 * 书签装饰器服务
 * 负责在编辑器中显示书签代码框装饰
 */
export class BookmarkDecorationService {
  private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

  /**
   * 为书签创建装饰器
   */
  public createDecoration(bookmark: Bookmark): vscode.TextEditorDecorationType {
    // 如果已存在该书签的装饰器，先清理
    this.removeDecoration(bookmark.id);

    // 根据书签颜色创建装饰器
    const decorationType = vscode.window.createTextEditorDecorationType({
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: bookmark.color,
      backgroundColor: this.adjustOpacity(bookmark.color, 0.1),
      overviewRulerColor: bookmark.color,
      overviewRulerLane: vscode.OverviewRulerLane.Full,
    });

    this.decorationTypes.set(bookmark.id, decorationType);
    return decorationType;
  }

  /**
   * 移除书签装饰器
   */
  public removeDecoration(bookmarkId: string): void {
    const decorationType = this.decorationTypes.get(bookmarkId);
    if (decorationType) {
      decorationType.dispose();
      this.decorationTypes.delete(bookmarkId);
    }
  }

  /**
   * 获取书签的装饰器
   */
  public getDecoration(bookmarkId: string): vscode.TextEditorDecorationType | undefined {
    return this.decorationTypes.get(bookmarkId);
  }

  /**
   * 获取书签的装饰选项
   */
  public getDecorationOptions(bookmark: Bookmark, editor: vscode.TextEditor): vscode.DecorationOptions {
    const startLine = Math.max(0, bookmark.startLine - 1);
    const endLine = Math.max(0, bookmark.endLine - 1);

    // 获取文档来计算正确的范围
    let range: vscode.Range;

    if (editor.document.uri.fsPath === bookmark.filePath) {
      // 如果是当前文档，使用实际行范围
      const lastLine = Math.min(endLine, editor.document.lineCount - 1);
      const lastLineObj = editor.document.lineAt(lastLine);
      range = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(lastLine, lastLineObj.text.length)
      );
    } else {
      // 如果不是当前文档，使用估计范围
      range = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, 1000)
      );
    }

    return {
      range,
      hoverMessage: `🔖 **${bookmark.text}**`
    };
  }

  /**
   * 获取书签标签装饰选项（用于显示书签文本）
   */
  public getLabelDecorationOptions(bookmark: Bookmark): vscode.DecorationOptions {
    const startLine = Math.max(0, bookmark.startLine - 1);

    const range = new vscode.Range(
      new vscode.Position(startLine, 0),
      new vscode.Position(startLine, 0)
    );

    return {
      range,
      renderOptions: {
        before: {
          contentText: ` ${bookmark.text} `,
          backgroundColor: bookmark.color,
          color: this.getContrastColor(bookmark.color),
          margin: '0 0 0 0',
          textDecoration: `0 0 1px 0 ${bookmark.color}; font-size: 11px;`
        }
      }
    };
  }

  /**
   * 清理所有装饰器
   */
  public dispose(): void {
    this.decorationTypes.forEach(type => type.dispose());
    this.decorationTypes.clear();
  }

  /**
   * 根据背景色计算对比色（黑/白）
   */
  private getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  /**
   * 调整颜色透明度
   */
  private adjustOpacity(hexColor: string, opacity: number): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
