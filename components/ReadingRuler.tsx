import React, { useEffect, useState } from 'react';

const ReadingRuler: React.FC = () => {
  const [position, setPosition] = useState({ y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Offset slightly so the text isn't covered, but highlighted
      setPosition({ y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed left-0 w-full pointer-events-none z-50 mix-blend-multiply dark:mix-blend-screen transition-transform duration-75 ease-out"
      style={{
        height: '40px', // Height of the highlight bar
        top: position.y - 20, // Center on mouse
        background: 'rgba(255, 255, 0, 0.2)', // Subtle yellow highlight
        borderTop: '1px solid rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}
    />
  );
};

export default ReadingRuler;
