/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../environments/env";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const token = useSelector((state: RootState) => state.user.token);
    const hasRun = useRef(false); // Prevent double execution

    useEffect(() => {
        const verifyPayment = async () => {
            if (hasRun.current) return; // Run once only
            hasRun.current = true;

            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get("session_id");
            if (!sessionId) {
                alert("Missing session ID");
                navigate("/mentee-sessions");
                return;
            }

            try {
                const res = await axios.get(
                    `${API_BASE_URL}/payments/verify-session/${sessionId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`, // Include auth token
                        },
                    }
                );

                if (res.data?.status === "success") {
                    alert("✅ Payment successful! Booking confirmed.");
                    navigate("/mentee-sessions");
                } else {
                    alert("⚠️ Payment verification failed.");
                    navigate("/mentee-sessions");
                }
            } catch (err) {
                console.error("Verification failed:", err);
                alert("❌ Could not verify payment.");
                navigate("/mentee-sessions");
            }
        };

        verifyPayment();
    }, [navigate, token]);

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                Payment Successful
            </h1>
            <p className="text-gray-600 mb-4">
                We’re confirming your booking details...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
    );
};

export default PaymentSuccess;
