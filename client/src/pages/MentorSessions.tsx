/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
import {
    Loader,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    X,
    AlertTriangle,
    Eye,
} from "lucide-react";
import { API_BASE_URL } from "../environments/env";
import { Link } from "react-router-dom";

interface Slot {
    _id: string;
    mentorId: string;
    date: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    isBooked: boolean;
    bookingId?: string | null;
}

interface Booking {
    _id: string;
    menteeId: string;
    isConfirmed: boolean;
    payment: number;
    createdDate: string;
    slotId: string;
}

interface Mentee {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

const MentorSessions = () => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [bookings, setBookings] = useState<Record<string, Booking | null>>(
        {}
    );
    const [mentees, setMentees] = useState<Record<string, Mentee>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmBookingId, setConfirmBookingId] = useState<string | null>(
        null
    );

    // Form
    const [editSlot, setEditSlot] = useState<Slot | null>(null);
    const [formData, setFormData] = useState({
        date: "",
        startTime: "",
        endTime: "",
    });
    const [saving, setSaving] = useState(false);

    const userData = localStorage.getItem("user");
    const mentorId = userData ? JSON.parse(userData)?.user?._id : null;

    // ---------- FETCH FUNCTIONS ----------

    const fetchSlots = async () => {
        if (!mentorId) return;
        setLoading(true);
        setError(null);
        try {
            // 1️⃣ Fetch mentor slots
            const slotRes = await axios.get(
                `${API_BASE_URL}/availability/${mentorId}`
            );
            const slotsData: Slot[] = slotRes.data?.slots || [];
            setSlots(slotsData);

            // 2️⃣ Fetch bookings for slots that have bookingId
            const bookingMap: Record<string, Booking | null> = {};
            const menteeMap: Record<string, Mentee> = {};

            for (const slot of slotsData) {
                if (!slot.bookingId) {
                    bookingMap[slot._id] = null;
                    continue;
                }

                try {
                    const bookingRes = await axios.get(
                        `${API_BASE_URL}/bookings/${slot.bookingId}`
                    );
                    const booking: Booking = bookingRes.data?.booking;
                    bookingMap[slot._id] = booking;

                    // 3️⃣ Fetch mentee details
                    if (booking?.menteeId) {
                        const userRes = await axios.get(
                            `${API_BASE_URL}/users/${booking.menteeId}`
                        );
                        const userData =
                            userRes.data?.user ||
                            userRes.data?.mentee ||
                            userRes.data;
                        menteeMap[booking.menteeId] = userData;
                    }
                } catch (err) {
                    console.error(
                        `Error loading booking for slot ${slot._id}:`,
                        err
                    );
                    bookingMap[slot._id] = null;
                }
            }

            setBookings(bookingMap);
            setMentees(menteeMap);
        } catch (err) {
            console.error(err);
            setError("Failed to load sessions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, []);

    // ---------- SLOT ACTIONS ----------

    const handleFormChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openSlotModal = (slot?: Slot) => {
        if (slot) {
            setEditSlot(slot);
            setFormData({
                date: slot.date.includes("T")
                    ? slot.date.split("T")[0]
                    : slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
            });
        } else {
            setEditSlot(null);
            setFormData({ date: "", startTime: "", endTime: "" });
        }
        setShowSlotModal(true);
    };

    const saveSlot = async () => {
        if (!formData.date || !formData.startTime || !formData.endTime) {
            alert("Please fill all fields");
            return;
        }
        setSaving(true);
        try {
            if (editSlot) {
                await axios.patch(
                    `${API_BASE_URL}/availability/${editSlot._id}`,
                    formData
                );
            } else {
                await axios.post(`${API_BASE_URL}/availability`, {
                    mentorId,
                    ...formData,
                });
            }
            setShowSlotModal(false);
            fetchSlots();
        } catch (err) {
            console.error(err);
            alert("Failed to save slot.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSlot = async (slot: Slot) => {
        const booking = bookings[slot._id];
        if (booking?.isConfirmed) {
            alert("Cannot delete a confirmed session.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this slot?"))
            return;

        try {
            await axios.delete(`${API_BASE_URL}/availability/${slot._id}`);
            fetchSlots();
        } catch (err) {
            console.error(err);
        }
    };

    // ---------- BOOKING CONFIRMATION ----------

    const openConfirmModal = (bookingId: string) => {
        setConfirmBookingId(bookingId);
        setShowConfirmModal(true);
    };

    const confirmBooking = async () => {
        if (!confirmBookingId) return;
        try {
            await axios.patch(`${API_BASE_URL}/bookings/${confirmBookingId}`, {
                isConfirmed: true,
            });
            setShowConfirmModal(false);
            setConfirmBookingId(null);
            fetchSlots();
        } catch (err) {
            console.error(err);
            alert("Failed to confirm booking.");
        }
    };

    // ---------- UI HELPERS ----------

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    // ---------- RENDER ----------

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto bg-gray-50 p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        My Sessions
                    </h1>
                    <button
                        onClick={() => openSlotModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Create Slot
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">
                            Loading sessions...
                        </span>
                    </div>
                ) : slots.length === 0 ? (
                    <p className="text-gray-500">No sessions created yet.</p>
                ) : (
                    // Table
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                        <table className="w-full border-collapse">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                        #
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                        Date
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                        Time
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                        Mentee
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map((slot, index) => {
                                    const booking = bookings[slot._id];
                                    const mentee = booking
                                        ? mentees[booking.menteeId]
                                        : null;
                                    const status = booking
                                        ? booking.isConfirmed
                                            ? "Confirmed"
                                            : "Pending"
                                        : "Available";

                                    return (
                                        <tr
                                            key={slot._id}
                                            className={`${
                                                index % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                            } hover:bg-blue-50 transition`}
                                        >
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {index + 1}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-700">
                                                {formatDate(slot.date)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-700">
                                                {slot.startTime} -{" "}
                                                {slot.endTime}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        status === "Available"
                                                            ? "bg-gray-100 text-gray-600"
                                                            : status ===
                                                              "Pending"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-green-100 text-green-700"
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-700">
                                                {mentee
                                                    ? `${mentee.firstName} ${mentee.lastName}`
                                                    : status !== "Available"
                                                    ? "Loading..."
                                                    : "—"}
                                            </td>
                                            <td className="py-3 px-4 text-sm space-x-3">
                                                {booking &&
                                                    !booking.isConfirmed && (
                                                        <button
                                                            onClick={() =>
                                                                openConfirmModal(
                                                                    booking._id
                                                                )
                                                            }
                                                            className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Confirm
                                                        </button>
                                                    )}
                                                {booking && (
                                                    <button
                                                        onClick={() => {}}
                                                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <Link
                                                            to={`/slot?slotId=${booking.slotId}`}
                                                            className="text-blue-600 hover:underline font-medium"
                                                        >
                                                            View
                                                        </Link>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        openSlotModal(slot)
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    <Edit className="w-4 h-4 inline-block mr-1" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteSlot(slot)
                                                    }
                                                    className="text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4 inline-block mr-1" />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showSlotModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="absolute inset-0 bg-black opacity-40"></div>
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 z-10">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                                <h3 className="font-medium text-lg text-gray-900">
                                    {editSlot ? "Edit Slot" : "Create Slot"}
                                </h3>
                                <button
                                    onClick={() => setShowSlotModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleFormChange}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleFormChange}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleFormChange}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex justify-end px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={saveSlot}
                                    disabled={saving}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                                        saving
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Booking Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="absolute inset-0 bg-black opacity-40"></div>
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 z-10">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 text-green-600 mr-2" />
                                    <h3 className="font-medium text-lg text-gray-900">
                                        Confirm Booking
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-6 py-4">
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to confirm this
                                    booking?
                                </p>
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        onClick={() =>
                                            setShowConfirmModal(false)
                                        }
                                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={confirmBooking}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Yes, Confirm
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

export default MentorSessions;
