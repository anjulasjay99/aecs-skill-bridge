/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
    SEARCH_SERVICE,
    AVAIL_SERVICE,
    BOOKING_SERVICE,
} from "../environments/env";
import {
    UserCircle2,
    Briefcase,
    Layers,
    BadgeCheck,
    Calendar,
    Star,
    MessageSquare,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    DollarSign,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Slot {
    _id: string;
    date: string; // "YYYY-MM-DD"
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    isAvailable: boolean;
    isBooked: boolean;
}

interface Mentor {
    _id: string; // mentor id
    userId?: {
        _id?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    designation?: string;
    bio?: string;
    domains?: string[];
    yearsOfExperience?: number;
    hourlyRate?: number;
    badges?: string[];
    createdAt?: string;
}

const parseDurationHours = (start: string, end: string) => {
    // supports HH:mm
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    const hours = Math.max(1, mins / 60);
    return hours;
};

const Mentor = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mentorIdFromQuery = searchParams.get("id");

    const [mentor, setMentor] = useState<Mentor | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loadingMentor, setLoadingMentor] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(true);

    const [activeTab, setActiveTab] = useState<"slots" | "about" | "reviews">(
        "slots"
    );

    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [showBookingPopup, setShowBookingPopup] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);

    // 1) Fetch mentor details (expects mentor id in query param)
    useEffect(() => {
        const fetchMentor = async () => {
            if (!mentorIdFromQuery) return;
            setLoadingMentor(true);
            try {
                // ✅ correct endpoint (singular)
                const res = await axios.get(
                    `${SEARCH_SERVICE}/mentors/${mentorIdFromQuery}`
                );
                setMentor(res.data?.mentor || null);
            } catch (err) {
                console.error("Error fetching mentor details:", err);
                setMentor(null);
            } finally {
                setLoadingMentor(false);
            }
        };
        fetchMentor();
    }, [mentorIdFromQuery]);

    // 2) Fetch availability, then check bookings per slot
    useEffect(() => {
        const fetchSlots = async (mentorId: string) => {
            setLoadingSlots(true);
            try {
                const availRes = await axios.get(
                    `${AVAIL_SERVICE}/availability/${mentorId}`
                );
                const fetchedSlots: Slot[] = Array.isArray(availRes.data?.slots)
                    ? availRes.data.slots
                    : [];

                // For each slot, check if bookings exist -> then mark as booked/unavailable
                const updated = await Promise.all(
                    fetchedSlots.map(async (slot) => {
                        try {
                            const bookingRes = await axios.get(
                                `${BOOKING_SERVICE}/bookings`,
                                {
                                    params: { slotId: slot._id },
                                }
                            );
                            const data = bookingRes.data;
                            const bookingsArr = Array.isArray(data)
                                ? data
                                : Array.isArray(data?.bookings)
                                ? data.bookings
                                : [];
                            const hasBooking = bookingsArr.length > 0;
                            return {
                                ...slot,
                                isBooked: hasBooking,
                                isAvailable: slot.isAvailable && !hasBooking,
                            };
                        } catch (e) {
                            // if booking check fails, fall back to slot flags
                            return slot;
                        }
                    })
                );

                setSlots(updated);
            } catch (err) {
                console.error("Error fetching slots:", err);
                setSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        if (mentorIdFromQuery) {
            // ✅ use mentor._id for availability
            fetchSlots(mentorIdFromQuery);
        }
    }, [mentorIdFromQuery]);

    const joinedDate = useMemo(
        () =>
            mentor?.createdAt
                ? new Date(mentor.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                  })
                : "N/A",
        [mentor?.createdAt]
    );

    const openMessages = () => {
        navigate(`/messages?userId=${mentor.userId?._id}`);
    };

    const handleBookClick = (slot: Slot) => {
        setSelectedSlot(slot);
        setShowBookingPopup(true);
    };

    const handleProceedBooking = async () => {
        if (!mentor || !selectedSlot) return;

        try {
            setBookingLoading(true);

            // mentee from localStorage
            const userData = localStorage.getItem("user");
            const menteeId = userData ? JSON.parse(userData)?.user?._id : null;
            if (!menteeId) {
                alert("User not logged in or mentee ID missing.");
                return;
            }

            const duration = parseDurationHours(
                selectedSlot.startTime,
                selectedSlot.endTime
            );
            const payment = (mentor.hourlyRate || 0) * duration;

            const payload = {
                mentorId: mentor.userId?._id, // mentor id
                menteeId, // from localStorage
                slotId: selectedSlot._id, // selected slot
                payment, // computed
                isConfirmed: false,
            };

            const res = await axios.post(
                `${BOOKING_SERVICE}/bookings`,
                payload
            );
            if (res.status === 200 || res.status === 201) {
                alert("✅ Booking placed successfully!");
                setShowBookingPopup(false);

                // reflect booked state in current list without refetch
                setSlots((prev) =>
                    prev.map((s) =>
                        s._id === selectedSlot._id
                            ? { ...s, isBooked: true, isAvailable: false }
                            : s
                    )
                );
            } else {
                alert("⚠️ Booking failed. Please try again.");
            }
        } catch (err) {
            console.error("Error creating booking:", err);
            alert("❌ Failed to create booking.");
        } finally {
            setBookingLoading(false);
        }
    };

    // ---------- UI ----------
    if (loadingMentor) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!mentor) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-500">
                Mentor not found.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-8 grid grid-cols-1 gap-6">
                {/* Header */}
                <div className="flex items-start gap-8">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserCircle2 className="w-20 h-20 text-gray-400" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-semibold text-gray-800">
                            {mentor.userId?.firstName} {mentor.userId?.lastName}
                        </h1>
                        <p className="text-gray-500 text-lg">
                            {mentor.designation}
                        </p>
                        <p className="text-gray-600 text-sm max-w-xl">
                            {mentor.bio}
                        </p>
                        <div className="mt-3">
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                onClick={() => openMessages()}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Message
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 flex gap-6 mt-6">
                    {["slots", "about", "reviews"].map((tab) => (
                        <button
                            key={tab}
                            className={`pb-2 text-sm font-medium ${
                                activeTab === tab
                                    ? "border-b-2 border-blue-600 text-blue-600"
                                    : "text-gray-600 hover:text-blue-600"
                            }`}
                            onClick={() => setActiveTab(tab as any)}
                        >
                            {tab === "slots"
                                ? "Available Slots"
                                : tab === "about"
                                ? "About"
                                : "Reviews"}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="mt-4">
                    {/* Slots */}
                    {activeTab === "slots" && (
                        <div className="grid grid-cols-1 gap-4">
                            {loadingSlots ? (
                                <div className="flex justify-center items-center h-32">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                                </div>
                            ) : slots.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {slots.map((slot) => {
                                        const dateFormatted = new Date(
                                            slot.date
                                        ).toLocaleDateString("en-US", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                        });
                                        const isFree =
                                            slot.isAvailable && !slot.isBooked;

                                        return (
                                            <div
                                                key={slot._id}
                                                className="flex justify-between items-center border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
                                            >
                                                <div className="flex flex-col text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-600" />
                                                        <span className="font-medium">
                                                            {dateFormatted}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 text-gray-500" />
                                                        {slot.startTime} -{" "}
                                                        {slot.endTime}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {isFree ? (
                                                        <span className="flex items-center text-green-600 text-sm gap-1">
                                                            <CheckCircle2 className="w-4 h-4" />{" "}
                                                            Available
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-red-500 text-sm gap-1">
                                                            <XCircle className="w-4 h-4" />{" "}
                                                            Unavailable
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            isFree &&
                                                            handleBookClick(
                                                                slot
                                                            )
                                                        }
                                                        disabled={!isFree}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                                            isFree
                                                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                    >
                                                        Book
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">
                                    No available slots found.
                                </p>
                            )}
                        </div>
                    )}

                    {/* About */}
                    {activeTab === "about" && (
                        <div className="grid grid-cols-1 gap-3">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                About
                            </h3>
                            <div className="text-gray-700">
                                <p className="mb-2 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-500" />
                                    <span>
                                        Designation: {mentor.designation ?? "—"}
                                    </span>
                                </p>

                                <p className="mb-2 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-gray-500" />
                                    <span>
                                        Domains:{" "}
                                        {mentor.domains?.length
                                            ? mentor.domains.join(", ")
                                            : "—"}
                                    </span>
                                </p>

                                <p className="mb-2 flex items-center gap-2">
                                    <BadgeCheck className="w-4 h-4 text-gray-500" />
                                    <span>
                                        Badges:{" "}
                                        {mentor.badges?.length
                                            ? mentor.badges.join(", ")
                                            : "—"}
                                    </span>
                                </p>

                                <p className="mb-2 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-gray-500" />
                                    <span>
                                        Experience:{" "}
                                        {mentor.yearsOfExperience ?? "—"} years
                                    </span>
                                </p>

                                <p className="mb-2 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                    <span>
                                        Hourly Rate:{" "}
                                        {mentor.hourlyRate
                                            ? `$${mentor.hourlyRate}/hr`
                                            : "—"}
                                    </span>
                                </p>

                                <p className="mb-2 text-gray-500 text-sm">
                                    Joined: {joinedDate}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    {activeTab === "reviews" && (
                        <div className="grid grid-cols-1 gap-3">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Reviews
                            </h3>
                            <div className="flex flex-col gap-4">
                                {[
                                    {
                                        name: "John Doe",
                                        rating: 5,
                                        text: "Great mentor, really helpful!",
                                    },
                                    {
                                        name: "Sarah Kim",
                                        rating: 4,
                                        text: "Very patient and insightful.",
                                    },
                                    {
                                        name: "Liam Patel",
                                        rating: 5,
                                        text: "Loved the session!",
                                    },
                                ].map((review, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-medium text-gray-800">
                                                {review.name}
                                            </h4>
                                            <div className="flex">
                                                {Array.from({
                                                    length: review.rating,
                                                }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className="w-4 h-4 text-yellow-500 fill-yellow-400"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {review.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Popup */}
            {showBookingPopup && selectedSlot && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-96 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowBookingPopup(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Confirm Booking
                        </h3>

                        <p className="text-sm text-gray-600 mb-2">
                            <Calendar className="inline w-4 h-4 text-blue-600 mr-1" />
                            Date:{" "}
                            {new Date(selectedSlot.date).toLocaleDateString(
                                "en-US"
                            )}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            <Clock className="inline w-4 h-4 text-blue-600 mr-1" />
                            Time: {selectedSlot.startTime} -{" "}
                            {selectedSlot.endTime}
                        </p>

                        <p className="text-sm text-gray-700 mt-3">
                            <DollarSign className="inline w-4 h-4 text-green-600 mr-1" />
                            Total Payment: $
                            {(() => {
                                const duration = parseDurationHours(
                                    selectedSlot.startTime,
                                    selectedSlot.endTime
                                );
                                return (mentor.hourlyRate || 0) * duration;
                            })()}
                        </p>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleProceedBooking}
                                disabled={bookingLoading}
                                className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                                    bookingLoading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {bookingLoading ? "Processing..." : "Proceed"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mentor;
