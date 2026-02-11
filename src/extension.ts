import * as vscode from 'vscode';
import { BookmarkService } from './services/bookmark-service';
import { CollectionService } from './services/collection-service';
import { StorageService } from './services/storage-service';
import { NavigationService } from './services/navigation-service';
import { BookmarkDecorationService } from './services/bookmark-decoration-service';
import { SidebarPanel } from './panels/sidebar-panel';

export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log('代码管理者插件已激活');

    // 初始化服务
    const storageService = new StorageService(context);
    const navigationService = new NavigationService();
    const bookmarkService = new BookmarkService(storageService, navigationService);
    const collectionService = new CollectionService(storageService);
    const decorationService = new BookmarkDecorationService();

    // 初始化侧边栏面板
    const sidebarPanel = new SidebarPanel(
      context.extensionUri,
      bookmarkService,
      collectionService,
      navigationService,
      decorationService
    );

    // 初始化数据
    await bookmarkService.initialize();
    await collectionService.initialize();

    // 为所有现有书签创建装饰器
    const bookmarks = bookmarkService.getAllBookmarks();
    bookmarks.forEach(bookmark => {
      decorationService.createDecoration(bookmark);
    });

    // 创建标签装饰器类型（用于显示书签文本）
    const labelDecorationType = vscode.window.createTextEditorDecorationType({});

    // 更新装饰器
    function updateDecorations() {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const bookmarks = bookmarkService.getAllBookmarks();
      const filePath = editor.document.uri.fsPath;

      // 获取当前文件的书签
      const currentFileBookmarks = bookmarks.filter(b => b.filePath === filePath);

      // 为每个书签应用装饰器
      currentFileBookmarks.forEach(bookmark => {
        const decorationType = decorationService.getDecoration(bookmark.id);
        if (decorationType) {
          const options = [decorationService.getDecorationOptions(bookmark, editor)];
          editor.setDecorations(decorationType, options);
        }
      });

      // 应用标签装饰器（在代码块顶部显示书签文本）
      const labelOptions = currentFileBookmarks.map(bookmark =>
        decorationService.getLabelDecorationOptions(bookmark)
      );
      editor.setDecorations(labelDecorationType, labelOptions);
    }

    // 设置 SidebarPanel 的装饰器更新方法
    sidebarPanel.setUpdateDecorationsCallback(updateDecorations);

    // 监听编辑器变化
    vscode.window.onDidChangeActiveTextEditor(() => {
      updateDecorations();
    });

    // 监听文档内容变化
    vscode.workspace.onDidChangeTextDocument(() => {
      updateDecorations();
    });

    // 初始更新装饰器
    updateDecorations();

    // 注册命令
    context.subscriptions.push(
      vscode.commands.registerCommand('codeManager.addBookmark', async () => {
        await sidebarPanel.showBookmarkDialog();
      }),

      vscode.commands.registerCommand('codeManager.toggleBookmarkPanel', () => {
        sidebarPanel.toggleBookmarkPanel();
      }),

      vscode.commands.registerCommand('codeManager.createCollection', async (selectedFiles?: string[]) => {
        // 如果没有传入文件，尝试从资源管理器获取选中的文件
        if (!selectedFiles) {
          selectedFiles = getSelectedFilesFromExplorer();
        }
        await sidebarPanel.showCreateCollectionDialog(selectedFiles);
      }),

      vscode.commands.registerCommand('codeManager.addToCollection', async (selectedFiles?: string[]) => {
        // 如果没有传入文件，尝试从资源管理器获取选中的文件
        if (!selectedFiles) {
          selectedFiles = getSelectedFilesFromExplorer();
        }

        // 如果没有获取到文件，提示用户
        if (selectedFiles.length === 0) {
          vscode.window.showErrorMessage('没有可添加的文件');
          return;
        }

        // 检查是否有集合存在
        const collections = collectionService.getAllCollections();
        if (collections.length === 0) {
          // 没有集合，提示创建集合
          const createChoice = await vscode.window.showInformationMessage(
            '当前没有集合，请先创建一个集合',
            '创建集合',
            '取消'
          );
          if (createChoice === '创建集合') {
            await sidebarPanel.showCreateCollectionDialog(selectedFiles);
          }
          return;
        }

        await sidebarPanel.showAddToCollectionDialog(selectedFiles);
      }),

      vscode.commands.registerCommand('codeManager.toggleCollectionPanel', () => {
        sidebarPanel.toggleCollectionPanel();
      })
    );

    // 从资源管理器获取选中的文件
    function getSelectedFilesFromExplorer(): string[] {
      const selectedFiles: string[] = [];

      // 尝试从编辑器上下文获取
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        selectedFiles.push(editor.document.uri.fsPath);
      }

      return selectedFiles;
    }

    // 使用 TreeView 替代 WebviewViewProvider
    // 书签 TreeView
    const bookmarkTreeDataProvider: any = {
      _onDidChangeTreeData: new vscode.EventEmitter(),
      onDidChangeTreeData: null as any,
      getTreeItem: (element: any) => {
        const treeItem = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        treeItem.tooltip = `${element.text}\n${element.filePath}`;
        treeItem.iconPath = new vscode.ThemeIcon('bookmark');
        treeItem.command = {
          command: 'codeManager.openBookmark',
          title: '打开书签',
          arguments: [element]
        };
        return treeItem;
      },
      getChildren: async (element: any) => {
        if (!element) {
          // 根节点 - 返回所有书签
          await bookmarkService.refresh();
          const bookmarks = bookmarkService.getAllBookmarks();
          return bookmarks.map(b => ({
            id: b.id,
            label: b.text || '无文本',
            text: b.text,
            filePath: b.filePath,
            lineNumber: b.lineNumber,
            startLine: b.startLine,
            endLine: b.endLine,
            color: b.color,
            icon: b.icon
          }));
        }
        return [];
      },
      refresh: function() {
        this._onDidChangeTreeData.fire();
      }
    };
    bookmarkTreeDataProvider.onDidChangeTreeData = bookmarkTreeDataProvider._onDidChangeTreeData.event;
    const bookmarkTreeView = vscode.window.createTreeView('bookmarkPanel', {
      treeDataProvider: bookmarkTreeDataProvider
    });

    // 集合 TreeView
    const collectionTreeDataProvider: any = {
      _onDidChangeTreeData: new vscode.EventEmitter(),
      onDidChangeTreeData: null as any,
      getTreeItem: (element: any) => {
        if (element.isCollection) {
          const treeItem = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.Collapsed);
          treeItem.tooltip = `${element.name} (${element.fileIds.length} 个文件)`;
          treeItem.iconPath = new vscode.ThemeIcon('folder');
          return treeItem;
        } else if (element.isFile) {
          const treeItem = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
          treeItem.tooltip = element.filePath;
          treeItem.iconPath = new vscode.ThemeIcon('file');
          treeItem.contextValue = element.filePath;
          treeItem.command = {
            command: 'codeManager.openFile',
            title: '打开文件',
            arguments: [element.filePath]
          };
          return treeItem;
        }
        // 默认情况（不应该到达这里）
        return new vscode.TreeItem(element.label || element.name, vscode.TreeItemCollapsibleState.None);
      },
      getChildren: async (element: any) => {
        if (!element) {
          // 根节点 - 返回所有集合
          await collectionService.refresh();
          const collections = collectionService.getAllCollections();
          return collections.map(c => ({
            id: c.id,
            name: c.name,
            color: c.color,
            icon: c.icon,
            fileIds: c.fileIds,
            isCollection: true
          }));
        }
        // 子节点 - 返回集合中的文件
        if (element.fileIds && element.fileIds.length > 0) {
          return element.fileIds.map((filePath: string) => {
            const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
            return {
              id: `${element.id}-${filePath}`,
              label: fileName,
              filePath: filePath,
              isFile: true,
              parentCollection: element.name
            };
          });
        }
        return [];
      },
      refresh: function() {
        this._onDidChangeTreeData.fire();
      }
    };
    collectionTreeDataProvider.onDidChangeTreeData = collectionTreeDataProvider._onDidChangeTreeData.event;
    const collectionTreeView = vscode.window.createTreeView('collectionPanel', {
      treeDataProvider: collectionTreeDataProvider
    });

    // 注册打开书签命令
    const openBookmarkCommand = vscode.commands.registerCommand('codeManager.openBookmark', async (bookmark) => {
      const uri = vscode.Uri.file(bookmark.filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        // 使用 startLine 跳转到代码块第一行，如果不存在则使用 lineNumber
        const targetLine = bookmark.startLine || bookmark.lineNumber;
        const position = new vscode.Position(Math.max(0, targetLine - 1), 0);

        // 选中整个代码块
        const endLine = bookmark.endLine || targetLine;
        const endPosition = new vscode.Position(Math.max(0, endLine - 1), 0);
        const endLineText = editor.document.lineAt(Math.max(0, endLine - 1));
        const fullEndPosition = new vscode.Position(Math.max(0, endLine - 1), endLineText.text.length);

        editor.selection = new vscode.Selection(position, fullEndPosition);

        // 跳转到代码块顶部
        editor.revealRange(
          new vscode.Range(position, endPosition),
          vscode.TextEditorRevealType.InCenter
        );
      }
    });
    context.subscriptions.push(openBookmarkCommand);

    // 注册打开文件命令
    const openFileCommand = vscode.commands.registerCommand('codeManager.openFile', async (filePath: string) => {
      const uri = vscode.Uri.file(filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    });
    context.subscriptions.push(openFileCommand);

    // 注册删除书签命令
    const deleteBookmarkCommand = vscode.commands.registerCommand('codeManager.deleteBookmark', async (bookmark: any) => {
      if (bookmark) {
        const confirmed = await vscode.window.showWarningMessage(
          `确定要删除书签"${bookmark.text || bookmark.label}"吗？`,
          { modal: true },
          '删除',
          '取消'
        );
        if (confirmed === '删除') {
          // 移除书签装饰器
          decorationService.removeDecoration(bookmark.id);

          await bookmarkService.deleteBookmark(bookmark.id);
          // 刷新 TreeView
          bookmarkTreeDataProvider._onDidChangeTreeData.fire();
          // 更新装饰器显示
          updateDecorations();
          vscode.window.showInformationMessage('书签已删除');
        }
      }
    });
    context.subscriptions.push(deleteBookmarkCommand);

    // 注册删除集合命令
    const deleteCollectionCommand = vscode.commands.registerCommand('codeManager.deleteCollection', async (collection: any) => {
      if (collection) {
        const confirmed = await vscode.window.showWarningMessage(
          `确定要删除集合"${collection.name}"吗？`,
          { modal: true },
          '删除',
          '取消'
        );
        if (confirmed === '删除') {
          await collectionService.deleteCollection(collection.id);
          // 刷新 TreeView
          collectionTreeDataProvider._onDidChangeTreeData.fire();
          vscode.window.showInformationMessage('集合已删除');
        }
      }
    });
    context.subscriptions.push(deleteCollectionCommand);

    // 注册 TreeView 以便稍后刷新
    context.subscriptions.push(bookmarkTreeView);
    context.subscriptions.push(collectionTreeView);
    context.subscriptions.push(bookmarkTreeDataProvider._onDidChangeTreeData);
    context.subscriptions.push(collectionTreeDataProvider._onDidChangeTreeData);

    // 保存引用以便刷新
    (sidebarPanel as any).bookmarkTreeDataProvider = bookmarkTreeDataProvider;
    (sidebarPanel as any).collectionTreeDataProvider = collectionTreeDataProvider;

    console.log('代码管理者插件初始化完成');
  } catch (error) {
    console.error('代码管理者插件激活失败:', error);
    vscode.window.showErrorMessage('代码管理者插件启动失败，请重启VS Code');
  }
}

export function deactivate() {
  console.log('代码管理者插件已停用');
}