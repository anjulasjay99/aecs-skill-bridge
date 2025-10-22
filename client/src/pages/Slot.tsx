/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../environments/env";
import {
    Loader2,
    Calendar,
    Clock,
    UserCircle2,
    Upload,
    Trash2,
    Download,
    X,
    MessageSquare,
} from "lucide-react";

interface Slot {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    mentorId: string;
    menteeId: string;
    bookingId: string;
}

interface Mentee {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface FileItem {
    _id: string;
    fileName: string;
    fileType: string;
    url: string;
    mentorId: string;
    menteeId: string;
    createdAt: string;
}

const Slot = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const slotId = searchParams.get("slotId");

    const [slot, setSlot] = useState<Slot | null>(null);
    const [mentee, setMentee] = useState<Mentee | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [uploadPopup, setUploadPopup] = useState(false);
    const [fileName, setFileName] = useState("");
    const [fileBase64, setFileBase64] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const userData = localStorage.getItem("user");
    const loggedMentorId = userData ? JSON.parse(userData)?.user?._id : null;

    useEffect(() => {
        const fetchData = async () => {
            if (!slotId) return;
            setLoading(true);
            try {
                // 1️⃣ Fetch slot
                const slotRes = await axios.get(
                    `${API_BASE_URL}/availability/slots/${slotId}`
                );
                const slotData = slotRes.data?.slot;
                setSlot(slotData);

                // 2️⃣ Fetch mentee details if booking exists
                if (slotData?.bookingId) {
                    const bookingRes = await axios.get(
                        `${API_BASE_URL}/bookings/${slotData.bookingId}`
                    );
                    const booking = bookingRes.data?.booking;
                    if (booking?.menteeId) {
                        const menteeRes = await axios.get(
                            `${API_BASE_URL}/users/${booking.menteeId}`
                        );
                        const userData =
                            menteeRes.data?.user ||
                            menteeRes.data?.mentee ||
                            menteeRes.data;
                        setMentee(userData);
                    }
                }

                // 3️⃣ Fetch files for the slot
                const filesRes = await axios.get(
                    `${API_BASE_URL}/files/${slotId}`
                );
                setFiles(
                    Array.isArray(filesRes.data?.files)
                        ? filesRes.data.files
                        : [filesRes.data?.files]
                );
            } catch (err) {
                console.error("Error fetching slot data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slotId]);

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleFileSelect = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            alert("❌ File exceeds 10MB limit.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setFileBase64(result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (
            !fileName ||
            !fileBase64 ||
            !slot ||
            !mentee?._id ||
            !loggedMentorId
        ) {
            alert("Please provide file name and select a file.");
            return;
        }
        setUploading(true);
        try {
            const payload = {
                mentorId: loggedMentorId,
                menteeId: mentee._id,
                slotId: slot._id,
                fileName,
                base64: fileBase64,
            };
            const res = await axios.post(`${API_BASE_URL}/files`, payload);
            if (res.status === 200 || res.status === 201) {
                alert("✅ File uploaded successfully!");
                setUploadPopup(false);
                setFileName("");
                setFileBase64(null);
                const filesRes = await axios.get(
                    `${API_BASE_URL}/files/${slot._id}`
                );
                setFiles(
                    Array.isArray(filesRes.data?.files)
                        ? filesRes.data.files
                        : [filesRes.data?.files]
                );
            }
        } catch (err) {
            console.error("Upload failed:", err);
            alert("❌ Failed to upload file.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!window.confirm("Are you sure you want to delete this file?"))
            return;
        try {
            await axios.delete(`${API_BASE_URL}/files/${fileId}`);
            setFiles((prev) => prev.filter((f) => f._id !== fileId));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleDownload = (file: FileItem) => {
        const link = document.createElement("a");
        link.href = file.url;
        link.download = file.fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openMessages = () => {
        if (mentee?._id) navigate(`/messages?userId=${mentee._id}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!slot || !mentee) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-500">
                Slot not found.
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
                            Session with {mentee.firstName} {mentee.lastName}
                        </h1>
                        <p className="text-gray-500 text-sm">{mentee.email}</p>
                        <div className="flex items-center gap-3 text-sm mt-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(slot.date).toLocaleDateString("en-US")}
                            <Clock className="w-4 h-4 ml-3" />
                            {slot.startTime} - {slot.endTime}
                        </div>
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

                {/* Files Section */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Shared Files
                        </h3>
                        <button
                            onClick={() => setUploadPopup(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                            <Upload className="w-4 h-4" /> Upload File
                        </button>
                    </div>

                    {files.length > 0 ? (
                        <div className="grid gap-3">
                            {files.map((file) => (
                                <div
                                    key={file._id}
                                    className="flex justify-between items-center border border-gray-200 rounded-lg p-3 bg-gray-50"
                                >
                                    <div className="flex flex-col">
                                        <p className="font-medium text-gray-700">
                                            {file.fileName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(
                                                file.createdAt
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleDownload(file)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(file._id)
                                            }
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            No files uploaded yet.
                        </p>
                    )}
                </div>
            </div>

            {/* Upload Popup */}
            {uploadPopup && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-96 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            onClick={() => setUploadPopup(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Upload File
                        </h3>

                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Enter file name"
                            className="w-full border rounded-md px-3 py-2 mb-3 text-sm"
                        />

                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 cursor-pointer hover:border-blue-400"
                            onDrop={handleFileDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() =>
                                document.getElementById("fileInput")?.click()
                            }
                        >
                            {fileBase64 ? (
                                <p>✅ File ready for upload</p>
                            ) : (
                                <p>
                                    Drag & drop or click to select file (max
                                    10MB)
                                </p>
                            )}
                            <input
                                type="file"
                                id="fileInput"
                                hidden
                                onChange={(e) =>
                                    e.target.files &&
                                    handleFileSelect(e.target.files[0])
                                }
                            />
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                                    uploading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {uploading ? "Uploading..." : "Upload"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Slot;
