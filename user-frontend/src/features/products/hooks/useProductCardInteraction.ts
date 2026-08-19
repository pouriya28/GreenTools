import { useMediaQuery } from "./useMediaQuery";
import { useProductPreview } from "./useProductPreview";
import { useLongPress } from "./useLongPress";


export function useProductCardInteraction(){


const isMobile = useMediaQuery(
 "(max-width:768px)"
);


const preview = useProductPreview();



const longPress = useLongPress({

 onLongPress:
   preview.openImmediately,

 onPressEnd:
   preview.close,

});



return {

 isMobile,

 open:
   preview.open,

 openWithDelay:
   preview.openWithDelay,

 close:
   preview.close,

 longPress

};


}