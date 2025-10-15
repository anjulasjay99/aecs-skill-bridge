import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    Plus,
    Loader,
    X,
    AlertTriangle,
} from "lucide-react";
import { APIURL } from '../environments/env';

// Define event type interface
interface Event {
    _id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    bookingsCount?: number;
    interestedUsers?: string[];
    cancelations?: number;
    refunds?: number;
}

// Define pagination interface
interface PaginationData {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

const EventsList = () => {
    // State for filters
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedDate, setSelectedDate] = useState("All");

    // State for events data and pagination
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const navigate = useNavigate();

    // Pagination state
    const [pagination, setPagination] = useState<PaginationData>({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10,
        hasNextPage: false,
        hasPrevPage: false,
    });

    // Fetch events data
    const fetchEvents = async () => {
        setLoading(true);
        setError(null);

        try {
            const user = JSON.parse(localStorage.getItem("user")!);
            const response = await axios.get(
                `${APIURL}/api/events/admin/${user.id}?page=${pagination.currentPage}&limit=${pagination.pageSize}&category=${selectedCategory}&date=${selectedDate}`
            );

            setEvents(response.data.items);
            setPagination(response.data.pagination);
        } catch (err) {
            console.error("Error fetching events:", err);
            setError("Failed to load events. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Load events on component mount and when pagination changes
    useEffect(() => {
        fetchEvents();
    }, [
        pagination.currentPage,
        pagination.pageSize,
        selectedCategory,
        selectedDate,
    ]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination({ ...pagination, currentPage: newPage });
        }
    };

    // Handle rows per page change
    const handleRowsPerPageChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const newPageSize = parseInt(e.target.value);
        setPagination({
            ...pagination,
            pageSize: newPageSize,
            currentPage: 1, // Reset to first page when changing page size
        });
    };

    // Open delete confirmation modal
    const openDeleteModal = (event: Event) => {
        setEventToDelete(event);
        setShowDeleteModal(true);
    };

    // Close delete confirmation modal
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setEventToDelete(null);
    };

    // Handle delete event
    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;

        setDeleteLoading(true);
        try {
            await axios.delete(
                `${APIURL}/api/events/${eventToDelete._id}`
            );

            // Remove the deleted event from the local state
            setEvents(
                events.filter((event) => event._id !== eventToDelete._id)
            );

            // Update pagination
            setPagination({
                ...pagination,
                totalItems: pagination.totalItems - 1,
                totalPages: Math.ceil(
                    (pagination.totalItems - 1) / pagination.pageSize
                ),
            });

            closeDeleteModal();
        } catch (err) {
            console.error("Error deleting event:", err);
            setError("Failed to delete event. Please try again later.");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Format date for display
    const formatDateTime = (dateString: string, timeString?: string) => {
        try {
            const date = new Date(dateString);
            const formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });

            if (timeString) {
                return `${formattedDate}, ${timeString}`;
            }

            return formattedDate;
        } catch (e: unknown) {
            console.log(e);
            return dateString;
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto bg-gray-50 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        My Events
                    </h1>
                    <Link
                        to="/create-event"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Event
                    </Link>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Category
                        </label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8"
                                value={selectedCategory}
                                onChange={(e) =>
                                    setSelectedCategory(e.target.value)
                                }
                            >
                                <option value="All">All Categories</option>
                                <option value="Music">Music</option>
                                <option value="Business">Business</option>
                                <option value="Education">Education</option>
                                <option value="Food">Food & Drinks</option>
                                <option value="Technology">Technology</option>
                                <option value="Sports">Sports</option>
                                <option value="Arts">Arts</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Date
                        </label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8"
                                value={selectedDate}
                                onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                }
                            >
                                <option value="All">All Dates</option>
                                <option value="today">Today</option>
                                <option value="thisWeek">This Week</option>
                                <option value="thisMonth">This Month</option>
                                <option value="pastEvents">Past Events</option>
                                <option value="upcomingEvents">
                                    Upcoming Events
                                </option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>
                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">
                            Loading events...
                        </span>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                        {events.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 mb-4">
                                    You haven't created any events yet.
                                </p>
                                <Link
                                    to="/create-event"
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                >
                                    Create Your First Event
                                </Link>
                            </div>
                        ) : (
                            <>
                                <table className="w-full">
                                    <thead className="bg-blue-50">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                                Event ID
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                                Event Name
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                                Date and Start Time
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                                Location
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                                Capacity
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                                Bookings
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                                Interested
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map((event, index) => (
                                            <tr
                                                key={event._id}
                                                className={
                                                    index % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-gray-50"
                                                }
                                            >
                                                <td className="py-3 px-4 text-sm">
                                                    {event._id.substring(0, 8)}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {event.title}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {formatDateTime(
                                                        event.date,
                                                        event.time
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {event.location}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {event.capacity}
                                                </td>
                                                <td
                                                    className="py-3 px-4 text-sm text-blue-500 cursor-pointer"
                                                    onClick={() =>
                                                        navigate("/bookings", {
                                                            state: {
                                                                eventId:
                                                                    event._id,
                                                            },
                                                        })
                                                    }
                                                >
                                                    {event.bookingsCount || 0}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {event.interestedUsers
                                                        ? event.interestedUsers
                                                              .length
                                                        : 0}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                navigate(
                                                                    `/edit-event/${event._id}`,
                                                                    {
                                                                        state: {
                                                                            event,
                                                                        },
                                                                    }
                                                                );
                                                            }}
                                                            className="text-blue-500 hover:text-blue-700 cursor-pointer"
                                                            aria-label="Edit event"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            className="text-red-500 hover:text-red-700  cursor-pointer"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    event
                                                                )
                                                            }
                                                            aria-label="Delete event"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Showing{" "}
                                        {(pagination.currentPage - 1) *
                                            pagination.pageSize +
                                            1}{" "}
                                        to{" "}
                                        {Math.min(
                                            pagination.currentPage *
                                                pagination.pageSize,
                                            pagination.totalItems
                                        )}{" "}
                                        of {pagination.totalItems} events
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 space-x-6">
                                        <div className="flex items-center">
                                            <span>Rows per page:</span>
                                            <div className="relative ml-2">
                                                <select
                                                    className="appearance-none bg-transparent pr-6"
                                                    value={pagination.pageSize}
                                                    onChange={
                                                        handleRowsPerPageChange
                                                    }
                                                >
                                                    <option value="5">5</option>
                                                    <option value="10">
                                                        10
                                                    </option>
                                                    <option value="25">
                                                        25
                                                    </option>
                                                    <option value="50">
                                                        50
                                                    </option>
                                                </select>
                                                <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                className={`p-1 rounded-full ${
                                                    pagination.hasPrevPage
                                                        ? "hover:bg-gray-100 text-gray-600"
                                                        : "text-gray-300 cursor-not-allowed"
                                                }`}
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.currentPage -
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    !pagination.hasPrevPage
                                                }
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span>
                                                Page {pagination.currentPage} of{" "}
                                                {pagination.totalPages}
                                            </span>
                                            <button
                                                className={`p-1 rounded-full ${
                                                    pagination.hasNextPage
                                                        ? "hover:bg-gray-100 text-gray-600"
                                                        : "text-gray-300 cursor-not-allowed"
                                                }`}
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.currentPage +
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    !pagination.hasNextPage
                                                }
                                                aria-label="Next page"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black opacity-40"></div>

                        {/* Modal Content */}
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden z-10 relative">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                    <h3 className="font-medium text-lg text-gray-900">
                                        Delete Event
                                    </h3>
                                </div>
                                <button
                                    onClick={closeDeleteModal}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-6 py-4">
                                <p className="text-gray-600 mb-4">
                                    {Number(
                                        eventToDelete?.bookingsCount ?? 0
                                    ) === 0
                                        ? `Are you sure you want to delete the event "
                                    ${eventToDelete?.title}"? This action cannot
                                    be undone.`
                                        : `The event ${eventToDelete?.title} has ${eventToDelete?.bookingsCount} bookings. Are you sure you want to delete this event? All the bookings will be canceled and users will be notified by performing this action.`}
                                </p>

                                <div className="flex items-center mt-6 justify-end space-x-4">
                                    <button
                                        onClick={closeDeleteModal}
                                        className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteEvent}
                                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center"
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                                Deleting...
                                            </>
                                        ) : (
                                            "Delete Event"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EventsList;
