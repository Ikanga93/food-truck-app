import React from 'react'

const Logo = ({ size = 50, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: '10px' }}
    >
      {/* Background circle for better visibility */}
      <circle cx="100" cy="100" r="95" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="2"/>
      
      {/* Bull Body */}
      <ellipse cx="100" cy="140" rx="35" ry="45" fill="#8B4513"/>
      
      {/* Bull Head */}
      <circle cx="100" cy="85" r="35" fill="#D2691E"/>
      
      {/* Horns */}
      <path d="M70 60 Q60 45 55 50 Q65 55 70 65" fill="#F5F5DC" stroke="#8B4513" strokeWidth="2"/>
      <path d="M130 60 Q140 45 145 50 Q135 55 130 65" fill="#F5F5DC" stroke="#8B4513" strokeWidth="2"/>
      
      {/* Eyes */}
      <circle cx="88" cy="78" r="6" fill="white"/>
      <circle cx="112" cy="78" r="6" fill="white"/>
      <circle cx="88" cy="78" r="3" fill="black"/>
      <circle cx="112" cy="78" r="3" fill="black"/>
      
      {/* Eye highlights */}
      <circle cx="89" cy="76" r="1" fill="white"/>
      <circle cx="113" cy="76" r="1" fill="white"/>
      
      {/* Snout */}
      <ellipse cx="100" cy="95" rx="12" ry="8" fill="#F5DEB3" stroke="#8B4513" strokeWidth="1"/>
      
      {/* Nostrils */}
      <ellipse cx="96" cy="95" rx="2" ry="3" fill="#8B4513"/>
      <ellipse cx="104" cy="95" rx="2" ry="3" fill="#8B4513"/>
      
      {/* Happy smile */}
      <path d="M85 105 Q100 115 115 105" stroke="#8B4513" strokeWidth="3" fill="none"/>
      
      {/* Tongue sticking out playfully */}
      <ellipse cx="100" cy="108" rx="4" ry="2" fill="#FF69B4"/>
      
      {/* Chef Hat */}
      <ellipse cx="100" cy="45" rx="30" ry="12" fill="white" stroke="#DDD" strokeWidth="2"/>
      <rect x="75" y="30" width="50" height="20" fill="white" stroke="#DDD" strokeWidth="2"/>
      <ellipse cx="100" cy="30" rx="25" ry="15" fill="white" stroke="#DDD" strokeWidth="2"/>
      
      {/* White Apron */}
      <rect x="70" y="115" width="60" height="50" fill="white" stroke="#DDD" strokeWidth="2" rx="5"/>
      
      {/* Fernando's Text on Apron */}
      <text x="100" y="135" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#D32F2F">Fernando's</text>
      <text x="100" y="150" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fill="#388E3C">Auténtica Comida</text>
      <text x="100" y="160" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fill="#388E3C">Mexicana</text>
      
      {/* Left Arm */}
      <ellipse cx="55" cy="130" rx="12" ry="25" fill="#D2691E" stroke="#8B4513" strokeWidth="2"/>
      
      {/* Right Arm holding tacos */}
      <ellipse cx="145" cy="130" rx="12" ry="25" fill="#D2691E" stroke="#8B4513" strokeWidth="2"/>
      
      {/* Plate in right hand */}
      <ellipse cx="160" cy="115" rx="20" ry="4" fill="#E6E6FA" stroke="#DDD" strokeWidth="1"/>
      
      {/* Tacos on plate */}
      <g transform="translate(145, 105)">
        {/* Taco 1 */}
        <path d="M0 0 Q8 -5 16 0 Q8 12 0 8 Z" fill="#F4A460" stroke="#D2691E" strokeWidth="1"/>
        <rect x="2" y="2" width="12" height="2" fill="#228B22"/>
        <rect x="3" y="4" width="10" height="1" fill="#FF6347"/>
        <rect x="2" y="5" width="12" height="1" fill="#FFD700"/>
        
        {/* Taco 2 */}
        <g transform="translate(8, -2)">
          <path d="M0 0 Q8 -5 16 0 Q8 12 0 8 Z" fill="#F4A460" stroke="#D2691E" strokeWidth="1"/>
          <rect x="2" y="2" width="12" height="2" fill="#228B22"/>
          <rect x="3" y="4" width="10" height="1" fill="#FF6347"/>
          <rect x="2" y="5" width="12" height="1" fill="#FFD700"/>
        </g>
        
        {/* Taco 3 */}
        <g transform="translate(16, 0)">
          <path d="M0 0 Q8 -5 16 0 Q8 12 0 8 Z" fill="#F4A460" stroke="#D2691E" strokeWidth="1"/>
          <rect x="2" y="2" width="12" height="2" fill="#228B22"/>
          <rect x="3" y="4" width="10" height="1" fill="#FF6347"/>
          <rect x="2" y="5" width="12" height="1" fill="#FFD700"/>
      </g>
      </g>
      
      {/* Left hand waving */}
      <circle cx="45" cy="115" r="8" fill="#D2691E" stroke="#8B4513" strokeWidth="2"/>
      
      {/* Legs */}
      <rect x="85" y="175" width="12" height="20" fill="#8B4513" rx="6"/>
      <rect x="103" y="175" width="12" height="20" fill="#8B4513" rx="6"/>
      
      {/* Hooves */}
      <ellipse cx="91" cy="195" rx="8" ry="4" fill="black"/>
      <ellipse cx="109" cy="195" rx="8" ry="4" fill="black"/>
    </svg>
  )
}

export default Logo 