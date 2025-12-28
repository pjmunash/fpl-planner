import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-semibold text-gray-700 dark:text-gray-200">FPL Planner</span>
        <div className="flex items-center gap-2">
          <span>Need help?</span>
          <a
            className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
            href="mailto:fplxplanner@gmail.com"
          >
            fplxplanner@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
