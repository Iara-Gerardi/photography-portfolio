import img1 from "./images/0301.png";
import img2 from "./images/0302.png";
import img6 from "./images/0303.png";
import img4 from "./images/0304.png";
import img5 from "./images/0305.png";
import img3 from "./images/0306.png";
import img7 from "./images/0307.png";
import { AnimatedPhotoProps } from "@/components/AnimatedPhoto/types";

export const STREET_ITEMS: AnimatedPhotoProps[] = [
  { src: img1, label: "( 01 )" },
  {
    src: img2,
    label: "( 02 )",
    column: 3,
    row: 3,
    delay: 1.6,
  },
  { src: img3, label: "( 03 )", column: 2, row: 2, delay: 0.8 },
  { src: img4, label: "( 04 )", column: 1, row: 2, delay: 0.4 },
  { src: img5, label: "( 05 )", delay: 0.4 },
  { src: img6, label: "( 06 )", column: 3, row: 2, delay: 1.2 },
  { src: img7, label: "( 07 )", column: 2, row: 3, delay: 1.2 },
];