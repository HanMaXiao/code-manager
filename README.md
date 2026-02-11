# 代码管理者 (Code Manager) - VS Code插件

[![Version](https://img.shields.io/visual-studio-marketplace/v/your-publisher-name.code-manager)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.code-manager)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/your-publisher-name.code-manager)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.code-manager)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/your-publisher-name.code-manager)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.code-manager)
[![License](https://img.shields.io/github/license/your-username/code-manager)](LICENSE)

一个强大的VS Code插件，用于智能管理代码书签和集合，提升大型项目的代码导航和组织效率。

<p align="center">
  <img src="images/demo.gif" alt="插件演示" width="600"/>
</p>

## 功能特性

### 🔖 书签管理
- **智能书签**：在代码任意位置添加书签，支持自定义颜色、图标和描述文本
- **精准定位**：记录精确的文件路径和行号，一键跳转到书签位置
- **分类展示**：全局书签视图和当前文件书签视图
- **快速搜索**：通过文本快速查找相关书签

### 📁 集合管理
- **逻辑分组**：按功能模块将相关文件组织到集合中
- **快速访问**：一键查看集合内的所有文件
- **灵活管理**：支持集合的增删改查操作

### 🔗 联动功能
- **书签集合关联**：将相关书签归类到对应集合
- **模块化视图**：按集合查看功能模块的完整实现

## 快速开始

### 安装和运行

1. **克隆项目**
```bash
git clone <repository-url>
cd code-manager
```

2. **安装依赖**
```bash
npm install
```

3. **编译项目**
```bash
npm run compile
```

4. **运行插件**
   - 按 `F5` 启动调试模式
   - 或使用命令面板执行 `>Developer: Reload Window`

### 使用方法

#### 添加书签
1. 在代码编辑器中右键点击任意行
2. 选择"添加书签"选项
3. 在弹出的对话框中设置书签属性

#### 管理集合
1. 在文件资源管理器中右键点击文件
2. 选择"添加到集合"选项
3. 选择现有集合或创建新集合

#### 查看和管理
- 点击左侧活动栏的"代码管理者"图标
- 在侧边栏中查看和管理所有书签和集合

## 开发指南

### 项目结构
```
src/
├── extension.ts          # 插件入口点
├── models/               # 数据模型定义
├── services/             # 核心业务逻辑
├── panels/               # UI面板组件
└── utils/                # 工具函数
```

### 主要服务类

- **BookmarkService**: 书签业务逻辑处理
- **CollectionService**: 集合业务逻辑处理  
- **StorageService**: 数据持久化管理
- **NavigationService**: 代码导航和定位

### 构建和调试

```bash
# 开发模式（监听文件变化）
npm run watch

# 生产构建
npm run package

# 运行测试
npm run test-compile
```

## 技术栈

- **语言**: TypeScript
- **框架**: VS Code Extension API
- **构建工具**: Webpack
- **存储**: VS Code Memento API

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！