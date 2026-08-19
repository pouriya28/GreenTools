import useEmblaCarousel from "embla-carousel-react";

import type { ProductImage } from "./ProductTypes";

import {
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import { useCallback } from "react";


interface ProductPreviewCarouselProps {

  images: ProductImage[];

}



export function ProductPreviewCarousel({

  images,

}: ProductPreviewCarouselProps) {


  const [
    emblaRef,
    emblaApi

  ] = useEmblaCarousel({

    loop:true,

  });



  const scrollPrev = useCallback(()=>{

    emblaApi?.scrollPrev();

  },[emblaApi]);



  const scrollNext = useCallback(()=>{

    emblaApi?.scrollNext();

  },[emblaApi]);



  return (

    <div
      className="
        relative
        w-full
        h-[180px]
        overflow-hidden
        rounded-2xl
      "
    >


      <div
        ref={emblaRef}
        className="
          overflow-hidden
          h-full
        "
      >

        <div
          className="
            flex
            h-full
          "
        >

          {
            images.map((image)=>(

              <div
                key={image.id}
                className="
                  flex-[0_0_100%]
                  min-w-0
                  h-full
                  flex
                  items-center
                  justify-center
                "
              >

                <img

                  src={image.url}

                  alt={image.alt}

                  className="
                    w-full
                    h-full
                    object-contain
                    p-4
                  "

                />

              </div>

            ))
          }


        </div>

      </div>



      {/* Previous */}

      <button

        type="button"

        onClick={scrollPrev}

        className="
          absolute
          left-3
          top-1/2
          -translate-y-1/2

          w-8
          h-8

          rounded-full

          bg-black/40
          backdrop-blur-md

          text-white

          flex
          items-center
          justify-center

          hover:bg-black/60

        "

      >

        <FaChevronLeft size={12}/>

      </button>




      {/* Next */}

      <button

        type="button"

        onClick={scrollNext}

        className="
          absolute
          right-3
          top-1/2
          -translate-y-1/2

          w-8
          h-8

          rounded-full

          bg-black/40
          backdrop-blur-md

          text-white

          flex
          items-center
          justify-center

          hover:bg-black/60

        "

      >

        <FaChevronRight size={12}/>

      </button>


    </div>

  );
}