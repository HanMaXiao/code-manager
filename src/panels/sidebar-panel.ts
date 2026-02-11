import * as vscode from 'vscode';
import { BookmarkService } from '../services/bookmark-service';
import { CollectionService } from '../services/collection-service';
import { NavigationService } from '../services/navigation-service';

/**
 * 侧边栏面板管理类
 */
export class SidebarPanel {
  private readonly _extensionUri: vscode.Uri;
  private readonly _bookmarkService: BookmarkService;
  private readonly _collectionService: CollectionService;
  private readonly _navigationService: NavigationService;

  constructor(
    extensionUri: vscode.Uri,
    bookmarkService: BookmarkService,
    collectionService: CollectionService,
    navigationService: NavigationService
  ) {
    this._extensionUri = extensionUri;
    this._bookmarkService = bookmarkService;
    this._collectionService = collectionService;
    this._navigationService = navigationService;
  }

  /**
   * 显示创建书签对话框
   */
  public showBookmarkDialog(): void {
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
              const editorInfo = this._navigationService.getCurrentEditorInfo();
              if (!editorInfo) {
                vscode.window.showErrorMessage('请先打开一个文件');
                return;
              }
              
              await this._bookmarkService.createBookmark({
                filePath: editorInfo.filePath,
                lineNumber: editorInfo.lineNumber,
                text: message.data.text,
                color: message.data.color,
                icon: message.data.icon
              });
              
              panel.dispose();
              vscode.window.showInformationMessage('书签创建成功！');
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
  public showCollectionDialog(): void {
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
        files: [] // 可以传入选中的文件列表
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
   * 获取书签视图提供商
   */
  public getBookmarkViewProvider(): vscode.WebviewViewProvider {
    return {
      resolveWebviewView: (webviewView: vscode.WebviewView) => {
        webviewView.webview.options = {
          enableScripts: true,
          localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this.getBookmarkPanelHtml();
      }
    };
  }

  /**
   * 获取集合视图提供商
   */
  public getCollectionViewProvider(): vscode.WebviewViewProvider {
    return {
      resolveWebviewView: (webviewView: vscode.WebviewView) => {
        webviewView.webview.options = {
          enableScripts: true,
          localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this.getCollectionPanelHtml();
      }
    };
  }

  /**
   * 获取书签面板HTML
   */
  private getBookmarkPanelHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>书签管理</title>
        <style>
          body {
            padding: 10px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
          }
          .panel-header {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
          }
          .panel-title {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
          }
          .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 20px;
          }
          .bookmark-item {
            padding: 8px;
            margin: 4px 0;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.1s;
          }
          .bookmark-item:hover {
            background-color: var(--vscode-list-hoverBackground);
          }
          .bookmark-text {
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .bookmark-path {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="panel-header">
          <h3 class="panel-title">书签管理</h3>
        </div>
        <div class="empty-state">
          <p>暂无书签</p>
          <p>在代码编辑器中右键选择"添加书签"来创建书签</p>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          
          // 这里可以添加交互逻辑
          console.log('书签面板已加载');
        </script>
      </body>
      </html>
    `;
  }

  /**
   * 获取集合面板HTML
   */
  private getCollectionPanelHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>集合管理</title>
        <style>
          body {
            padding: 10px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
          }
          .panel-header {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
          }
          .panel-title {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
          }
          .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 20px;
          }
          .collection-item {
            padding: 8px;
            margin: 4px 0;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.1s;
          }
          .collection-item:hover {
            background-color: var(--vscode-list-hoverBackground);
          }
          .collection-name {
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .collection-count {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="panel-header">
          <h3 class="panel-title">集合管理</h3>
        </div>
        <div class="empty-state">
          <p>暂无集合</p>
          <p>在文件资源管理器中右键选择"添加到集合"来创建集合</p>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          
          // 这里可以添加交互逻辑
          console.log('集合面板已加载');
        </script>
      </body>
      </html>
    `;
  }
}