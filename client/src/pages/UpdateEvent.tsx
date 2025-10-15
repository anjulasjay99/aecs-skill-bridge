import { useState, useRef, useEffect, ChangeEvent } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Heart, Check, ChevronDown, Camera, X, Loader } from "lucide-react";
import axios from "axios";
import { Bounce, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { APIURL } from '../environments/env';

// Define types
interface FormDataType {
    title: string;
    description: string;
    about: string;
    date: string;
    time: string;
    duration: number;
    location: string;
    capacity: number;
    category: string;
    ticketPrice: number;
}

interface ErrorsType {
    [key: string]: string | null;
}

const UpdateEvent = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    // Form state
    const [formData, setFormData] = useState<FormDataType>({
        title: "",
        description: "",
        about: "",
        date: "",
        time: "",
        duration: 0,
        location: "",
        capacity: 0,
        category: "",
        ticketPrice: 0,
    });

    // State for poster image
    const [poster, setPoster] = useState<string | null>(null);
    const [posterPreview, setPosterPreview] = useState<string | null>(null);

    // State for payment type
    const [isPaid, setIsPaid] = useState<boolean>(true);

    // State for terms agreement and form validation
    const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
    const [errors, setErrors] = useState<ErrorsType>({});
    // const [showSuccess, setShowSuccess] = useState<boolean>(false);

    // State for dropdowns
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] =
        useState<boolean>(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] =
        useState<boolean>(false);

    // Refs for file input and dropdowns
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropAreaRef = useRef<HTMLDivElement>(null);
    const locationDropdownRef = useRef<HTMLDivElement>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    // Location and category options
    const locations: string[] = [
        "Colombo",
        "Kandy",
        "Galle",
        "Jaffna",
        "Negombo",
        "Matara",
    ];
    const categories: string[] = [
        "Music",
        "Arts",
        "Sports",
        "Food",
        "Business",
        "Technology",
        "Education",
    ];

    // Handle input changes
    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        if (name === "description" && countWords(value) > 30) {
            return; // Don't update if exceeding word limit
        }

        // For number fields, ensure only numbers are entered
        if (["duration", "capacity", "ticketPrice"].includes(name)) {
            if (value === "" || /^\d+$/.test(value)) {
                setFormData({
                    ...formData,
                    [name]: value,
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }

        // Clear error for this field if it exists
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null,
            });
        }
    };

    // Count words in text
    const countWords = (text: string): number => {
        return text
            .trim()
            .split(/\s+/)
            .filter((word) => word !== "").length;
    };

    // Handle poster image upload
    const handlePosterUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // Handle file upload and validation
    const handleFileUpload = (file: File) => {
        if (!file) return;

        // Check if file is an image
        if (!file.type.startsWith("image/")) {
            setErrors({
                ...errors,
                poster: "Please upload an image file",
            });
            return;
        }

        // Clear error if exists
        if (errors.poster) {
            setErrors({
                ...errors,
                poster: null,
            });
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            // The result attribute contains the data as a base64 encoded string
            const base64String = reader.result as string;

            // Set both the poster and posterPreview to the base64 string
            setPoster(base64String);
            setPosterPreview(base64String);
        };
        reader.readAsDataURL(file);
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropAreaRef.current) {
            dropAreaRef.current.classList.add("border-blue-500");
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropAreaRef.current) {
            dropAreaRef.current.classList.remove("border-blue-500");
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropAreaRef.current) {
            dropAreaRef.current.classList.remove("border-blue-500");
        }

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    // Remove poster image
    const handleRemovePoster = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPoster(null);
        setPosterPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Handle select location
    const handleSelectLocation = (location: string) => {
        setFormData({
            ...formData,
            location,
        });
        setIsLocationDropdownOpen(false);

        // Clear error for this field if it exists
        if (errors.location) {
            setErrors({
                ...errors,
                location: null,
            });
        }
    };

    // Handle select category
    const handleSelectCategory = (category: string) => {
        setFormData({
            ...formData,
            category,
        });
        setIsCategoryDropdownOpen(false);

        // Clear error for this field if it exists
        if (errors.category) {
            setErrors({
                ...errors,
                category: null,
            });
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        // Validate form
        const newErrors: ErrorsType = {};

        // Check required fields
        if (!poster) newErrors.poster = "Poster is required";
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim())
            newErrors.description = "Description is required";
        if (!formData.about.trim()) newErrors.about = "About is required";
        if (!formData.date) newErrors.date = "Date is required";
        if (!formData.time) newErrors.time = "Time is required";
        if (!formData.duration) newErrors.duration = "Duration is required";
        if (!formData.location) newErrors.location = "Location is required";
        if (!formData.capacity) newErrors.capacity = "Capacity is required";
        if (!formData.category) newErrors.category = "Category is required";
        if (isPaid && !formData.ticketPrice)
            newErrors.ticketPrice = "Ticket price is required";

        // Set errors if any
        setErrors(newErrors);

        // If no errors, show success
        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);
            // setShowSuccess(true);
            // // Hide success message after 3 seconds
            // setTimeout(() => {
            //   setShowSuccess(false);
            // }, 3000);
            const user = JSON.parse(localStorage.getItem("user")!);
            axios
                .put(`${APIURL}/api/events/${id}`, {
                    userId: user.id,
                    poster,
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    about: formData.about.trim(),
                    date: formData.date,
                    time: formData.time,
                    duration: formData.duration,
                    location: formData.location,
                    capacity: formData.capacity,
                    category: formData.category,
                    ticketPrice: formData.ticketPrice,
                    isFreeEntry: !isPaid,
                })
                .then(() => {
                    toast.success("Event has been updated", {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                        transition: Bounce,
                    });
                })
                .catch((err) => {
                    console.log(err);
                    toast.error("An error occurred", {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                        transition: Bounce,
                    });
                })
                .finally(() => {
                    setIsSubmitting(false);
                });
        }
    };

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                locationDropdownRef.current &&
                !locationDropdownRef.current.contains(event.target as Node)
            ) {
                setIsLocationDropdownOpen(false);
            }
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(event.target as Node)
            ) {
                setIsCategoryDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Format time for display
    const formatTime = (timeString: string): string => {
        if (!timeString) return "Time";
        try {
            const dummyDate = new Date(`2000-01-01T${timeString}`);
            return dummyDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
            });
        } catch (e: unknown) {
            console.log(e);
            return "Time";
        }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        if (!dateString) return "Date";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
            });
        } catch (e: unknown) {
            console.log(e);
            return "Date";
        }
    };

    const fetchEvent = () => {
        axios
            .get(`${APIURL}/api/events/${id}`)
            .then((res) => {
                console.log(res);
                setFormData({
                    ...res.data,
                });
                setPoster(res.data.poster);
                setPosterPreview(res.data.poster);
                setIsPaid(!res.data.isFreeEntry);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            })
            .catch((err) => {
                console.log(err);
                toast.error("An error occurred", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    transition: Bounce,
                });

                navigate("/events");
            });
    };

    useEffect(() => {
        if (id) {
            fetchEvent();
        } else {
            navigate("/events");
        }
    }, [id]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
            />
            <main className="flex-1 py-8 px-6 md:px-10 max-w-7xl mx-auto w-full grid md:grid-cols-3 gap-6">
                {/* Left side - Form */}
                <div className="md:col-span-2 space-y-6">
                    {/* Success Alert */}
                    {/* {showSuccess && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2" />
                <span>Event created successfully!</span>
              </div>
            </div>
          )} */}

                    {/* Basic Info Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-medium">
                                    Basic Info
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Please enter basic info
                                </p>
                            </div>
                            <div className="text-sm text-gray-400">
                                Step 1 of 3
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block mb-2 font-medium">
                                    Poster{" "}
                                    {errors.poster && (
                                        <span className="text-red-500 text-sm ml-1">
                                            {errors.poster}
                                        </span>
                                    )}
                                </label>
                                <div
                                    ref={dropAreaRef}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`border ${
                                        errors.poster
                                            ? "border-red-500"
                                            : "border-gray-200"
                                    } rounded-lg h-36 flex flex-col items-center justify-center text-gray-400 bg-gray-50 relative cursor-pointer transition hover:bg-gray-100 md:w-1/2`}
                                >
                                    {posterPreview ? (
                                        <>
                                            <img
                                                src={posterPreview}
                                                alt="Event poster"
                                                className="h-full w-full object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemovePoster}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 border-2 border-gray-300 rounded-full flex items-center justify-center mb-2">
                                                <Camera className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <p className="text-sm">
                                                Drag & Drop or Upload an Image
                                            </p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handlePosterUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Title{" "}
                                    {errors.title && (
                                        <span className="text-red-500 text-sm ml-1">
                                            {errors.title}
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Title"
                                    className={`w-full p-3 border ${
                                        errors.title
                                            ? "border-red-500"
                                            : "border-gray-200"
                                    } rounded-lg bg-gray-50`}
                                />
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Description{" "}
                                    {errors.description && (
                                        <span className="text-red-500 text-sm ml-1">
                                            {errors.description}
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Description (max 30 words)"
                                        rows={3}
                                        className={`w-full p-3 border ${
                                            errors.description
                                                ? "border-red-500"
                                                : "border-gray-200"
                                        } rounded-lg bg-gray-50`}
                                    />
                                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                        {countWords(formData.description)}/30
                                        words
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    About this event{" "}
                                    {errors.about && (
                                        <span className="text-red-500 text-sm ml-1">
                                            {errors.about}
                                        </span>
                                    )}
                                </label>
                                <textarea
                                    name="about"
                                    value={formData.about}
                                    onChange={handleInputChange}
                                    placeholder="About this event"
                                    rows={3}
                                    className={`w-full p-3 border ${
                                        errors.about
                                            ? "border-red-500"
                                            : "border-gray-200"
                                    } rounded-lg bg-gray-50`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Date{" "}
                                        {errors.date && (
                                            <span className="text-red-500 text-sm ml-1">
                                                {errors.date}
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className={`w-full p-3 border ${
                                            errors.date
                                                ? "border-red-500"
                                                : "border-gray-200"
                                        } rounded-lg bg-gray-50`}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Time{" "}
                                        {errors.time && (
                                            <span className="text-red-500 text-sm ml-1">
                                                {errors.time}
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="time"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleInputChange}
                                        className={`w-full p-3 border ${
                                            errors.time
                                                ? "border-red-500"
                                                : "border-gray-200"
                                        } rounded-lg bg-gray-50`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Duration (hours){" "}
                                        {errors.duration && (
                                            <span className="text-red-500 text-sm ml-1">
                                                {errors.duration}
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        placeholder="Duration (hours)"
                                        className={`w-full p-3 border ${
                                            errors.duration
                                                ? "border-red-500"
                                                : "border-gray-200"
                                        } rounded-lg bg-gray-50`}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Location{" "}
                                        {errors.location && (
                                            <span className="text-red-500 text-sm ml-1">
                                                {errors.location}
                                            </span>
                                        )}
                                    </label>
                                    <div
                                        className="relative"
                                        ref={locationDropdownRef}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsLocationDropdownOpen(
                                                    !isLocationDropdownOpen
                                                )
                                            }
                                            className={`w-full p-3 border ${
                                                errors.location
                                                    ? "border-red-500"
                                                    : "border-gray-200"
                                            } rounded-lg bg-gray-50 text-left flex justify-between items-center`}
                                        >
                                            <span
                                                className={
                                                    formData.location
                                                        ? "text-gray-900"
                                                        : "text-gray-400"
                                                }
                                            >
                                                {formData.location ||
                                                    "Select Location"}
                                            </span>
                                            <ChevronDown size={16} />
                                        </button>
                                        {isLocationDropdownOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                                                {locations.map((location) => (
                                                    <div
                                                        key={location}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                                        onClick={() =>
                                                            handleSelectLocation(
                                                                location
                                                            )
                                                        }
                                                    >
                                                        {location}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Capacity{" "}
                                        {errors.capacity && (
                                            <span className="text-red-500 text-sm ml-1">
                                                {errors.capacity}
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleInputChange}
                                        placeholder="Capacity"
                                        className={`w-full p-3 border ${
                                            errors.capacity
                                                ? "border-red-500"
                                                : "border-gray-200"
                                        } rounded-lg bg-gray-50`}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Category{" "}
                                        {errors.category && (
                                            <span className="text-red-500 text-sm ml-1">
                                                {errors.category}
                                            </span>
                                        )}
                                    </label>
                                    <div
                                        className="relative"
                                        ref={categoryDropdownRef}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsCategoryDropdownOpen(
                                                    !isCategoryDropdownOpen
                                                )
                                            }
                                            className={`w-full p-3 border ${
                                                errors.category
                                                    ? "border-red-500"
                                                    : "border-gray-200"
                                            } rounded-lg bg-gray-50 text-left flex justify-between items-center`}
                                        >
                                            <span
                                                className={
                                                    formData.category
                                                        ? "text-gray-900"
                                                        : "text-gray-400"
                                                }
                                            >
                                                {formData.category ||
                                                    "Select Category"}
                                            </span>
                                            <ChevronDown size={16} />
                                        </button>
                                        {isCategoryDropdownOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                                                {categories.map((category) => (
                                                    <div
                                                        key={category}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                                        onClick={() =>
                                                            handleSelectCategory(
                                                                category
                                                            )
                                                        }
                                                    >
                                                        {category}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Pricing Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-medium">
                                    Ticket Pricing
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Please enter pricing info
                                </p>
                            </div>
                            <div className="text-sm text-gray-400">
                                Step 2 of 3
                            </div>
                        </div>

                        <RadioGroup.Root
                            value={isPaid ? "paid" : "free"}
                            onValueChange={(value: string) =>
                                setIsPaid(value === "paid")
                            }
                            className="space-y-4"
                        >
                            <div className="flex items-center">
                                <RadioGroup.Item
                                    id="paid"
                                    value="paid"
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                                        isPaid ? "border-blue-500" : ""
                                    }`}
                                >
                                    <RadioGroup.Indicator className="w-3 h-3 rounded-full bg-blue-500" />
                                </RadioGroup.Item>
                                <label
                                    htmlFor="paid"
                                    className={`${
                                        isPaid
                                            ? "font-medium text-blue-500"
                                            : ""
                                    }`}
                                >
                                    Paid
                                </label>
                            </div>

                            {isPaid && (
                                <div className="pl-7">
                                    <label className="block mb-2 text-sm">
                                        Ticket Price (LKR){" "}
                                        {errors.ticketPrice && (
                                            <span className="text-red-500 text-sm ml-1">
                                                {errors.ticketPrice}
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        name="ticketPrice"
                                        value={formData.ticketPrice}
                                        onChange={handleInputChange}
                                        placeholder="Price"
                                        className={`w-full p-3 border ${
                                            errors.ticketPrice
                                                ? "border-red-500"
                                                : "border-gray-200"
                                        } rounded-lg bg-gray-50`}
                                    />
                                </div>
                            )}

                            <div className="flex items-center">
                                <RadioGroup.Item
                                    id="free"
                                    value="free"
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                                        !isPaid ? "border-blue-500" : ""
                                    }`}
                                    onClick={() => setIsPaid(false)}
                                >
                                    <RadioGroup.Indicator className="w-3 h-3 rounded-full bg-blue-500" />
                                </RadioGroup.Item>
                                <label
                                    htmlFor="free"
                                    className={`${
                                        !isPaid
                                            ? "font-medium text-blue-500"
                                            : ""
                                    }`}
                                >
                                    Free Entry
                                </label>
                            </div>
                        </RadioGroup.Root>
                    </div>

                    {/* Confirmation Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-medium">
                                    Confirmation
                                </h2>
                                <p className="text-sm text-gray-400">
                                    We are getting to the end, just few clicks
                                    and your event is ready!
                                </p>
                            </div>
                            <div className="text-sm text-gray-400">
                                Step 3 of 3
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <Checkbox.Root
                                    id="terms"
                                    checked={agreeToTerms}
                                    onCheckedChange={(
                                        checked: boolean | "indeterminate"
                                    ) => setAgreeToTerms(checked === true)}
                                    className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center"
                                >
                                    <Checkbox.Indicator>
                                        <Check size={16} />
                                    </Checkbox.Indicator>
                                </Checkbox.Root>
                                <label htmlFor="terms" className="text-sm">
                                    I agree with our terms and conditions and
                                    privacy policy.
                                </label>
                            </div>
                            <button
                                onClick={handleSubmit}
                                className={`${
                                    agreeToTerms
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-blue-200 text-gray-400"
                                } font-medium py-3 px-6 rounded-lg w-auto transition flex items-center justify-center`}
                                disabled={!agreeToTerms || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Confirm"
                                )}
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-start space-x-4">
                                <div className="text-gray-500">
                                    <Heart size={24} />
                                </div>
                                <div>
                                    <h3 className="font-medium">
                                        All your data are safe
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        We are using the most advanced security
                                        to provide you the best experience ever
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side - Event Summary */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                        <h2 className="text-lg font-medium mb-2">
                            Event Summary
                        </h2>
                        <p className="text-sm text-gray-400 mb-4">
                            Summary of the event
                        </p>

                        <div className="flex items-start space-x-4 mb-6">
                            <div className="rounded-lg overflow-hidden w-20 h-20 bg-gray-200 flex-shrink-0">
                                {posterPreview ? (
                                    <img
                                        src={posterPreview}
                                        alt="Event poster"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">
                                    {formData.title || "Event Title"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {formData.date
                                        ? formatDate(formData.date)
                                        : "Date"}{" "}
                                    {formData.time
                                        ? formatTime(formData.time)
                                        : "Time"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Duration</span>
                                <span className="font-medium">
                                    {formData.duration
                                        ? `${formData.duration} hours`
                                        : "0 hours"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Location</span>
                                <span className="font-medium">
                                    {formData.location || "Not specified"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Capacity</span>
                                <span className="font-medium">
                                    {formData.capacity || "0"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Category</span>
                                <span className="font-medium">
                                    {formData.category || "Not specified"}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <span className="font-medium">Ticket Price</span>
                            <span className="font-bold text-lg">
                                {isPaid
                                    ? `LKR ${
                                          formData.ticketPrice
                                              ? parseFloat(
                                                    formData.ticketPrice.toString()
                                                ).toFixed(2)
                                              : "0.00"
                                      }`
                                    : "Free"}
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UpdateEvent;
