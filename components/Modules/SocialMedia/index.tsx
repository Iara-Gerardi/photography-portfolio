import React from "react";
import { motion } from "framer-motion";
import { Jacquard_24 } from "next/font/google";
import GLTFViewer from "@/components/GLTFViewer";
import { DecryptionText } from "@/components/DecryptionText/DecryptionText";

const jacquard24 = Jacquard_24({
  weight: "400",
  subsets: ["latin"],
});

function SocialMedia() {
  return (
    <motion.div
      key="bottom"
      className="relative w-full h-dvh flex flex-col items-center justify-center bg-black py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <GLTFViewer
          modelPath="/models/tower.glb"
          size={250}
          cameraDistance={2}
          rotationSpeed={0.0018}
        />
        <a
          href="https://www.instagram.com/ocrequemado"
          target="_blank"
          rel="noopener noreferrer"
        >
          <DecryptionText
            text="instagram"
            initialText="?????????"
            startEncrypted={true}
            speed={20}
            revealSpeed={0.3}
            className={`bold tracking-wider cursor-pointer text-2xl ${jacquard24.className}`}
          />
        </a>
      </div>
      <p
        className={`text-white h-16 w-full flex items-center justify-center bold text-3xl md:text-5xl ${jacquard24.className} relative top-24`}
      >
        ¨*+~.,_ _,.~+*¨*+~.,_ _,.~+*¨
      </p>
    </motion.div>
  );
}

export default SocialMedia;
