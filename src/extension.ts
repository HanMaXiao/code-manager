import * as vscode from 'vscode';
import { BookmarkService } from './services/bookmark-service';
import { CollectionService } from './services/collection-service';
import { StorageService } from './services/storage-service';
import { NavigationService } from './services/navigation-service';
import { SidebarPanel } from './panels/sidebar-panel';

export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log('代码管理者插件已激活');

    // 初始化服务
    const storageService = new StorageService(context);
    const navigationService = new NavigationService();
    const bookmarkService = new BookmarkService(storageService, navigationService);
    const collectionService = new CollectionService(storageService);

    // 初始化侧边栏面板
    const sidebarPanel = new SidebarPanel(
      context.extensionUri,
      bookmarkService,
      collectionService,
      navigationService
    );

    // 初始化数据
    await bookmarkService.initialize();
    await collectionService.initialize();

    // 注册命令
    const disposables = [
      vscode.commands.registerCommand('codeManager.addBookmark', async () => {
        await sidebarPanel.showBookmarkDialog();
      }),

      vscode.commands.registerCommand('codeManager.toggleBookmarkPanel', () => {
        sidebarPanel.toggleBookmarkPanel();
      }),

      vscode.commands.registerCommand('codeManager.addToCollection', async () => {
        await sidebarPanel.showCollectionDialog();
      }),

      vscode.commands.registerCommand('codeManager.toggleCollectionPanel', () => {
        sidebarPanel.toggleCollectionPanel();
      }),

      // 侧边栏视图提供商
      vscode.window.registerWebviewViewProvider(
        'bookmarkPanel',
        sidebarPanel.getBookmarkViewProvider()
      ),

      vscode.window.registerWebviewViewProvider(
        'collectionPanel',
        sidebarPanel.getCollectionViewProvider()
      )
    ];

    context.subscriptions.push(...disposables);

    console.log('[扩展] 书签视图提供商已注册');
    console.log('[扩展] 集合视图提供商已注册');

    console.log('代码管理者插件初始化完成');
  } catch (error) {
    console.error('代码管理者插件激活失败:', error);
    vscode.window.showErrorMessage('代码管理者插件启动失败，请重启VS Code');
  }
}

export function deactivate() {
  console.log('代码管理者插件已停用');
}