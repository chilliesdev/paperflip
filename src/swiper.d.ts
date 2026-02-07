declare module "swiper" {
  const Swiper: any;
  const Mousewheel: any;
  const Navigation: any;
  const Pagination: any;
  export { Swiper, Mousewheel, Navigation, Pagination };
  export default Swiper;
}

declare module "swiper/svelte" {
  const Swiper: any;
  const SwiperSlide: any;
  export { Swiper, SwiperSlide };
}
