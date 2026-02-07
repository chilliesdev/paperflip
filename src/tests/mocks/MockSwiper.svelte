<script>
  import { onMount, createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let modules = undefined;
  export let direction = undefined;
  export let slidesPerView = undefined;
  export let spaceBetween = undefined;
  export let mousewheel = undefined;

  // Handle class prop
  let className = '';
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
    dispatch('swiper', [swiperInstance]);
  });

  function handleTestSlideChange(e) {
    // Update mock instance
    swiperInstance.realIndex = e.detail.index;
    // Dispatch component event
    dispatch('slideChange', [swiperInstance]);
  }
</script>

<!-- Add a listener for testing -->
<div
  data-testid="swiper-mock"
  class={className}
  on:test-slide-change={handleTestSlideChange}
>
  <slot />
</div>
