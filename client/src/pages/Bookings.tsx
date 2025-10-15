import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Loader, X, AlertTriangle } from "lucide-react";
import {
    BOOKING_SERVICE,
    SEARCH_SERVICE,
    AVAIL_SERVICE,
} from "../environments/env";

interface Booking {
    _id: string;
    mentorId: string;
    menteeId: string;
    slotId: string;
    payment: number;
    isConfirmed: boolean;
    createdDate: string;
}

interface Mentor {
    _id: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    designation: string;
    domains: string[];
    hourlyRate: number;
}

interface Slot {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
}

const Sessions = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [mentors, setMentors] = useState<Record<string, Mentor>>({});
    const [slots, setSlots] = useState<Record<string, Slot>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(
        null
    );
    const [cancelLoading, setCancelLoading] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const userData = localStorage.getItem("user");
            const menteeId = userData ? JSON.parse(userData)?.user?._id : null;

            const res = await axios.get(
                `${BOOKING_SERVICE}/bookings?menteeId=${menteeId}`
            );
            const data = res.data.bookings || [];
            setBookings(data);

            // Fetch mentors and slots concurrently
            const mentorPromises = data.map(async (booking: Booking) => {
                const mentorRes = await axios.get(
                    `${SEARCH_SERVICE}/mentors/${booking.mentorId}`
                );
                return { id: booking.mentorId, mentor: mentorRes.data.mentor };
            });

            const slotPromises = data.map(async (booking: Booking) => {
                const slotRes = await axios.get(
                    `${AVAIL_SERVICE}/availability/slots/${booking.slotId}`
                );
                return { id: booking.slotId, slot: slotRes.data.slot };
            });

            const [mentorResults, slotResults] = await Promise.all([
                Promise.all(mentorPromises),
                Promise.all(slotPromises),
            ]);

            // Map mentors
            const mentorsMap: Record<string, Mentor> = {};
            mentorResults.forEach((m) => {
                mentorsMap[m.id] = m.mentor;
            });
            setMentors(mentorsMap);

            // Map slots
            const slotsMap: Record<string, Slot> = {};
            slotResults.forEach((s) => {
                slotsMap[s.id] = s.slot;
            });
            setSlots(slotsMap);
        } catch (err) {
            console.error(err);
            setError("Failed to load bookings. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!selectedBooking) return;
        setCancelLoading(true);
        try {
            await axios.delete(
                `${BOOKING_SERVICE}/bookings/${selectedBooking._id}`
            );
            closeCancelModal();
            await fetchBookings(); // refresh after cancel
        } catch (err) {
            console.error(err);
            setError("Failed to cancel booking. Please try again later.");
        } finally {
            setCancelLoading(false);
        }
    };

    const openCancelModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        setShowCancelModal(false);
        setSelectedBooking(null);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const formatSlot = (slot: Slot | undefined) => {
        if (!slot) return "Loading...";
        const date = new Date(slot.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        return `${date}`;
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto bg-gray-50 p-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                    My Sessions
                </h1>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">
                            Loading bookings...
                        </span>
                    </div>
                ) : bookings.length === 0 ? (
                    <p className="text-gray-500">
                        You don’t have any bookings yet.
                    </p>
                ) : (
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                        <table className="w-full">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600 w-10">
                                        #
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                        Mentor
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                        Date
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                        Time
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                        Payment
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking, index) => {
                                    const mentor = mentors[booking.mentorId];
                                    const slot = slots[booking.slotId];
                                    return (
                                        <tr
                                            key={booking._id}
                                            className={
                                                index % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                            }
                                        >
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {index + 1}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {mentor ? (
                                                    <Link
                                                        to={`/mentor?id=${mentor.userId._id}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {
                                                            mentor.userId
                                                                .firstName
                                                        }{" "}
                                                        {mentor.userId.lastName}
                                                    </Link>
                                                ) : (
                                                    "Loading..."
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {formatSlot(slot)}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {`${slot.startTime} - ${slot.endTime}`}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                ${booking.payment}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {booking.isConfirmed
                                                    ? "Confirmed"
                                                    : "Pending"}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                <button
                                                    onClick={() =>
                                                        openCancelModal(booking)
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {showCancelModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="absolute inset-0 bg-black opacity-40"></div>
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 z-10">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                    <h3 className="font-medium text-lg text-gray-900">
                                        Cancel Booking
                                    </h3>
                                </div>
                                <button
                                    onClick={closeCancelModal}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-6 py-4">
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to cancel this
                                    booking?
                                </p>
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        onClick={closeCancelModal}
                                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={handleCancelBooking}
                                        disabled={cancelLoading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        {cancelLoading
                                            ? "Cancelling..."
                                            : "Yes, Cancel"}
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

export default Sessions;
