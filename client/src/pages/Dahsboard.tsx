/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Calendar, Users, Clock, Tag } from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import axios from "axios";
import { APIURL } from '../environments/env';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const categoryColors: Record<string, string> = {
    Music: "#3B82F6",
    Business: "#10B981",
    Education: "#F59E0B",
    Food: "#EC4899",
    Technology: "#8B5CF6",
    Sports: "#EF4444",
    Arts: "#F97316",
};

const Dashboard = () => {
    // State for dashboard data
    const [dashboardData, setDashboardData] = useState({
        totalBookings: 0,
        totalEvents: 0,
        upcomingEvents: 0,
        categories: [],
        recentEvents: [],
        monthlyBookings: [],
        revenueData: [],
    });

    // State for loading
    const [loading, setLoading] = useState(true);

    // Load dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem("user")!);
                const res = await axios.get(
                    `${APIURL}/api/events/summary/${user.id}`
                );

                console.log(res.data);
                const data = {
                    ...res.data,
                    categories: res.data.categories.map((category: any) => {
                        return {
                            ...category,
                            color: categoryColors[category.name],
                        };
                    }),
                };

                setDashboardData(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Format numbers with commas
    const formatNumber = (num: number) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Prepare data for Category Pie Chart
    const categoryPieData = {
        labels: dashboardData.categories.map((cat: any) => cat.name),
        datasets: [
            {
                data: dashboardData.categories.map((cat: any) => cat.count),
                backgroundColor: dashboardData.categories.map(
                    (cat: any) => cat.color
                ),
                borderWidth: 0,
            },
        ],
    };

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "right" as const,
                labels: {
                    boxWidth: 12,
                    padding: 15,
                    font: {
                        size: 11,
                    },
                },
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
            <div className="max-w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Dashboard
                        </h1>
                        <p className="text-gray-500">
                            Welcome back, get an overview of your events
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 md:grid-cols-1 gap-6 mb-6">
                    {/* Total Events Card */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-md">
                                    Total Events
                                </p>
                                <h3 className="text-6xl font-bold mt-1">
                                    {loading
                                        ? "..."
                                        : formatNumber(
                                              dashboardData.totalEvents
                                          )}
                                </h3>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Total Bookings Card */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-md">
                                    Total Bookings
                                </p>
                                <h3 className="text-6xl font-bold mt-1">
                                    {loading
                                        ? "..."
                                        : formatNumber(
                                              dashboardData.totalBookings
                                          )}
                                </h3>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Events Card */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-md">
                                    Upcoming Events
                                </p>
                                <h3 className="text-6xl font-bold mt-1">
                                    {loading
                                        ? "..."
                                        : formatNumber(
                                              dashboardData.upcomingEvents
                                          )}
                                </h3>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Categories Distribution Chart */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-gray-700">
                                Event Categories
                            </h3>
                        </div>
                        <div className="h-64">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-pulse bg-gray-200 rounded-full w-3/4 h-3/4"></div>
                                </div>
                            ) : (
                                <Pie
                                    data={categoryPieData}
                                    options={pieChartOptions}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Revenue and Recent Events Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Events */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-gray-700">
                                Recent Events
                            </h3>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="animate-pulse flex items-center space-x-3"
                                    >
                                        <div className="bg-gray-200 h-10 w-10 rounded"></div>
                                        <div className="flex-1">
                                            <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                                            <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {dashboardData.recentEvents.map(
                                    (event: any) => (
                                        <div
                                            key={event.id}
                                            className="flex items-start space-x-3"
                                        >
                                            <div
                                                className={`p-2 rounded-lg bg-${
                                                    event.category === "Music"
                                                        ? "blue"
                                                        : event.category ===
                                                          "Business"
                                                        ? "green"
                                                        : event.category ===
                                                          "Technology"
                                                        ? "purple"
                                                        : "yellow"
                                                }-100`}
                                            >
                                                <Tag
                                                    className={`w-5 h-5 text-${
                                                        event.category ===
                                                        "Music"
                                                            ? "blue"
                                                            : event.category ===
                                                              "Business"
                                                            ? "green"
                                                            : event.category ===
                                                              "Technology"
                                                            ? "purple"
                                                            : "yellow"
                                                    }-600`}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-800 text-sm">
                                                    {event.title}
                                                </h4>
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <span>
                                                        {formatDate(event.date)}
                                                    </span>
                                                    <span className="mx-2">
                                                        •
                                                    </span>
                                                    <span>
                                                        {event.bookings}{" "}
                                                        bookings
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
