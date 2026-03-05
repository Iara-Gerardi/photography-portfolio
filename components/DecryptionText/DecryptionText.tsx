"use client";
import React, { useEffect, useState, useRef } from "react";
import { Jacquard_24 } from "next/font/google";

const jacquard24 = Jacquard_24({
  weight: "400",
  subsets: ["latin"],
});

interface DecryptionTextProps {
  text: string;
  speed?: number;
  revealSpeed?: number;
  className?: string;
  parentClassName?: string;
  animateOnMount?: boolean;
  initialText?: string;
  startEncrypted?: boolean;
}

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+~`|}{[]:;?><,./-=";

export const DecryptionText: React.FC<DecryptionTextProps> = ({
  text,
  speed = 30,
  revealSpeed = 0.5,
  className = "",
  parentClassName = "",
  animateOnMount = true,
  initialText = text,
  startEncrypted = false,
}) => {
  const [displayText, setDisplayText] = useState(
    startEncrypted ? initialText : text,
  );
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scramble = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let iteration = 0;
    setIsScrambling(true);

    intervalRef.current = setInterval(() => {
      setDisplayText((currentText) =>
        text
          .split("")
          .map((letter, index) => {
            if (letter === " ") return letter;
            if (index < iteration) {
              return text[index];
            }
            // Use initialText characters if startEncrypted, otherwise random characters
            if (startEncrypted) {
              return initialText[index % initialText.length];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join(""),
      );

      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsScrambling(false);
      }

      iteration += revealSpeed;
    }, speed);
  };

  const handleMouseLeave = () => {
    if (startEncrypted) {
      if (intervalRef.current) clearInterval(intervalRef.current);

      let iteration = text.length;
      setIsScrambling(true);

      intervalRef.current = setInterval(() => {
        setDisplayText(() =>
          text
            .split("")
            .map((letter, index) => {
              if (letter === " ") return letter;
              if (index >= iteration) {
                // Return to encrypted character
                return initialText[index % initialText.length];
              }
              return text[index];
            })
            .join(""),
        );

        if (iteration <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplayText(initialText);
          setIsScrambling(false);
        }

        iteration -= revealSpeed;
      }, speed);
    }
  };

  useEffect(() => {
    if (animateOnMount && !startEncrypted) {
      scramble();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <span
      className={`inline-block whitespace-nowrap cursor-pointer ${parentClassName}`}
      onMouseEnter={scramble}
      onMouseLeave={handleMouseLeave}
    >
      <span
        className={`${className} ${jacquard24.className} text-white lowercase tracking-wider text-4xl md:text-5xl no-underline hover:underline`}
      >
        {displayText}
      </span>
    </span>
  );
};
