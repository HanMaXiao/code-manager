import * as vscode from 'vscode';
import { BookmarkService } from '../services/bookmark-service';
import { CollectionService } from '../services/collection-service';
import { NavigationService } from '../services/navigation-service';
import { BookmarkDecorationService } from '../services/bookmark-decoration-service';

/**
 * 侧边栏面板管理类
 */
export class SidebarPanel {
  private readonly _extensionUri: vscode.Uri;
  private readonly _bookmarkService: BookmarkService;
  private readonly _collectionService: CollectionService;
  private readonly _navigationService: NavigationService;
  private readonly _decorationService: BookmarkDecorationService;
  public bookmarkTreeDataProvider: any;
  public collectionTreeDataProvider: any;
  private updateDecorationsCallback?: () => void;

  constructor(
    extensionUri: vscode.Uri,
    bookmarkService: BookmarkService,
    collectionService: CollectionService,
    navigationService: NavigationService,
    decorationService: BookmarkDecorationService
  ) {
    this._extensionUri = extensionUri;
    this._bookmarkService = bookmarkService;
    this._collectionService = collectionService;
    this._navigationService = navigationService;
    this._decorationService = decorationService;
  }

  /**
   * 设置装饰器更新回调
   */
  public setUpdateDecorationsCallback(callback: () => void): void {
    this.updateDecorationsCallback = callback;
  }

  /**
   * 显示创建书签对话框
   */
  public showBookmarkDialog(): void {
    // 预先获取当前编辑器信息
    const selectionInfo = this._navigationService.getCurrentSelectionInfo();
    if (!selectionInfo) {
      vscode.window.showErrorMessage('请先打开一个文件并在其中选择代码');
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'createBookmark',
      '创建书签',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // 获取对话框HTML内容
    const dialogPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'dialogs', 'bookmark-dialog.html');

    vscode.workspace.fs.readFile(dialogPath).then(content => {
      panel.webview.html = content.toString();

      // 处理来自webview的消息
      panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
          case 'createBookmark':
            try {
              const bookmark = await this._bookmarkService.createBookmark({
                filePath: selectionInfo.filePath,
                lineNumber: selectionInfo.lineNumber,
                startLine: selectionInfo.startLine,
                endLine: selectionInfo.endLine,
                text: message.data.text,
                color: message.data.color,
                icon: message.data.icon
              });

              // 为新书签创建装饰器
              this._decorationService.createDecoration(bookmark);

              panel.dispose();
              vscode.window.showInformationMessage('书签创建成功！');

              // 刷新书签面板
              await this.refreshBookmarkPanel();

              // 立即更新装饰器
              if (this.updateDecorationsCallback) {
                this.updateDecorationsCallback();
              }
            } catch (error) {
              vscode.window.showErrorMessage(`创建书签失败: ${error}`);
            }
            break;

          case 'cancel':
            panel.dispose();
            break;
        }
      });
    });
  }

  /**
   * 显示创建集合对话框
   */
  public showCreateCollectionDialog(selectedFiles?: string[]): void {
    const panel = vscode.window.createWebviewPanel(
      'createCollection',
      '创建集合',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // 获取对话框HTML内容
    const dialogPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'dialogs', 'collection-dialog.html');

    vscode.workspace.fs.readFile(dialogPath).then(content => {
      panel.webview.html = content.toString();

      // 发送初始数据到webview
      panel.webview.postMessage({
        command: 'initialize',
        files: selectedFiles || []
      });

      // 处理来自webview的消息
      panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
          case 'createCollection':
            try {
              await this._collectionService.createCollection({
                name: message.data.name,
                color: message.data.color,
                icon: message.data.icon,
                fileIds: message.data.files || []
              });

              panel.dispose();
              vscode.window.showInformationMessage('集合创建成功！');

              // 刷新集合面板
              await this.refreshCollectionPanel();
            } catch (error) {
              vscode.window.showErrorMessage(`创建集合失败: ${error}`);
            }
            break;

          case 'cancel':
            panel.dispose();
            break;
        }
      });
    });
  }

  /**
   * 显示添加到集合对话框
   */
  public showAddToCollectionDialog(selectedFiles?: string[]): void {
    const panel = vscode.window.createWebviewPanel(
      'addToCollection',
      '添加到集合',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // 获取对话框HTML内容
    const dialogPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'dialogs', 'add-to-collection-dialog.html');

    vscode.workspace.fs.readFile(dialogPath).then(content => {
      panel.webview.html = content.toString();

      // 获取所有集合
      const collections = this._collectionService.getAllCollections();

      // 发送初始数据到webview
      panel.webview.postMessage({
        command: 'initialize',
        files: selectedFiles || [],
        collections: collections.map(c => ({
          id: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon
        }))
      });

      // 处理来自webview的消息
      panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
          case 'addToCollection':
            try {
              const collectionId = message.data.collectionId;
              let files = message.data.files || [];

              // 确保 files 是数组
              if (!Array.isArray(files)) {
                files = [];
              }

              if (!collectionId) {
                vscode.window.showErrorMessage('请选择一个集合');
                return;
              }

              if (files.length === 0) {
                vscode.window.showErrorMessage('没有要添加的文件');
                return;
              }

              // 添加文件到集合
              for (const file of files) {
                await this._collectionService.addFileToCollection({
                  collectionId: collectionId,
                  filePath: file
                });
              }

              panel.dispose();
              vscode.window.showInformationMessage(`已将 ${files.length} 个文件添加到集合！`);

              // 刷新集合面板
              await this.refreshCollectionPanel();
            } catch (error) {
              vscode.window.showErrorMessage(`添加到集合失败: ${error}`);
            }
            break;

          case 'cancel':
            panel.dispose();
            break;
        }
      });
    });
  }

  /**
   * 切换书签面板显示状态
   */
  public toggleBookmarkPanel(): void {
    vscode.commands.executeCommand('workbench.view.extension.codeManager');
  }

  /**
   * 切换集合面板显示状态
   */
  public toggleCollectionPanel(): void {
    vscode.commands.executeCommand('workbench.view.extension.codeManager');
  }

  /**
   * 刷新书签面板（使用 TreeView）
   */
  public async refreshBookmarkPanel(): Promise<void> {
    if (this.bookmarkTreeDataProvider) {
      await this._bookmarkService.refresh();
      this.bookmarkTreeDataProvider._onDidChangeTreeData.fire();
      console.log('[书签面板] TreeView 刷新完成');
    } else {
      console.warn('[书签面板] TreeView 未就绪');
    }
  }

  /**
   * 刷新集合面板（使用 TreeView）
   */
  public async refreshCollectionPanel(): Promise<void> {
    if (this.collectionTreeDataProvider) {
      await this._collectionService.refresh();
      this.collectionTreeDataProvider._onDidChangeTreeData.fire();
      console.log('[集合面板] TreeView 刷新完成');
    } else {
      console.warn('[集合面板] TreeView 未就绪');
    }
  }
}
