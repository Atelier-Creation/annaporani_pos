import React from 'react';
const ComingSoon = () => {
    return (
        <div className="h-[76vh] bg-white flex items-center justify-center font-sans overflow-hidden">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">

                {/* Left Side: Content */}
                <div className="w-full md:w-1/2 mb-12 md:mb-0">
                    <h1 className="text-5xl md:text-7xl font-black text-[#0A5D67] mt-2 mb-8 tracking-tight">
                        Comming Soon
                    </h1>
                    <button className="bg-[#5AC8B0] hover:bg-[#4ab39d] text-white font-bold py-3 px-10 rounded-full transition duration-300 uppercase text-sm tracking-widest shadow-lg">
                        Learn More
                    </button>
                </div>

                {/* Right Side: Illustration */}
                <div className="w-full md:w-1/2 relative flex justify-center items-center">
                    {/* Background Cloud/Blob Shapes */}
                    <div className="absolute w-[450px] h-[450px] bg-[#E0F7F4] rounded-full z-10 blur-3xl opacity-70"></div>
                    <div className="absolute w-[350px] h-[350px] bg-[#C1ECE5] rounded-full z-10 translate-x-20 -translate-y-10 opacity-50"></div>

                    <div className="relative w-full max-w-lg">
                        {/* The Monitor */}
                        <div className="relative z-10 bg-[#0A5D67] p-3 rounded-t-xl shadow-2xl">
                            <div className="bg-white rounded-sm aspect-video p-4 flex flex-col justify-between">

                                {/* Top Summary Cards */}
                                <div className="flex gap-2">
                                    <div className="flex-1 h-8 bg-[#E0F7F4] rounded-md"></div>
                                    <div className="flex-1 h-8 bg-[#C1ECE5] rounded-md"></div>
                                    <div className="flex-1 h-8 bg-[#E0F7F4] rounded-md"></div>
                                </div>

                                {/* Revenue Line Graph */}
                                <div className="relative h-16 mt-3">
                                    <svg viewBox="0 0 100 40" className="w-full h-full">
                                        <polyline
                                            fill="none"
                                            stroke="#0A5D67"
                                            strokeWidth="2"
                                            points="0,30 20,25 40,28 60,18 80,22 100,10"
                                        />
                                    </svg>
                                </div>

                                {/* Invoice Bars */}
                                <div className="flex items-end gap-2 h-14 mt-3">
                                    <div className="w-3 bg-[#5AC8B0] h-6 rounded"></div>
                                    <div className="w-3 bg-[#0A5D67] h-10 rounded"></div>
                                    <div className="w-3 bg-[#5AC8B0] h-12 rounded"></div>
                                    <div className="w-3 bg-[#0A5D67] h-8 rounded"></div>
                                    <div className="w-3 bg-[#5AC8B0] h-14 rounded"></div>
                                </div>

                                {/* Bottom Payment Icons */}
                                <div className="flex justify-between mt-3">

                                    {/* Receipt Shape */}
                                    <div className="w-8 h-10 bg-[#E0F7F4] rounded-sm relative">
                                        <div className="absolute bottom-0 left-0 w-full h-2 bg-[#5AC8B0] rounded-b-sm"></div>
                                    </div>

                                    {/* Card Shape */}
                                    <div className="w-12 h-8 bg-[#0A5D67] rounded-md relative">
                                        <div className="absolute top-2 left-0 w-full h-1 bg-white opacity-40"></div>
                                    </div>

                                </div>

                            </div>
                        </div>
                        {/* Monitor Stand */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-8 bg-[#084D55]"></div>
                            <div className="w-32 h-3 bg-[#084D55] rounded-t-md"></div>
                        </div>

                        {/* Floating Rocket */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 drop-shadow-xl">
                            <svg width="120" height="160" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C12 2 7 8 7 14C7 15.3261 7.52678 16.5979 8.46447 17.5355C9.40215 18.4732 10.6739 19 12 19C13.3261 19 14.5979 18.4732 15.5355 17.5355C16.4732 16.5979 17 15.3261 17 14C17 8 12 2 12 2Z" fill="#F3F4F6" stroke="#0A5D67" strokeWidth="1" />
                                <circle cx="12" cy="11" r="2" fill="#0A5D67" />
                                <path d="M7 14L4 17V19H7L9 17" fill="#0A5D67" />
                                <path d="M17 14L20 17V19H17L15 17" fill="#0A5D67" />
                            </svg>
                        </div>

                        {/* Wrench (Top Left) */}
                        <div className="absolute -top-20 left-10 text-[#5AC8B0] opacity-80 -rotate-45">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6-1.4 1.4L13.5 9.3a1 1 0 0 0-1.4 0l-8 8a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l8-8a1 1 0 0 0 0-1.4l-1.4-1.4 1.4-1.4 1.6 1.6a1 1 0 0 0 1.4 0l2.1-2.1a5 5 0 0 0-7.1-7.1l-2.1 2.1a1 1 0 0 0 0 1.4l1.6 1.6z" />
                            </svg>
                        </div>

                        {/* Gear (Bottom Right) */}
                        <div className="absolute -bottom-10 -right-10 text-[#0A5D67] opacity-40">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>

                        {/* Planet (Top Right) */}
                        <div className="absolute -top-16 -right-12 z-0 opacity-60">
                            <div className="w-20 h-20 bg-[#5AC8B0] rounded-full relative border-2 border-[#0A5D67]">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[2px] bg-[#0A5D67] rotate-[-20deg] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"></div>
                            </div>
                        </div>

                        {/* Floating UI Notification */}
                        <div className="absolute top-1/2 -left-12 z-30 bg-[#4C2A6B] text-white px-4 py-3 rounded-md shadow-xl flex items-center gap-3">
                            <div className="w-6 h-6 bg-white rounded-full"></div>
                            <div className="w-24 h-3 bg-white/20 rounded"></div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;