import img1 from "./images/0301.png";
import img2 from "./images/0302.png";
import img6 from "./images/0303.png";
import img4 from "./images/0304.png";
import img5 from "./images/0305.png";
import img3 from "./images/0306.png";
import img7 from "./images/0307.png";
import { AnimatedPhotoProps } from "@/components/AnimatedPhoto/types";

export const STREET_ITEMS: AnimatedPhotoProps[] = [
  {
    src: img1,
    wrapperClassName: "w-full [grid-column:1/span_2] md:[grid-column:1/span_1] [&>p]:pl-2 [&>p]:pb-1",
    mobileObjectFit: "cover",
    label: '( \\~/ )',
  },
  {
    src: img2,
    row: 3,
    delay: 1.6,
    mobileObjectFit: "cover",
    label: '( /~\\ )',
    wrapperClassName:
      "w-full [grid-column:2/span_2] md:[grid-column:3/span_1] [&>p]:pl-2 [&>p]:pb-1",
  },
  {
    src: img3,
    label: "( -.-.. )",
    column: 2,
    row: 2,
    mobileObjectFit: "cover",
    delay: 0.8,
    wrapperClassName: "[&>p]:pl-2 [&>p]:pb-1",
  },
  {
    src: img4,
    label: "( .__-. )",
    column: 1,
    row: 2,
    mobileObjectFit: "cover",
    delay: 0.4,
    wrapperClassName: "[&>p]:pl-2 [&>p]:pb-1",
  },
  {
    src: img5,
    label: "( .... )",
    mobileObjectFit: "cover",
    delay: 0.4,
    wrapperClassName: "[&>p]:pl-2 [&>p]:pb-1",
  },
  {
    src: img6,
    label: "( .-__. )",
    mobileObjectFit: "cover",
    column: 3,
    row: 2,
    delay: 1.2,
    wrapperClassName: "[&>p]:pl-2 [&>p]:pb-1",
  },
  {
    src: img7,
    label: "( ____ )",
    row: 3,
    mobileObjectFit: "cover",
    delay: 1.2,
    wrapperClassName:
      "[&>p]:pl-2 [&>p]:pb-1 [grid-column:1] md:[grid-column:2]",
  },
];
