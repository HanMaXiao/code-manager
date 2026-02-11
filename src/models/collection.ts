/**
 * 集合数据模型接口
 */
export interface Collection {
  /** 集合唯一标识符 */
  id: string;
  /** 集合名称 */
  name: string;
  /** 集合颜色 */
  color: string;
  /** 集合图标 */
  icon: string;
  /** 包含的文件ID列表 */
  fileIds: string[];
  /** 创建时间 */
  createTime: Date;
}

/**
 * 集合创建参数接口
 */
export interface CreateCollectionParams {
  /** 集合名称 */
  name: string;
  /** 集合颜色 */
  color: string;
  /** 集合图标 */
  icon: string;
  /** 初始文件ID列表（可选） */
  fileIds?: string[];
}

/**
 * 集合更新参数接口
 */
export interface UpdateCollectionParams {
  /** 集合ID */
  id: string;
  /** 更新的字段 */
  updates: Partial<Omit<Collection, 'id' | 'createTime'>>;
}

/**
 * 文件添加到集合的参数接口
 */
export interface AddFileToCollectionParams {
  /** 集合ID */
  collectionId: string;
  /** 文件路径 */
  filePath: string;
}