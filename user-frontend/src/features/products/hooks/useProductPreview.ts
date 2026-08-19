import { useRef, useState } from "react";


export function useProductPreview() {


  const [open,setOpen] = useState(false);


  const timer = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);



  const openWithDelay = (
    delay = 200
  ) => {


    timer.current = setTimeout(()=>{

      setOpen(true);

    },delay);


  };



  const openImmediately = () => {

    setOpen(true);

  };



  const close = () => {


    if(timer.current){

      clearTimeout(timer.current);

      timer.current=null;

    }


    setOpen(false);


  };



  return {

    open,

    openWithDelay,

    openImmediately,

    close,

  };

}