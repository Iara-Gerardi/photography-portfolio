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

export const ITEMS: AnimatedPhotoProps[] = [
  { src: img1, label: "( 01 )", delay: 0.2 },
  { src: img10, label: "( 10 )", delay: 2.4 },
  { src: img2, label: "( 02 )", delay: 0.8 },
  { src: img3, label: "( 03 )", delay: 1.6 },
  { src: img5, label: "( 05 )", delay: 2.8 },
  { src: img6, label: "( 06 )", delay: 0.4 },
  { src: img7, label: "( 07 )", delay: 2 },
  { src: img11, label: "( 11 )", delay: 1.2 },
  { src: img4, label: "( 04 )", scale: 1.2, columnSpan: 2, delay: 3.2 },
  { src: img8, label: "( 08 )", scale: 1.2, columnSpan: 2, delay: 3.2 },
];