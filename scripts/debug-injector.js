(() => {
  const url = new URL(window.location.href);
  if (url.searchParams.get('debug') !== 'true') {
    url.searchParams.set('debug', 'true');
    window.location.href = url.href;
  }
})();
