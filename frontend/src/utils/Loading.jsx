import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Loading = ({ children, duration = 1000 }) => {
  const [isLoading, setIsLoading] = useState(true);

  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);

      setTimeout(() => setIsLoading(false), 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (isLoading) {
    return (
      <div
        className={`fixed top-0 left-0 w-full h-full bg-white/95 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-500 ease-in-out z-[9999] ${fadeOut ? "opacity-0 pointer-events-none" : ""
          }`}
      >
        {/* Logo Image */}

        <div className="bg-white rounded-2xl p-3 mb-5 shadow-lg">
          <img
            src="/Company_logo.png"
            alt="Company Logo"
            className="w-[100px] h-[100px] object-contain animate-fadeIn-float md:w-[80px] md:h-[80px] sm:w-[64px] sm:h-[64px]"
          />
        </div>

        {/* Modern Dotted Loader */}

        <div className="flex items-center justify-center my-5">
          <div className="w-3 h-3 bg-[#00f0b4] rounded-full mx-[5px] shadow-[0_0_8px_rgba(6,32,64,0.3)] animate-bounce-delay-1 md:w-2.5 md:h-2.5 md:mx-1 sm:w-2 sm:h-2 sm:mx-[3px]"></div>

          <div className="w-3 h-3 bg-[#062040] rounded-full mx-[5px] shadow-[0_0_8px_rgba(6,32,64,0.3)] animate-bounce-delay-2 md:w-2.5 md:h-2.5 md:mx-1 sm:w-2 sm:h-2 sm:mx-[3px]"></div>

          <div className="w-3 h-3 bg-[#00f0b4] rounded-full mx-[5px] shadow-[0_0_8px_rgba(6,32,64,0.3)] animate-bounce md:w-2.5 md:h-2.5 md:mx-1 sm:w-2 sm:h-2 sm:mx-[3px]"></div>
        </div>

        {/* Loading Text */}

        <div className="mt-[15px] text-base font-['DM_Sans',sans-serif] text-[#062040] text-center tracking-wider font-medium animate-pulse md:text-sm sm:text-[13px]">
          Loading...
        </div>
      </div>
    );
  }

  return children;
};

Loading.propTypes = {
  children: PropTypes.node.isRequired,

  duration: PropTypes.number,
};

export default Loading;
