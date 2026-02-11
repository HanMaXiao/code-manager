import * as vscode from 'vscode';
import { Bookmark } from '../models/bookmark';
import { Collection } from '../models/collection';

/**
 * 存储服务类
 * 负责数据的持久化存储和检索
 */
export class StorageService {
  private context: vscode.ExtensionContext;
  private readonly BOOKMARKS_KEY = 'bookmarks';
  private readonly COLLECTIONS_KEY = 'collections';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * 获取所有书签
   */
  public async getAllBookmarks(): Promise<Bookmark[]> {
    const bookmarks = this.context.globalState.get<Bookmark[]>(this.BOOKMARKS_KEY, []);
    // 将日期字符串转换回Date对象，并迁移旧数据
    return bookmarks.map((bookmark: any) => {
      const migrated: any = {
        ...bookmark,
        createTime: new Date(bookmark.createTime)
      };
      // 迁移旧数据：为没有 startLine 和 endLine 的书签添加这些字段
      if (migrated.startLine === undefined) {
        migrated.startLine = bookmark.lineNumber;
      }
      if (migrated.endLine === undefined) {
        migrated.endLine = bookmark.lineNumber;
      }
      return migrated;
    });
  }

  /**
   * 保存书签列表
   */
  public async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
    const serializedBookmarks = bookmarks.map(bookmark => ({
      ...bookmark,
      createTime: bookmark.createTime.toISOString()
    }));
    await this.context.globalState.update(this.BOOKMARKS_KEY, serializedBookmarks);
  }

  /**
   * 获取所有集合
   */
  public async getAllCollections(): Promise<Collection[]> {
    const collections = this.context.globalState.get<Collection[]>(this.COLLECTIONS_KEY, []);
    // 将日期字符串转换回Date对象
    return collections.map(collection => ({
      ...collection,
      createTime: new Date(collection.createTime)
    }));
  }

  /**
   * 保存集合列表
   */
  public async saveCollections(collections: Collection[]): Promise<void> {
    const serializedCollections = collections.map(collection => ({
      ...collection,
      createTime: collection.createTime.toISOString()
    }));
    await this.context.globalState.update(this.COLLECTIONS_KEY, serializedCollections);
  }

  /**
   * 清除所有数据（用于测试或重置）
   */
  public async clearAllData(): Promise<void> {
    await this.context.globalState.update(this.BOOKMARKS_KEY, []);
    await this.context.globalState.update(this.COLLECTIONS_KEY, []);
  }

  /**
   * 获取指定文件的所有书签
   */
  public async getBookmarksByFile(filePath: string): Promise<Bookmark[]> {
    const allBookmarks = await this.getAllBookmarks();
    return allBookmarks.filter(bookmark => bookmark.filePath === filePath);
  }

  /**
   * 获取指定集合的所有书签
   */
  public async getBookmarksByCollection(collectionId: string): Promise<Bookmark[]> {
    const allBookmarks = await this.getAllBookmarks();
    return allBookmarks.filter(bookmark => bookmark.collectionId === collectionId);
  }

  /**
   * 数据迁移方法（用于版本升级）
   */
  public async migrateData(): Promise<void> {
    // 检查是否需要数据迁移
    const version = this.context.globalState.get<string>('dataVersion', '1.0.0');
    
    if (version === '1.0.0') {
      // 执行迁移逻辑
      console.log('执行数据迁移...');
      // 这里可以添加具体的迁移代码
      await this.context.globalState.update('dataVersion', '1.1.0');
    }
  }
}