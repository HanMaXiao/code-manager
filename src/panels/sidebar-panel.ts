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
    // 预先获取当前编辑器信息
    const editorInfo = this._navigationService.getCurrentEditorInfo();
    if (!editorInfo) {
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
   * 刷新侧边栏数据
   */
  public async refreshData(): Promise<void> {
    // 重新加载数据
    await this._bookmarkService.refresh();
    await this._collectionService.refresh();
    
    // 通知webview更新
    // 这里可以通过postMessage通知webview更新显示
    console.log('侧边栏数据已刷新');
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

        // 加载初始数据并渲染面板
        this.renderBookmarkPanel(webviewView.webview);
        
        // 监听数据变化
        const refreshHandler = setInterval(async () => {
          await this._bookmarkService.refresh();
          this.renderBookmarkPanel(webviewView.webview);
        }, 5000); // 每5秒检查一次更新
        
        webviewView.onDidDispose(() => {
          clearInterval(refreshHandler);
        });
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

        // 加载初始数据并渲染面板
        this.renderCollectionPanel(webviewView.webview);
        
        // 监听数据变化
        const refreshHandler = setInterval(async () => {
          await this._collectionService.refresh();
          this.renderCollectionPanel(webviewView.webview);
        }, 5000); // 每5秒检查一次更新
        
        webviewView.onDidDispose(() => {
          clearInterval(refreshHandler);
        });
      }
    };
  }

  /**
   * 渲染书签面板
   */
  private async renderBookmarkPanel(webview: vscode.Webview): Promise<void> {
    const bookmarks = this._bookmarkService.getAllBookmarks();
    
    let content = '';
    if (bookmarks.length === 0) {
      content = `
        <div class="empty-state">
          <p>暂无书签</p>
          <p>在代码编辑器中右键选择"添加书签"来创建书签</p>
        </div>
      `;
    } else {
      content = bookmarks.map(bookmark => `
        <div class="bookmark-item" onclick="navigateToBookmark('${bookmark.id}')">
          <div class="bookmark-text">${bookmark.text}</div>
          <div class="bookmark-path">${bookmark.filePath}</div>
        </div>
      `).join('');
    }

    webview.html = `
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
            border-left: 3px solid ${bookmarks.length > 0 ? '#4ECDC4' : 'transparent'};
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
          <h3 class="panel-title">书签管理 (${bookmarks.length})</h3>
        </div>
        <div id="bookmarks-container">
          ${content}
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          
          function navigateToBookmark(id) {
            vscode.postMessage({
              command: 'navigateToBookmark',
              bookmarkId: id
            });
          }
          
          // 监听来自扩展的消息
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'refresh') {
              // 可以在这里处理刷新请求
              location.reload();
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  /**
   * 渲染集合面板
   */
  private async renderCollectionPanel(webview: vscode.Webview): Promise<void> {
    const collections = this._collectionService.getAllCollections();
    
    let content = '';
    if (collections.length === 0) {
      content = `
        <div class="empty-state">
          <p>暂无集合</p>
          <p>在文件资源管理器中右键选择"添加到集合"来创建集合</p>
        </div>
      `;
    } else {
      content = collections.map(collection => `
        <div class="collection-item">
          <div class="collection-name">${collection.name}</div>
          <div class="collection-count">${collection.fileIds.length} 个文件</div>
        </div>
      `).join('');
    }

    webview.html = `
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
            border-left: 3px solid ${collections.length > 0 ? '#45B7D1' : 'transparent'};
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
          <h3 class="panel-title">集合管理 (${collections.length})</h3>
        </div>
        <div id="collections-container">
          ${content}
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          console.log('集合面板已加载，共 ${collections.length} 个集合');
        </script>
      </body>
      </html>
    `;
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