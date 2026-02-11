// 简单的手动测试脚本
import { BookmarkService } from './services/bookmark-service';
import { CollectionService } from './services/collection-service';
import { StorageService } from './services/storage-service';
import { ColorUtils } from './utils/color-utils';
import { IconUtils } from './utils/icon-utils';

// 模拟VS Code上下文
class MockContext {
  globalState = {
    _data: new Map<string, any>(),
    
    get(key: string, defaultValue: any) {
      return this._data.has(key) ? this._data.get(key) : defaultValue;
    },
    
    async update(key: string, value: any) {
      this._data.set(key, value);
      return Promise.resolve();
    }
  };
}

async function runManualTests() {
  console.log('🚀 开始手动测试...\n');

  // 创建模拟上下文和服务
  const mockContext = new MockContext() as any;
  const storageService = new StorageService(mockContext);
  const bookmarkService = new BookmarkService(storageService, {} as any);
  const collectionService = new CollectionService(storageService);

  try {
    // 测试1: 颜色工具
    console.log('🎨 测试颜色工具:');
    console.log('- 预设颜色数量:', ColorUtils.PRESET_COLORS.length);
    console.log('- 随机颜色示例:', ColorUtils.getRandomColor());
    console.log('- 颜色验证 #FF0000:', ColorUtils.isValidColor('#FF0000'));
    console.log('- 颜色验证 invalid:', ColorUtils.isValidColor('invalid'));
    console.log();

    // 测试2: 图标工具
    console.log('🖼️ 测试图标工具:');
    console.log('- 预设图标数量:', IconUtils.PRESET_ICONS.length);
    console.log('- 随机图标示例:', IconUtils.getRandomIcon());
    console.log('- 书签图标符号:', IconUtils.getIconSymbol('bookmark'));
    console.log();

    // 测试3: 书签服务
    console.log('🔖 测试书签服务:');
    await bookmarkService.initialize();
    
    const bookmark1 = await bookmarkService.createBookmark({
      filePath: '/test/project/main.ts',
      lineNumber: 25,
      startLine: 20,
      endLine: 30,
      text: '主函数入口',
      color: ColorUtils.getRandomColor(),
      icon: IconUtils.getRandomIcon()
    });
    console.log('- 创建书签成功:', bookmark1.text);

    const bookmark2 = await bookmarkService.createBookmark({
      filePath: '/test/project/utils.ts',
      lineNumber: 10,
      startLine: 8,
      endLine: 15,
      text: '工具函数',
      color: ColorUtils.getRandomColor(),
      icon: IconUtils.getRandomIcon()
    });
    console.log('- 创建书签成功:', bookmark2.text);

    console.log('- 当前总书签数:', bookmarkService.getAllBookmarks().length);
    console.log('- main.ts文件书签数:', bookmarkService.getBookmarksByFile('/test/project/main.ts').length);
    console.log();

    // 测试4: 集合服务
    console.log('📁 测试集合服务:');
    await collectionService.initialize();
    
    const collection1 = await collectionService.createCollection({
      name: '核心功能',
      color: ColorUtils.getRandomColor(),
      icon: IconUtils.getRandomIcon()
    });
    console.log('- 创建集合成功:', collection1.name);

    const collection2 = await collectionService.createCollection({
      name: '工具函数',
      color: ColorUtils.getRandomColor(),
      icon: IconUtils.getRandomIcon()
    });
    console.log('- 创建集合成功:', collection2.name);

    await collectionService.addFileToCollection({
      collectionId: collection1.id,
      filePath: '/test/project/main.ts'
    });
    console.log('- 添加文件到集合成功');

    console.log('- 当前总集合数:', collectionService.getAllCollections().length);
    console.log('- 包含main.ts的集合数:', collectionService.getCollectionsContainingFile('/test/project/main.ts').length);
    console.log();

    // 测试5: 数据持久化
    console.log('💾 测试数据持久化:');
    const savedBookmarks = await storageService.getAllBookmarks();
    const savedCollections = await storageService.getAllCollections();
    console.log('- 持久化的书签数:', savedBookmarks.length);
    console.log('- 持久化的集合数:', savedCollections.length);
    console.log();

    console.log('✅ 所有手动测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
runManualTests();