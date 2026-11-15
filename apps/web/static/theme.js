// Pre-paint theme restore; loaded blocking from app.html so light-dark()
// resolves before first paint. Keep dependency-free and tiny.
;(() => {
  try {
    const sessionMode = localStorage.getItem('session-mode')
    const theme = localStorage.getItem('theme')
    const chosen = sessionMode || theme || 'dark'
    document.documentElement.dataset.theme = chosen === 'light' ? 'light' : 'dark'
  } catch {
    document.documentElement.dataset.theme = 'dark'
  }
})()
