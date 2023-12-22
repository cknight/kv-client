export   function debounce(func: (event: Event) => void, delay: number) {
  let debounceTimer: number | undefined;
  return function(event: Event) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(event), delay);
  }
}
