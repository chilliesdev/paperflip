<script>
  import { onMount, createEventDispatcher } from "svelte";
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

  // Mock Swiper instance
  const swiperInstance = {
    realIndex: 0,
    slideTo: () => {},
    slideNext: () => {},
    slidePrev: () => {},
    on: () => {},
    off: () => {},
  };

  onMount(() => {
    // Dispatch init event
    dispatch("swiper", [swiperInstance]);
  });

  /**
   * @param {any} e
   */
  function handleTestSlideChange(e) {
    // Update mock instance
    swiperInstance.realIndex = e.detail.index;
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
<div
  data-testid="swiper-mock"
  class={className}
  use:testSlideChangeAction
  on:click
>
  <slot />
</div>
