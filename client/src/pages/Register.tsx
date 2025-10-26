/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../environments/env";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "mentee",
        designation: "",
        bio: "",
        domains: [] as string[],
        yearsOfExperience: "",
        hourlyRate: "",
        badges: [] as string[],
        socials: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const domainOptions = [
        "Frontend",
        "Backend",
        "DevOps",
        "Data Science",
        "AI/ML",
    ];
    const badgeOptions = [
        "Interview Coach",
        "System Design Specialist",
        "Code Reviewer",
        "Career Mentor",
    ];
    const designationOptions = [
        "Software Engineer",
        "Senior Engineer",
        "Tech Lead",
        "Architect",
        "Instructor",
    ];

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    const handleMultiSelect = (e: any, field: "domains" | "badges") => {
        const options = Array.from(
            e.target.selectedOptions,
            (opt: any) => opt.value
        );
        setFormData((prev) => ({ ...prev, [field]: options }));
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const validateForm = () => {
        if (!formData.firstName.trim() || !formData.lastName.trim())
            return setError("First name and last name are required");
        if (!/\S+@\S+\.\S+/.test(formData.email))
            return setError("Please enter a valid email address");
        if (!formData.password) return setError("Password is required");

        if (formData.role === "mentor") {
            if (!formData.designation)
                return setError("Please select a designation");
            if (!formData.bio.trim()) return setError("Bio is required");
            if (formData.domains.length === 0)
                return setError("Select at least one domain");
            if (formData.badges.length === 0)
                return setError("Select at least one badge");
            if (!formData.yearsOfExperience)
                return setError("Years of experience required");
            if (!formData.hourlyRate) return setError("Hourly rate required");
        }
        return true;
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        const payload: any = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
        };

        if (formData.role === "mentor") {
            payload.mentorProfile = {
                designation: formData.designation,
                bio: formData.bio,
                domains: formData.domains,
                yearsOfExperience: parseInt(formData.yearsOfExperience),
                hourlyRate: parseFloat(formData.hourlyRate),
                badges: formData.badges,
                socials: formData.socials,
            };
        }

        try {
            await axios.post(`${API_BASE_URL}/users`, payload);
            navigate("/login");
        } catch (err: any) {
            console.error(err);
            setError("Failed to register. Please try again.");
        } finally {
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
                            Create your account
                        </h2>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-1/2 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-1/2 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                />
                            </div>

                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            />

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Register as
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                >
                                    <option value="mentee">Mentee</option>
                                    <option value="mentor">Mentor</option>
                                </select>
                            </div>

                            {formData.role === "mentor" && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            Designation
                                        </label>
                                        <select
                                            name="designation"
                                            value={formData.designation}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        >
                                            <option value="">
                                                Select designation
                                            </option>
                                            {designationOptions.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <textarea
                                        name="bio"
                                        placeholder="Write a short bio..."
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    />

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            Domains
                                        </label>
                                        <select
                                            multiple
                                            name="domains"
                                            onChange={(e) =>
                                                handleMultiSelect(e, "domains")
                                            }
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50"
                                        >
                                            {domainOptions.map((d) => (
                                                <option key={d}>{d}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Hold Ctrl (Windows) or Cmd (Mac) to
                                            select multiple
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            Badges
                                        </label>
                                        <select
                                            multiple
                                            name="badges"
                                            onChange={(e) =>
                                                handleMultiSelect(e, "badges")
                                            }
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50"
                                        >
                                            {badgeOptions.map((b) => (
                                                <option key={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3">
                                        <input
                                            type="number"
                                            name="yearsOfExperience"
                                            placeholder="Years of Experience"
                                            value={formData.yearsOfExperience}
                                            onChange={handleInputChange}
                                            className="w-1/2 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        />
                                        <input
                                            type="number"
                                            name="hourlyRate"
                                            placeholder="Hourly Rate ($)"
                                            value={formData.hourlyRate}
                                            onChange={handleInputChange}
                                            className="w-1/2 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        />
                                    </div>

                                    <input
                                        type="text"
                                        name="socials"
                                        placeholder="LinkedIn / GitHub URL (optional)"
                                        value={formData.socials}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    />
                                </>
                            )}

                            <button
                                type="submit"
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
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        Sign Up
                                    </span>
                                )}
                            </button>

                            <div className="text-sm text-center mt-3">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <footer className="bg-white py-4 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>©2025 Skill Bridge. All rights reserved</p>
                </div>
            </footer>
        </div>
    );
};

export default Register;
