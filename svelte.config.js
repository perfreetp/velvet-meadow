export default {
  compilerOptions: {
    runes: true
  },
  onwarn(warning, handler) {
    // 工业内部工具：a11y 交互提示不阻断构建
    if (warning.code?.startsWith('a11y_')) return;
    handler?.(warning);
  }
};
