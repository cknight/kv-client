interface LocalConnectionRadioButtonProps {
  id: string;
}

export function LocalConnectionRadioButton(props: LocalConnectionRadioButtonProps) {
  function smoothScrollTo(y: number, duration: number, callback: () => void) {
    const start = globalThis.scrollY;
    const change = y - start;
    const startTime = performance.now();

    function animateScroll(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const amountScrolled = change * progress;
      globalThis.scrollTo(0, start + amountScrolled);

      if (elapsed < duration) {
        self.requestAnimationFrame(animateScroll);
      } else if (callback) {
        callback();
      }
    }

    self.requestAnimationFrame(animateScroll);
  }

  // Usage:

  function kvInstanceChosen() {
    (document.getElementById("connectionLocation")! as HTMLInputElement).value = props.id;
    //set focus to name field
    //    (document.getElementById("connectionName")! as HTMLInputElement).focus();
    smoothScrollTo(0, 250, function () {
      (document.getElementById("connectionName")! as HTMLInputElement).focus();
    });
  }

  return (
    <input
      type="radio"
      class="radio radio-primary bg-base-100"
      aria-label={"Radio button for " + props.id}
      name="localLocation"
      id={props.id}
      onClick={kvInstanceChosen}
    />
  );
}
