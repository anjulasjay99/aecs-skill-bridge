import { User } from "lucide-react";

function Header() {
    return (
        <header className="bg-white py-4 px-6 flex justify-between items-center border-b border-gray-200">
            <div className="text-blue-600 font-bold text-xl">SKILL BRIDGE</div>
            <div className="flex items-center space-x-4">
                <button className="bg-gray-700 rounded-full w-8 h-8 overflow-hidden">
                    <User className="w-full h-full text-white" />
                </button>
            </div>
        </header>
    );
}

export default Header;
