/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import "./styles/tailwind.css";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import RegisterUser from "./pages/Register";
import Discover from "./pages/Discover";
import Mentor from "./pages/Mentor";
import Sessions from "./pages/Bookings";
import Messages from "./pages/Messages";

type ProtectedRouteParam = {
    children: any;
};

// Protected route component
const ProtectedRoute = (params: ProtectedRouteParam) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Check if user exists in localStorage
        const user = localStorage.getItem("user");
        setIsAuthenticated(!!user);
        setIsLoading(false);
    }, []);

    if (isLoading) {
        // Return a loading indicator while checking auth status
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login page if not authenticated
        // Pass the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return params.children;
};

function App() {
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
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        index
                        element={<Navigate to="/discover" replace />}
                    />
                    <Route path="discover" element={<Discover />} />
                    <Route path="mentor" element={<Mentor />} />
                    <Route path="sessions" element={<Sessions />} />
                    <Route path="messages" element={<Messages />} />
                </Route>

                {/* Catch all route - redirect to login if not authenticated */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Theme>
    );
}

export default App;
