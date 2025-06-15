import React from 'react';

interface ScreenProps {
  children: React.ReactNode;
}

const Screen: React.FC<ScreenProps> = ({ children }) => {
  const screenStyle: React.CSSProperties = {
    height: '100%', // Takes full height from parent div in App.tsx which is h-screen
    aspectRatio: '9 / 16', // Maintain a 9:16 aspect ratio
    // The width will be determined by height and aspect-ratio.
    // This width needs to be constrained.
    maxWidth: 'min(100vw, 500px)', // Cap width: don't exceed viewport width or 500px
                                 // e.g. if viewport is 400px wide, max-width is 400px.
                                 // if viewport is 1000px wide, max-width is 500px.
    minWidth: '300px', // Prevent the screen from becoming too narrow on very short viewports
                       // where aspect-ratio would shrink width excessively.
    margin: 'auto', // Center the component if its dimensions are smaller than the parent flex container
    overflow: 'hidden', // Ensure content within the screen component itself doesn't cause overflow
                       // Individual scrolling areas inside will handle their own scroll.
    boxSizing: 'border-box',
  };

  return (
    <div 
      style={screenStyle}
      className="bg-neutral-900 text-neutral-200 flex flex-col relative shadow-2xl shadow-neutral-950/70"
    >
      {children}
    </div>
  );
};

export default Screen;