/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../environments/env";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { setUser, setUserRole, setToken } from "../store/userSlice";

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    // State for form data
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // State for showing/hiding password
    const [showPassword, setShowPassword] = useState(false);

    // State for form errors
    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    // State for login status
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState("");

    // Handle input changes
    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear errors when typing
        if (name === "email") {
            if (errors["email"]) {
                setErrors({
                    ...errors,
                    [name]: "",
                });
            }
        } else if (name === "password") {
            if (errors["password"]) {
                setErrors({
                    ...errors,
                    [name]: "",
                });
            }
        }

        // Clear login error when any input changes
        if (loginError) {
            setLoginError("");
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {
            email: "",
            password: "",
        };

        let isValid = true;

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        // Validate password
        if (!formData.password) {
            newErrors.password = "Password is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e: any) => {
        if (e) e.preventDefault();

        if (validateForm()) {
            setIsLoading(true);

            await axios
                .post(`${API_BASE_URL}/users/login`, {
                    email: formData.email,
                    password: formData.password,
                })
                .then((res) => {
                    const user: any = jwtDecode(res.data.token);
                    localStorage.setItem("user", JSON.stringify(user));
                    localStorage.setItem("userRole", user.user.role);
                    localStorage.setItem("token", res.data.token);
                    dispatch(setUser(user));
                    dispatch(setUserRole(user.user.role));
                    dispatch(setToken(res.data.token));
                    navigate("/discover");
                })
                .catch((error) => {
                    setLoginError("Invalid email or password");
                });

            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h1 className="text-blue-600 font-bold text-3xl mb-2">
                            SKILL BRIDGE
                        </h1>
                    </div>

                    <div className="bg-white shadow-md rounded-lg p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                            Welcome back
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Please enter your credentials to access your account
                        </p>

                        {loginError && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                                <div className="flex">
                                    <div>
                                        <p className="text-sm text-red-700">
                                            {loginError}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        errors.email
                                            ? "border-red-500"
                                            : "border-gray-200"
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                handleSubmit(e);
                                            }
                                        }}
                                        className={`w-full px-4 py-3 rounded-lg border ${
                                            errors.password
                                                ? "border-red-500"
                                                : "border-gray-200"
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50`}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor="remember-me"
                                        className="ml-2 block text-sm text-gray-700"
                                    >
                                        Remember me
                                    </label>
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleSubmit(e)}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition duration-150 ease-in-out"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <LogIn className="w-5 h-5 mr-2" />
                                        Sign In
                                    </span>
                                )}
                            </button>
                            <label className="text-sm">
                                Don't have an account?{" "}
                            </label>
                            <Link
                                to="/register"
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Create account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="bg-white py-4 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>©2025 SkillBridge. All rights reserved</p>
                </div>
            </footer>
        </div>
    );
};

export default Login;
