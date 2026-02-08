<script>
  import { onMount, createEventDispatcher, tick } from "svelte";
  const dispatch = createEventDispatcher();

  export let modules = undefined;
  export let direction = undefined;
  export let slidesPerView = undefined;
  export let spaceBetween = undefined;
  export let mousewheel = undefined;

  // Silence unused export warnings
  $: void modules;
  $: void direction;
  $: void slidesPerView;
  $: void spaceBetween;
  $: void mousewheel;

  // Handle class prop
  let className = "";
  export { className as class };

  /** @type {HTMLDivElement | undefined} */
  let container;

  /** @type {{ realIndex: number, activeIndex: number, slides: Element[], previousIndex: number | null, slideTo: Function, slideNext: Function, slidePrev: Function, on: Function, off: Function }} */
  const swiperInstance = {
    realIndex: 0,
    activeIndex: 0,
    slides: [],
    previousIndex: null,
    slideTo: () => {},
    slideNext: () => {},
    slidePrev: () => {},
    on: () => {},
    off: () => {},
  };

  onMount(async () => {
    // Wait for slot to render
    await tick();
    if (container) {
      // Find all mock slides
      const slides = container.querySelectorAll(
        '[data-testid="swiper-slide-mock"]',
      );
      swiperInstance.slides = Array.from(slides);
    }
    // Dispatch init event
    dispatch("swiper", [swiperInstance]);
  });

  /**
   * @param {any} e
   */
  function handleTestSlideChange(e) {
    // Update mock instance
    swiperInstance.previousIndex = swiperInstance.activeIndex;
    swiperInstance.realIndex = e.detail.index;
    swiperInstance.activeIndex = e.detail.index;
    // Dispatch component event
    dispatch("slideChange", [swiperInstance]);
  }

  /**
   * Action to handle custom test event since on:custom-event is not allowed on div by default in TS
   * @param {HTMLElement} node
   */
  function testSlideChangeAction(node) {
    /** @type {EventListener} */
    const handler = (e) => handleTestSlideChange(e);
    node.addEventListener("test-slide-change", handler);
    return {
      destroy() {
        node.removeEventListener("test-slide-change", handler);
      },
    };
  }
</script>

<!-- Add a listener for testing -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={container}
  data-testid="swiper-mock"
  class={className}
  use:testSlideChangeAction
  on:click
>
  <slot />
</div>
