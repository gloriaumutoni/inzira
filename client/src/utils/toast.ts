const show = (message: string, type: 'success' | 'error' | 'info') => {
  const el = document.createElement('div')
  el.textContent = message
  el.style.cssText = [
    'position:fixed;bottom:24px;right:24px;z-index:9999;',
    'padding:10px 16px;border-radius:8px;font-size:14px;font-weight:500;',
    'color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s;',
    `background:${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};`,
  ].join('')
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 300)
  }, 3000)
}

export const toast = {
  success: (message: string) => show(message, 'success'),
  error: (message: string) => show(message, 'error'),
  info: (message: string) => show(message, 'info'),
}
