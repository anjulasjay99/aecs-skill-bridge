/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import "./styles/tailwind.css";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import RegisterUser from "./pages/Register";
import Discover from "./pages/Discover";
import Mentor from "./pages/Mentor";
import MenteeSessions from "./pages/MenteeSessions";
import Messages from "./pages/Messages";
import Session from "./pages/Session";
import MentorSessions from "./pages/MentorSessions";
import Slot from "./pages/Slot";
import CollaborativeEditor from "./pages/CollaborativeEditor";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";

type ProtectedRouteParam = {
    children: any;
};

// Protected route component
const ProtectedRoute = (params: ProtectedRouteParam) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const user = localStorage.getItem("user");
        setIsAuthenticated(!!user);
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return params.children;
};

// Role-based route guard
const RoleGuard = ({ children }: { children: any }) => {
    const userRole = useSelector((state: RootState) => state.user.userRole);
    console.log(userRole);
    const location = useLocation();

    // If user is a mentee and trying to access non-discover routes, redirect to discover
    if (userRole === "mentee" && location.pathname === "/mentor-sessions") {
        return <Navigate to="/mentee-sessions" replace />;
    }

    if (userRole === "mentor" && location.pathname === "/mentee-sessions") {
        return <Navigate to="/mentor-sessions" replace />;
    }

    // If user is a mentor and trying to access discover, redirect to sessions
    if (userRole === "mentor" && location.pathname === "/discover") {
        return <Navigate to="/mentor-sessions" replace />;
    }
    if (userRole === "mentor" && location.pathname === "/session") {
        return <Navigate to="/mentor-sessions" replace />;
    }
    if (userRole === "mentee" && location.pathname === "/slot") {
        return <Navigate to="/mentee-sessions" replace />;
    }

    return children;
};

function App() {
    const userRole = useSelector((state: RootState) => state.user.userRole);

    return (
        <Theme>
            <Routes>
                {/* Public routes */}
                <Route path="login" element={<Login />} />
                <Route path="register" element={<RegisterUser />} />

                {/* Protected routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <RoleGuard>
                                <AppLayout />
                            </RoleGuard>
                        </ProtectedRoute>
                    }
                >
                    <Route
                        index
                        element={
                            <Navigate
                                to={
                                    userRole === "mentor"
                                        ? "/mentor-sessions"
                                        : "/discover"
                                }
                                replace
                            />
                        }
                    />
                    <Route path="discover" element={<Discover />} />
                    <Route path="mentor" element={<Mentor />} />
                    <Route
                        path="mentee-sessions"
                        element={<MenteeSessions />}
                    />
                    <Route
                        path="mentor-sessions"
                        element={<MentorSessions />}
                    />
                    <Route path="messages" element={<Messages />} />
                    <Route path="session" element={<Session />} />
                    <Route path="slot" element={<Slot />} />
                    <Route
                        path="live-session"
                        element={<CollaborativeEditor />}
                    />
                    <Route
                        path="payment-success"
                        element={<PaymentSuccess />}
                    />
                    <Route path="payment-failed" element={<PaymentFailed />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Theme>
    );
}

export default App;
