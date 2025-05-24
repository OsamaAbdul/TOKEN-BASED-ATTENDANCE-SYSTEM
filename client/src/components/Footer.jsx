import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-custom-teal text-black py-4 px-6 z-10">
      <div className="flex flex-col md:flex-row justify-center items-center max-w-7xl mx-auto text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} Admin Dashboard. All rights reserved. Developed By{' '}
          <span className="font-bold text-red-500 hover:scale-105 transition-transform duration-200 shadow-sm">
            Osama AbduL
          </span>
        </p>
        
      </div>
    </footer>
  );
};

export default Footer;