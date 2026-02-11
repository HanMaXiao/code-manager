/**
 * 图标处理工具类
 */
export class IconUtils {
  /**
   * 预定义的图标选项
   */
  public static readonly PRESET_ICONS = [
    'bookmark',
    'star',
    'heart',
    'tag',
    'flag',
    'pin',
    'bell',
    'lightbulb',
    'target',
    'rocket',
    'shield',
    'key',
    'lock',
    'unlock',
    'eye',
    'eye-closed',
    'home',
    'repo',
    'file',
    'folder'
  ];

  /**
   * VS Code内置图标映射
   */
  private static readonly ICON_MAP: Record<string, string> = {
    'bookmark': '$(bookmark)',
    'star': '$(star)',
    'heart': '$(heart)',
    'tag': '$(tag)',
    'flag': '$(flag)',
    'pin': '$(pin)',
    'bell': '$(bell)',
    'lightbulb': '$(light-bulb)',
    'target': '$(target)',
    'rocket': '$(rocket)',
    'shield': '$(shield)',
    'key': '$(key)',
    'lock': '$(lock)',
    'unlock': '$(unlock)',
    'eye': '$(eye)',
    'eye-closed': '$(eye-closed)',
    'home': '$(home)',
    'repo': '$(repo)',
    'file': '$(file)',
    'folder': '$(folder)'
  };

  /**
   * 获取随机图标
   */
  public static getRandomIcon(): string {
    return this.PRESET_ICONS[Math.floor(Math.random() * this.PRESET_ICONS.length)];
  }

  /**
   * 获取图标的VS Code表示形式
   */
  public static getIconSymbol(iconName: string): string {
    return this.ICON_MAP[iconName] || '$(bookmark)';
  }

  /**
   * 验证图标名称是否有效
   */
  public static isValidIcon(iconName: string): boolean {
    return this.PRESET_ICONS.includes(iconName);
  }

  /**
   * 获取所有可用图标
   */
  public static getAllIcons(): string[] {
    return [...this.PRESET_ICONS];
  }

  /**
   * 根据类别推荐图标
   */
  public static getRecommendedIcons(category: 'important' | 'todo' | 'note' | 'bug' | 'feature'): string[] {
    const recommendations: Record<string, string[]> = {
      'important': ['star', 'flag', 'target'],
      'todo': ['checklist', 'tasklist', 'lightbulb'],
      'note': ['bookmark', 'tag', 'pin'],
      'bug': ['bug', 'error', 'warning'],
      'feature': ['rocket', 'lightbulb', 'star']
    };
    
    return recommendations[category] || this.PRESET_ICONS.slice(0, 5);
  }
}