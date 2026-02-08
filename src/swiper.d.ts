/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SwiperContainer, SwiperSlide } from "swiper/element";

declare global {
  namespace svelteHTML {
    interface IntrinsicElements {
      "swiper-container": any;
      "swiper-slide": any;
    }
  }
}

declare module "swiper" {
  const Swiper: any;
  const Mousewheel: any;
  const Navigation: any;
  const Pagination: any;
  export { Swiper, Mousewheel, Navigation, Pagination };
  export default Swiper;
}

declare module "swiper/element/bundle" {
  export function register(): void;
}
