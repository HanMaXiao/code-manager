import * as vscode from 'vscode';
import { Collection, CreateCollectionParams, UpdateCollectionParams, AddFileToCollectionParams } from '../models/collection';
import { StorageService } from './storage-service';

/**
 * 集合服务类
 * 负责集合的业务逻辑处理
 */
export class CollectionService {
  private storageService: StorageService;
  private collections: Collection[] = [];

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    this.collections = await this.storageService.getAllCollections();
    console.log(`已加载 ${this.collections.length} 个集合`);
  }

  /**
   * 创建新集合
   */
  public async createCollection(params: CreateCollectionParams): Promise<Collection> {
    // 检查集合名称是否已存在
    const existingCollection = this.collections.find(c => c.name === params.name);
    if (existingCollection) {
      throw new Error('集合名称已存在');
    }

    const newCollection: Collection = {
      id: this.generateId(),
      ...params,
      fileIds: params.fileIds || [],
      createTime: new Date()
    };

    this.collections.push(newCollection);
    await this.saveCollections();
    
    vscode.window.showInformationMessage(`集合"${params.name}"创建成功`);
    return newCollection;
  }

  /**
   * 更新集合
   */
  public async updateCollection(params: UpdateCollectionParams): Promise<Collection | null> {
    const index = this.collections.findIndex(c => c.id === params.id);
    if (index === -1) {
      return null;
    }

    const updatedCollection = {
      ...this.collections[index],
      ...params.updates
    };

    this.collections[index] = updatedCollection;
    await this.saveCollections();
    
    vscode.window.showInformationMessage('集合更新成功');
    return updatedCollection;
  }

  /**
   * 删除集合
   */
  public async deleteCollection(id: string): Promise<boolean> {
    const index = this.collections.findIndex(c => c.id === id);
    if (index === -1) {
      return false;
    }

    const deletedCollection = this.collections.splice(index, 1)[0];
    await this.saveCollections();

    // 不显示信息，由调用方处理
    return true;
  }

  /**
   * 获取所有集合
   */
  public getAllCollections(): Collection[] {
    return [...this.collections];
  }

  /**
   * 根据ID获取集合
   */
  public getCollectionById(id: string): Collection | undefined {
    return this.collections.find(c => c.id === id);
  }

  /**
   * 根据名称获取集合
   */
  public getCollectionByName(name: string): Collection | undefined {
    return this.collections.find(c => c.name === name);
  }

  /**
   * 添加文件到集合
   */
  public async addFileToCollection(params: AddFileToCollectionParams): Promise<boolean> {
    const collection = this.getCollectionById(params.collectionId);
    if (!collection) {
      vscode.window.showErrorMessage('未找到指定集合');
      return false;
    }

    // 检查文件是否已在集合中
    if (collection.fileIds.includes(params.filePath)) {
      vscode.window.showWarningMessage('文件已在此集合中');
      return false;
    }

    collection.fileIds.push(params.filePath);
    await this.saveCollections();
    
    vscode.window.showInformationMessage('文件已添加到集合');
    return true;
  }

  /**
   * 从集合中移除文件
   */
  public async removeFileFromCollection(collectionId: string, filePath: string): Promise<boolean> {
    const collection = this.getCollectionById(collectionId);
    if (!collection) {
      return false;
    }

    const index = collection.fileIds.indexOf(filePath);
    if (index === -1) {
      return false;
    }

    collection.fileIds.splice(index, 1);
    await this.saveCollections();
    
    vscode.window.showInformationMessage('文件已从集合中移除');
    return true;
  }

  /**
   * 获取集合中的所有文件
   */
  public getFilesInCollection(collectionId: string): string[] {
    const collection = this.getCollectionById(collectionId);
    return collection ? [...collection.fileIds] : [];
  }

  /**
   * 搜索集合
   */
  public searchCollections(query: string): Collection[] {
    const lowerQuery = query.toLowerCase();
    return this.collections.filter(collection =>
      collection.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取包含指定文件的所有集合
   */
  public getCollectionsContainingFile(filePath: string): Collection[] {
    return this.collections.filter(collection =>
      collection.fileIds.includes(filePath)
    );
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 保存集合到存储
   */
  private async saveCollections(): Promise<void> {
    await this.storageService.saveCollections(this.collections);
  }

  /**
   * 刷新集合数据
   */
  public async refresh(): Promise<void> {
    this.collections = await this.storageService.getAllCollections();
  }
}