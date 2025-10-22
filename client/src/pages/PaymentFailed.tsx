import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

const PaymentFailed = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Optionally clear any temporary booking data or session info
        localStorage.removeItem("pendingBooking");
    }, []);

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-xl shadow-md flex flex-col items-center max-w-md w-full">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                    Payment Failed
                </h1>
                <p className="text-gray-600 text-center mb-6">
                    Unfortunately, your payment could not be processed.
                    <br />
                    Please try again or use a different payment method.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)} // Go back to previous page
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailed;
