import { useRef } from "react";


interface UseLongPressProps {

  onLongPress: () => void;

  onPressEnd?: () => void;

  delay?: number;

}


export function useLongPress({

  onLongPress,

  onPressEnd,

  delay = 450,

}: UseLongPressProps) {


  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);



  const start = () => {

    timer.current = setTimeout(() => {

      onLongPress();

    }, delay);

  };



  const clear = () => {

    if (timer.current) {

      clearTimeout(timer.current);

      timer.current = null;

    }

    onPressEnd?.();

  };



  return {

    onTouchStart: start,

    onTouchEnd: clear,

    onTouchCancel: clear,

  };

}