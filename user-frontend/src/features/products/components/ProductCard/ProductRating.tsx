import { FaStar } from "react-icons/fa";


interface ProductRatingProps {

  rating:number;

  reviewsCount:number;

}



export function ProductRating({

rating,

reviewsCount,

}:ProductRatingProps){


return (

<div
className="
flex
items-center
gap-2
text-sm
"
>


<div
className="
flex
items-center
gap-1
text-warning
"
>

<FaStar />

<span>
{rating.toFixed(1)}
</span>


</div>



<span
className="
text-muted
"
>

({reviewsCount})

</span>



</div>

)

}