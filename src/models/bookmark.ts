/**
 * 书签数据模型接口
 */
export interface Bookmark {
  /** 书签唯一标识符 */
  id: string;
  /** 文件路径 */
  filePath: string;
  /** 行号 */
  lineNumber: number;
  /** 书签文本描述 */
  text: string;
  /** 书签颜色 */
  color: string;
  /** 书签图标 */
  icon: string;
  /** 创建时间 */
  createTime: Date;
  /** 关联的集合ID（可选） */
  collectionId?: string;
}

/**
 * 书签创建参数接口
 */
export interface CreateBookmarkParams {
  /** 文件路径 */
  filePath: string;
  /** 行号 */
  lineNumber: number;
  /** 书签文本 */
  text: string;
  /** 书签颜色 */
  color: string;
  /** 书签图标 */
  icon: string;
  /** 关联的集合ID（可选） */
  collectionId?: string;
}

/**
 * 书签更新参数接口
 */
export interface UpdateBookmarkParams {
  /** 书签ID */
  id: string;
  /** 更新的字段 */
  updates: Partial<Omit<Bookmark, 'id' | 'createTime'>>;
}