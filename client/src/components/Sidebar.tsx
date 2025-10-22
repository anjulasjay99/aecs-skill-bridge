import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, LogOut, Compass, MessageCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userRole = useSelector((state: RootState) => state.user.userRole);

    const logout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <aside className="w-60 bg-white border-r border-gray-100 h-full flex flex-col overflow-y-auto">
            {/* Main Menu */}
            <div className="flex-1 flex flex-col px-3 py-4">
                <div className="mb-6">
                    <p className="text-xs font-medium text-gray-400 px-3 mb-2">
                        MAIN MENU
                    </p>
                    <nav className="space-y-1">
                        {userRole === "mentee" ? (
                            <Link
                                to="/discover"
                                className={`flex items-center px-3 py-2 rounded-lg ${
                                    isActive("/discover")
                                        ? "text-white bg-blue-600"
                                        : "text-gray-500 hover:bg-gray-100"
                                }`}
                            >
                                <Compass className="w-5 h-5 mr-3" />
                                <span>Discover</span>
                            </Link>
                        ) : null}
                        {userRole === "mentee" ? (
                            <Link
                                to="/mentee-sessions"
                                className={`flex items-center px-3 py-2 rounded-lg ${
                                    isActive("/mentee-sessions")
                                        ? "text-white bg-blue-600"
                                        : "text-gray-500 hover:bg-gray-100"
                                }`}
                            >
                                <Calendar className="w-5 h-5 mr-3" />
                                <span>Sessions</span>
                            </Link>
                        ) : (
                            <Link
                                to="/mentor-sessions"
                                className={`flex items-center px-3 py-2 rounded-lg ${
                                    isActive("/mentor-sessions")
                                        ? "text-white bg-blue-600"
                                        : "text-gray-500 hover:bg-gray-100"
                                }`}
                            >
                                <Calendar className="w-5 h-5 mr-3" />
                                <span>Sessions</span>
                            </Link>
                        )}

                        <Link
                            to="/messages"
                            className={`flex items-center px-3 py-2 rounded-lg ${
                                isActive("/messages")
                                    ? "text-white bg-blue-600"
                                    : "text-gray-500 hover:bg-gray-100"
                            }`}
                        >
                            <MessageCircle className="w-5 h-5 mr-3" />
                            <span>Messages</span>
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-gray-100 mt-auto">
                <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 text-gray-500 rounded-lg hover:bg-gray-100"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
