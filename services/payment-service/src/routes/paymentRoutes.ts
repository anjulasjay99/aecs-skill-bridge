import express, { Request, Response } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import axios from "axios";
import { CreateSessionBody } from "../types/CreateSessionBody.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

router.post(
    "/create-session",
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const {
                mentorName,
                menteeEmail,
                sessionTitle,
                price,
                mentorId,
                menteeId,
                slotId,
            }: CreateSessionBody & {
                mentorId: string;
                menteeId: string;
                slotId: string;
            } = req.body;

            if (!menteeEmail || !mentorId || !menteeId || !slotId) {
                return res.status(400).json({
                    error: "Missing required fields in request body.",
                });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                customer_email: menteeEmail,
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: `${sessionTitle} with ${mentorName}`,
                            },
                            unit_amount: Math.round(price * 100),
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
                metadata: {
                    mentorId,
                    menteeId,
                    slotId,
                },
            });

            return res.status(200).json({ url: session.url });
        } catch (error: any) {
            console.error("❌ Stripe session error:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
);

router.get(
    "/verify-session/:id",
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const sessionId = req.params.id;
            const token = req.headers.authorization; // ✅ pass it downstream

            const session = await stripe.checkout.sessions.retrieve(sessionId);

            // If payment failed or is incomplete
            if (session.payment_status !== "paid") {
                return res.status(400).json({ status: "unpaid" });
            }

            // Get metadata stored during session creation
            const { mentorId, menteeId, slotId } = session.metadata || {};

            if (!mentorId || !menteeId || !slotId) {
                return res
                    .status(400)
                    .json({ error: "Missing metadata in Stripe session." });
            }

            // ✅ Step 1 — Create booking
            const bookingRes = await axios.post(
                `${process.env.BOOKING_SERVICE_URL}/bookings`,
                {
                    mentorId,
                    menteeId,
                    slotId,
                    payment: session.amount_total
                        ? session.amount_total / 100
                        : 0,
                    isConfirmed: false,
                    stripeSessionId: sessionId,
                },
                { headers: { Authorization: token } }
            );

            const createdBooking = bookingRes.data?.booking || bookingRes.data;

            // ✅ Step 2 — Update availability
            await axios.patch(
                `${process.env.AVAILABILITY_SERVICE_URL}/availability/${slotId}`,
                {
                    isAvailable: false,
                    isBooked: true,
                    bookingId: createdBooking._id,
                },
                { headers: { Authorization: token } }
            );

            return res.json({ status: "success", booking: createdBooking });
        } catch (error: any) {
            console.error("❌ Verify session error:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
);

export default router;
