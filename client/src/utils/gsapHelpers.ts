import gsap from "gsap";

export const fadeIn = (element: string | HTMLElement, delay: number = 0) => {
  gsap.from(element, {
    opacity: 0,
    y: 20,
    duration: 0.8,
    delay,
    ease: "power3.out",
  });
};

export const staggerReveal = (elements: string | HTMLElement[], delay: number = 0) => {
  gsap.from(elements, {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.1,
    delay,
    ease: "expo.out",
  });
};

export const animateCounter = (element: HTMLElement, target: number, duration: number = 2) => {
  const obj = { value: 0 };
  gsap.to(obj, {
    value: target,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.innerText = Math.floor(obj.value).toLocaleString();
    },
  });
};

export const pulseGlow = (element: string | HTMLElement) => {
  gsap.to(element, {
    filter: "drop-shadow(0 0 15px rgba(99, 102, 241, 0.6))",
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
};

export const forgeBlockchainBlock = (element: string | HTMLElement) => {
  const tl = gsap.timeline();
  tl.from(element, {
    scale: 0.5,
    rotationX: -90,
    opacity: 0,
    duration: 1.2,
    ease: "back.out(1.7)",
  })
  .to(element, {
    boxShadow: "0 0 40px rgba(99, 102, 241, 0.4)",
    duration: 1,
    repeat: -1,
    yoyo: true,
  });
  return tl;
};
