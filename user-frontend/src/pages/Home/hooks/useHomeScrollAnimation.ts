// src/pages/Home/hooks/useHomeScrollAnimation.ts
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

interface UseHomeScrollAnimationParams {
  heroRef: React.RefObject<HTMLElement>;
  shapesRef: React.RefObject<HTMLDivElement>;
  sectionRefs: React.RefObject<HTMLElement>[];
  onSectionChange: (index: number) => void;
}

export function useHomeScrollAnimation({
  heroRef,
  shapesRef,
  sectionRefs,
  onSectionChange,
}: UseHomeScrollAnimationParams) {
  
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    });
    
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        if (!heroRef.current || !shapesRef.current) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "+=100%", // اسکرول کوتاه‌تر = انیمیشن سریع‌تر
            pin: true,
            scrub: 0.5, // واکنش سریع‌تر به اسکرول موس
          },
        });

        const firstShapeInner = shapesRef.current.querySelector(".shape-0");

        // مرحله ۱: چرخش کل مثلث (کانتینر والد) به اندازه ۱۲۰ درجه
        tl.to(shapesRef.current, {
          rotation: -120, 
          duration: 1.5,
          ease: "power1.inOut",
        }, 0)
        // همزمان: چرخش معکوس کارت‌ها تا متن‌ها کج نشن و صاف بمونن
        .to(".shape-wrapper", {
          rotation: 120, 
          duration: 1.5,
          ease: "power1.inOut",
        }, 0)
        
        // مرحله ۲: زوم شدن کارت اول (که حالا اومده پایین) و محو شدن بقیه
        .to(firstShapeInner, {
          scale: 6, // بزرگ شدن برای تبدیل شدن به بک‌گراند سکشن بعدی
          opacity: 0.15,
          duration: 1.5,
          ease: "power2.inOut"
        }, 0.5) 
        .to(".shape-1, .shape-2", {
          opacity: 0,
          scale: 0.5,
          duration: 1
        }, 0.5); 
      });

      sectionRefs.forEach((ref, index) => {
        if (!ref.current) return;
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top 60%",
          end: "bottom 60%",
          onEnter: () => onSectionChange(index),
          onEnterBack: () => onSectionChange(index),
        });
      });
    });

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, [heroRef, shapesRef, sectionRefs, onSectionChange]);
}