import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <Link
          to="/"
          className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          🍳 Recipe App
        </Link>
      </div>
    </header>
  );
};

export default Header;
