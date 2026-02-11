/**
 * 颜色处理工具类
 */
export class ColorUtils {
  /**
   * 预定义的颜色选项
   */
  public static readonly PRESET_COLORS = [
    '#FF6B6B', // 红色
    '#4ECDC4', // 青色
    '#45B7D1', // 蓝色
    '#96CEB4', // 绿色
    '#FFEAA7', // 黄色
    '#DDA0DD', // 紫色
    '#98D8C8', // 薄荷绿
    '#F7DC6F', // 金色
    '#BB8FCE', // 淡紫色
    '#85C1E9'  // 浅蓝色
  ];

  /**
   * 生成随机颜色
   */
  public static getRandomColor(): string {
    return this.PRESET_COLORS[Math.floor(Math.random() * this.PRESET_COLORS.length)];
  }

  /**
   * 验证颜色格式是否有效
   */
  public static isValidColor(color: string): boolean {
    // 支持十六进制颜色 (#RRGGBB 或 #RGB)
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  /**
   * 将颜色转换为RGBA格式
   */
  public static hexToRgba(hex: string, alpha: number = 1): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * 计算颜色亮度
   */
  public static getColorBrightness(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  /**
   * 根据背景色选择合适的文字颜色
   */
  public static getContrastColor(backgroundColor: string): string {
    const brightness = this.getColorBrightness(backgroundColor);
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }
}