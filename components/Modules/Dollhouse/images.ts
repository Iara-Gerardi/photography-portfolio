import { AnimatedPhotoProps } from "@/components/AnimatedPhoto/types";
import img1 from "./photos/0801.jpg";
import img2 from "./photos/0802.jpg";
import img3 from "./photos/0803.jpg";
import img4 from "./photos/0804.jpg";
import img5 from "./photos/0805.jpg";
import img6 from "./photos/0806.jpg";
import img7 from "./photos/0807.jpg";
import img8 from "./photos/0808.jpg";
import img10 from "./photos/0810.jpg";
import img11 from "./photos/0811.jpg";

const smallImagesStyle =
  "[&>p]:absolute [&>p]:bottom-2/5 [&>p]:max-[500px]:left-1 [&>p]:left-1/4 [&>p]:md:left-3/7 flex items-center justify-center [&>p]:text-2xl [&>p]:text-white/60";
//𓇗
export const ITEMS: AnimatedPhotoProps[] = [
  {
    src: img1,
    label: "𓊈 ⚘ 𓊉",
    delay: 0.2,
    wrapperClassName: smallImagesStyle,
    mobileObjectFit: "cover",
  },
  {
    src: img10,
    label: "𓊈 ⚘ 𓊉",
    delay: 2.4,
    wrapperClassName: smallImagesStyle,
    mobileObjectFit: "cover",
  },
  {
    src: img2,
    label: "𓊈 ⚘ 𓊉",
    delay: 0.8,
    wrapperClassName: smallImagesStyle,
    mobileObjectFit: "cover",
  },
  {
    src: img3,
    label: "𓊈 ⚘ 𓊉",
    delay: 1.6,
    wrapperClassName: smallImagesStyle,
    mobileObjectFit: "cover",
  },
  {
    src: img5,
    label: "𓊈 ⚘ 𓊉",
    delay: 2.8,
    wrapperClassName: smallImagesStyle,
    mobileObjectFit: "cover",
  },
  {
    src: img6,
    label: "𓊈 ⚘ 𓊉",
    delay: 0.4,
    wrapperClassName: smallImagesStyle,
    mobileObjectFit: "cover",
  },
  {
    src: img7,
    label: "𓊈 ⚘ 𓊉",
    delay: 2,
    wrapperClassName: smallImagesStyle,
    mobileObjectFit: "cover",
  },
  {
    src: img11,
    label: "𓊈 ⚘ 𓊉",
    delay: 1.2,
    wrapperClassName: smallImagesStyle,
    mobileObjectFit: "cover",
  },
  {
    src: img8,
    scale: 1.2,
    delay: 3.2,
    mobileObjectFit: "cover",
    wrapperClassName: "w-full [grid-column:1/span_4] md:[grid-column:1/span_2]",
  },
  {
    src: img4,
    scale: 1.2,
    delay: 3.5,
    mobileObjectFit: "cover",
    wrapperClassName: "w-full [grid-column:1/span_4] md:[grid-column:3/span_2]",
  },
];
