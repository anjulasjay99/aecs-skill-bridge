/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";
import {  useLocation } from "react-router-dom";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    XCircle,
    Loader,
} from "lucide-react";
import { APIURL } from '../environments/env';


const statusColors = {
    Confirmed: "bg-green-500",
    Pending: "bg-yellow-500",
    Cancelled: "bg-red-500",
};

// Define event type interface
interface Booking {
    bookingId: string;
    eventID: string;
    firstname: string;
    lastname: string;
    contact: string;
    type: string;
    payStatus?: string;
    peopleNum?: number;
    amountPaid: number;
    bookStatus: string;
}

// Define pagination interface
interface PaginationData {
    totalBookings: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

const BookingsList = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const location = useLocation();
    const { eventId } = location.state || {}; // Extract eventId from location state

    console.log("eventId", eventId);

    const [payCategory, setPayCategory] = useState("All");
    const [bookingCategory, setBookingCategory] = useState("All");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [pagination, setPagination] = useState<PaginationData>({
        totalBookings: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10,
        hasNextPage: false,
        hasPrevPage: false,
    });

    console.log("bookings", bookings);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);

        try {
            // Modify the API URL to dynamically load bookings for the given eventId
            const response = await axios.get(
                `${APIURL}/api/bookings/event/${eventId}?page=${pagination.currentPage}&limit=${pagination.pageSize}&payCategory=${payCategory}&bookingCategory=${bookingCategory}`
            );

            setBookings(response.data.bookings);
            setPagination(response.data.pagination);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError("Failed to load bookings. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) {
            fetchBookings();
        }
    }, [
        pagination.currentPage,
        pagination.pageSize,
        eventId,
        payCategory,
        bookingCategory,
    ]);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination({ ...pagination, currentPage: newPage });
        }
    };

    const handleRowsPerPageChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const newPageSize = parseInt(e.target.value);
        setPagination({
            ...pagination,
            pageSize: newPageSize,
            currentPage: 1,
        });
    };

    // const handleDeleteBooking = (id: string) => {
    //     if (confirm("Are you sure you want to Cancel this booking?")) {
    //         setBookings(bookings.filter((booking) => booking.bookingId !== id));
    //     }
    // };

    const handleCancelBooking = async (bookingId: string) => {
        if (confirm("Are you sure you want to cancel this booking?")) {
            try {
                const response = await fetch(
                    `${APIURL}/api/bookings/${bookingId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ bookStatus: "Cancelled" }),
                    }
                );

                if (response.ok) {
                    setBookings((prevBookings) =>
                        prevBookings.map((booking) =>
                            booking.bookingId === bookingId
                                ? { ...booking, bookStatus: "Cancelled" }
                                : booking
                        )
                    );
                } else {
                    console.error("Failed to cancel booking.");
                }
            } catch (error) {
                console.error("Error canceling booking:", error);
            }
        }
    };

    // const handleDeleteBooking = (id: string) => {
    //     if (confirm("Are you sure you want to cancel this booking?")) {
    //         setBookings((prevBookings) =>
    //             prevBookings.map((booking) =>
    //                 booking.bookingId === id
    //                     ? { ...booking, bookStatus: "Cancelled" }
    //                     : booking
    //             )
    //         );
    //     }
    // };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto bg-gray-50 p-6">
                {/* <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Bookings Management</h1>
                    <Link
                        to="/create-booking"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Booking
                    </Link>
                </div> */}

                <div className="mb-6 grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Payment Category
                        </label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8"
                                value={payCategory}
                                onChange={(e) => setPayCategory(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Booking Category
                        </label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8"
                                value={bookingCategory}
                                onChange={(e) =>
                                    setBookingCategory(e.target.value)
                                }
                            >
                                <option value="All">All Categories</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Pending">Pending</option>
                                <option value="Cancelled">Cancelled</option>
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
                        {bookings.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 mb-4">
                                    No bookings found for this event.
                                </p>
                                {/* <Link
                                    to="/create-booking"
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                >
                                    Create Booking for Participant
                                </Link> */}
                            </div>
                        ) : (
                            <>
                                <table className="w-full">
                                    <thead className="bg-blue-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                Booking ID
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                Full Name
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                Contact No
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                Type
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                Payment Status
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                No. of People
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                Amount Paid
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                Booking Status
                                            </th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((booking) => (
                                            <tr
                                                key={booking.bookingId}
                                                className="bg-white"
                                            >
                                                <td className="py-3 px-4 text-sm">
                                                    {booking.bookingId}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {booking.firstname +
                                                        " " +
                                                        booking.lastname}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {booking.contact}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {booking.type}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {booking.payStatus}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {booking.peopleNum}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {booking.amountPaid}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-white text-xs font-medium ${
                                                            statusColors[
                                                                booking.bookStatus as
                                                                    | "Confirmed"
                                                                    | "Pending"
                                                                    | "Cancelled"
                                                            ]
                                                        }`}
                                                    >
                                                        {booking.bookStatus}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-4 text-sm">
                                                    <div className="flex space-x-4">
                                                    
                                                        <button
                                                            onClick={() =>
                                                                handleCancelBooking(
                                                                    booking.bookingId
                                                                )
                                                            }
                                                            className="text-red-500 hover:text-red-700 cursor-pointer"
                                                            title="Cancel Booking"
                                                        >
                                                            <XCircle className="w-5 h-5" />
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
                                            pagination.totalBookings
                                        )}{" "}
                                        of {pagination.totalBookings} Bookings
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 space-x-6 w-full justify-end">
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
            </main>
        </div>
    );
};

export default BookingsList;
