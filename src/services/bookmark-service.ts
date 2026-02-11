import * as vscode from 'vscode';
import { Bookmark, CreateBookmarkParams, UpdateBookmarkParams } from '../models/bookmark';
import { StorageService } from './storage-service';
import { NavigationService } from './navigation-service';

/**
 * 书签服务类
 * 负责书签的业务逻辑处理
 */
export class BookmarkService {
  private storageService: StorageService;
  private navigationService: NavigationService;
  private bookmarks: Bookmark[] = [];

  constructor(storageService: StorageService, navigationService: NavigationService) {
    this.storageService = storageService;
    this.navigationService = navigationService;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    this.bookmarks = await this.storageService.getAllBookmarks();
    console.log(`已加载 ${this.bookmarks.length} 个书签`);
  }

  /**
   * 创建新书签
   */
  public async createBookmark(params: CreateBookmarkParams): Promise<Bookmark> {
    // 检查同一位置是否已有书签
    const existingBookmark = this.bookmarks.find(
      b => b.filePath === params.filePath && b.lineNumber === params.lineNumber
    );

    if (existingBookmark) {
      throw new Error('当前位置已存在书签');
    }

    const newBookmark: Bookmark = {
      id: this.generateId(),
      ...params,
      createTime: new Date()
    };

    this.bookmarks.push(newBookmark);
    await this.saveBookmarks();
    
    vscode.window.showInformationMessage(`书签"${params.text}"创建成功`);
    return newBookmark;
  }

  /**
   * 更新书签
   */
  public async updateBookmark(params: UpdateBookmarkParams): Promise<Bookmark | null> {
    const index = this.bookmarks.findIndex(b => b.id === params.id);
    if (index === -1) {
      return null;
    }

    const updatedBookmark = {
      ...this.bookmarks[index],
      ...params.updates
    };

    this.bookmarks[index] = updatedBookmark;
    await this.saveBookmarks();
    
    vscode.window.showInformationMessage('书签更新成功');
    return updatedBookmark;
  }

  /**
   * 删除书签
   */
  public async deleteBookmark(id: string): Promise<boolean> {
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index === -1) {
      return false;
    }

    const deletedBookmark = this.bookmarks.splice(index, 1)[0];
    await this.saveBookmarks();
    
    vscode.window.showInformationMessage(`书签"${deletedBookmark.text}"已删除`);
    return true;
  }

  /**
   * 获取所有书签
   */
  public getAllBookmarks(): Bookmark[] {
    return [...this.bookmarks];
  }

  /**
   * 根据ID获取书签
   */
  public getBookmarkById(id: string): Bookmark | undefined {
    return this.bookmarks.find(b => b.id === id);
  }

  /**
   * 获取指定文件的所有书签
   */
  public getBookmarksByFile(filePath: string): Bookmark[] {
    return this.bookmarks.filter(b => b.filePath === filePath);
  }

  /**
   * 获取指定集合的所有书签
   */
  public getBookmarksByCollection(collectionId: string): Bookmark[] {
    return this.bookmarks.filter(b => b.collectionId === collectionId);
  }

  /**
   * 跳转到书签位置
   */
  public async navigateToBookmark(id: string): Promise<boolean> {
    const bookmark = this.getBookmarkById(id);
    if (!bookmark) {
      vscode.window.showErrorMessage('未找到指定书签');
      return false;
    }

    // 验证文件是否存在
    const fileExists = await this.navigationService.validateFileExists(bookmark.filePath);
    if (!fileExists) {
      vscode.window.showErrorMessage(`文件不存在: ${bookmark.filePath}`);
      return false;
    }

    return await this.navigationService.navigateToFilePosition(
      bookmark.filePath,
      bookmark.lineNumber
    );
  }

  /**
   * 搜索书签
   */
  public searchBookmarks(query: string): Bookmark[] {
    const lowerQuery = query.toLowerCase();
    return this.bookmarks.filter(bookmark =>
      bookmark.text.toLowerCase().includes(lowerQuery) ||
      bookmark.filePath.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 保存书签到存储
   */
  private async saveBookmarks(): Promise<void> {
    await this.storageService.saveBookmarks(this.bookmarks);
  }

  /**
   * 刷新书签数据
   */
  public async refresh(): Promise<void> {
    this.bookmarks = await this.storageService.getAllBookmarks();
  }
}