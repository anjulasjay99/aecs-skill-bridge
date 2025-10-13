/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
import { APIURL, SEARCH_SERVICE } from "../environments/env";
import {
    Loader2,
    UserCircle2,
    BadgeCheck,
    Briefcase,
    Layers,
    DollarSign,
} from "lucide-react";

interface Mentor {
    _id: string;
    userId?: {
        firstName?: string;
        lastName?: string;
    };
    designation?: string;
    domains?: string[];
    yearsOfExperience?: number;
    hourlyRate?: number;
    badges?: string[];
}

interface MentorResponse {
    page: number;
    size: number;
    totalMentors: number;
    totalPages: number;
    mentors: Mentor[];
}

const Discover = () => {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [domainFilter, setDomainFilter] = useState("");
    const [designationFilter, setDesignationFilter] = useState("");
    const [badgeFilter, setBadgeFilter] = useState("");
    const [expFilter, setExpFilter] = useState("");
    const [rateFilter, setRateFilter] = useState("");

    // Pagination (from API)
    const [page, setPage] = useState(1);
    const [size] = useState(6);
    const [totalPages, setTotalPages] = useState(1);

    // Dropdown options
    const domainOptions = [
        "Backend",
        "Frontend",
        "DevOps",
        "Data",
        "AWS",
        "Node.js",
        "API",
    ];
    const designationOptions = [
        "Software Engineer",
        "Senior Engineer",
        "Staff Engineer",
        "Principal Engineer",
    ];
    const badgeOptions = [
        "Code Reviewer",
        "Supervisor",
        "Interview Coach",
        "System Design Specialist",
    ];
    const expOptions = ["1", "2", "3", "5", "10+"];
    const rateOptions = ["10", "20", "30", "40", "50"];

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page, size };

            if (domainFilter) params.domains = domainFilter;
            if (designationFilter) params.designation = designationFilter;
            if (badgeFilter) params.badges = badgeFilter;
            if (expFilter) params.exp = expFilter;
            if (rateFilter) params.hourlyRate = rateFilter;

            const res = await axios.get<MentorResponse>(
                `${SEARCH_SERVICE}/mentors`,
                { params }
            );

            const list = Array.isArray(res.data?.mentors)
                ? res.data.mentors
                : [];
            setMentors(list);
            setTotalPages(res.data?.totalPages || 1);
        } catch (err) {
            console.error("Error fetching mentors:", err);
            setMentors([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    // Fetch whenever filters or page changes
    useEffect(() => {
        fetchMentors();
    }, [
        domainFilter,
        designationFilter,
        badgeFilter,
        expFilter,
        rateFilter,
        page,
    ]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [domainFilter, designationFilter, badgeFilter, expFilter, rateFilter]);

    return (
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Discover Mentors
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Filter mentors by domain, experience, badge,
                        designation, or rate.
                    </p>
                </div>

                {/* Filters (Dropdowns) */}
                <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <select
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        value={domainFilter}
                        onChange={(e) => setDomainFilter(e.target.value)}
                    >
                        <option value="">All Domains</option>
                        {domainOptions.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        value={designationFilter}
                        onChange={(e) => setDesignationFilter(e.target.value)}
                    >
                        <option value="">All Designations</option>
                        {designationOptions.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        value={badgeFilter}
                        onChange={(e) => setBadgeFilter(e.target.value)}
                    >
                        <option value="">All Badges</option>
                        {badgeOptions.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        value={expFilter}
                        onChange={(e) => setExpFilter(e.target.value)}
                    >
                        <option value="">All Experience</option>
                        {expOptions.map((exp) => (
                            <option key={exp} value={exp}>
                                {exp}+ years
                            </option>
                        ))}
                    </select>

                    <select
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        value={rateFilter}
                        onChange={(e) => setRateFilter(e.target.value)}
                    >
                        <option value="">All Rates</option>
                        {rateOptions.map((rate) => (
                            <option key={rate} value={rate}>
                                ${rate}/hr
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mentor Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {mentors.length > 0 ? (
                            mentors.map((m) => (
                                <div
                                    key={m._id}
                                    className="bg-white rounded-xl shadow p-6 hover:shadow-md transition duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                            <UserCircle2 className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-800 truncate">
                                                {m.userId?.firstName ??
                                                    "Unknown"}{" "}
                                                {m.userId?.lastName ?? ""}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                <Briefcase className="w-4 h-4" />
                                                <span>
                                                    {m.designation ?? "—"}
                                                </span>
                                            </div>
                                            {m.yearsOfExperience !==
                                                undefined && (
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {m.yearsOfExperience}{" "}
                                                    {m.yearsOfExperience === 1
                                                        ? "year"
                                                        : "years"}{" "}
                                                    exp
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Domains */}
                                    {m.domains && m.domains.length > 0 && (
                                        <div className="mt-4">
                                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                                <Layers className="w-4 h-4" />
                                                <span>Domains</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {m.domains.map((d) => (
                                                    <span
                                                        key={d}
                                                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                                                    >
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Badges */}
                                    {m.badges && m.badges.length > 0 && (
                                        <div className="mt-4">
                                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                                <BadgeCheck className="w-4 h-4" />
                                                <span>Badges</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {m.badges.map((b) => (
                                                    <span
                                                        key={b}
                                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                                                    >
                                                        {b}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-5 flex items-center justify-between">
                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                            <DollarSign className="w-4 h-4 text-blue-600" />
                                            {m.hourlyRate !== undefined ? (
                                                <span className="text-blue-700 font-medium">
                                                    ${m.hourlyRate}/hr
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">
                                                    Rate N/A
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center col-span-full">
                                No mentors found.
                            </p>
                        )}
                    </div>
                )}

                {/* Pagination from API */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-center items-center mt-10 gap-3">
                        <button
                            className={`px-3 py-1 rounded-md border text-sm ${
                                page === 1
                                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Prev
                        </button>
                        <span className="text-gray-600 text-sm">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className={`px-3 py-1 rounded-md border text-sm ${
                                page === totalPages
                                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Discover;
