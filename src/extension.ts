import * as vscode from 'vscode';
import { BookmarkService } from './services/bookmark-service';
import { CollectionService } from './services/collection-service';
import { StorageService } from './services/storage-service';
import { NavigationService } from './services/navigation-service';
import { SidebarPanel } from './panels/sidebar-panel';

export async function activate(context: vscode.ExtensionContext) {
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

  // 注册命令
  const disposables = [
    // 书签相关命令
    vscode.commands.registerCommand('codeManager.addBookmark', () => {
      sidebarPanel.showBookmarkDialog();
    }),

    vscode.commands.registerCommand('codeManager.toggleBookmarkPanel', () => {
      sidebarPanel.toggleBookmarkPanel();
    }),

    // 集合相关命令
    vscode.commands.registerCommand('codeManager.addToCollection', () => {
      sidebarPanel.showCollectionDialog();
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

  // 初始化数据
  await bookmarkService.initialize();
  await collectionService.initialize();

  console.log('代码管理者插件初始化完成');
}

export function deactivate() {
  console.log('代码管理者插件已停用');
}