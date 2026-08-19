import type { Product } from "../components/ProductCard/ProductTypes";


export const productMock: Product = {

  id: 1,

  slug: "bosch-cordless-drill",

  title:
    "دریل شارژی حرفه‌ای Bosch مدل Advanced با باتری لیتیومی",

  images: [
    {
      id: 1,
      url: "https://picsum.photos/600/600?random=1",
      alt: "Bosch Drill"
    },
    {
      id: 2,
      url: "https://picsum.photos/600/600?random=2",
      alt: "Bosch Drill Side"
    },
    {
      id: 3,
      url: "https://picsum.photos/600/600?random=3",
      alt: "Bosch Drill Detail"
    },
  ],


  price: 250,


  discountPrice: 199,


  badges: [
    {
      type:"discount",
      value:"-20%"
    },
    {
      type:"hot",
      value:"HOT"
    }
  ],


  rating:4.8,


  reviewsCount:128,


  stock:12,


  brand:"Bosch",


  description:
    "دریل شارژی قدرتمند مناسب کارگاه و استفاده حرفه‌ای با موتور براشلس و عمر باتری بالا.",


  specifications:[
    {
      label:"توان",
      value:"18V"
    },
    {
      label:"باتری",
      value:"Lithium"
    },
    {
      label:"وزن",
      value:"1.5kg"
    }
  ]

};