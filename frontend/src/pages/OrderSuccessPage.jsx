import { useEffect, useState, useContext } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { authFetch } from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function OrderSuccessPage() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [cleared, setCleared] = useState(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Clear the cart after a successful Stripe payment
    const clearCart = async () => {
      if (!user?.userId) return;
      try {
        await authFetch(`/cart/user/${user.userId}`, { method: "DELETE" });
        setCleared(true);
      } catch (err) {
        // Not fatal—just let them know
        toast.error(err.message || "Couldn't clear your cart.");
      }
    };

    clearCart();
  }, [user]);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment successful!</h1>
        <p className="text-gray-600 mb-4">
          Thank you for your purchase. Your payment has been processed.
        </p>

        {sessionId && (
          <p className="text-sm text-gray-500 mb-6">
            Stripe session: <code className="bg-gray-100 px-1 rounded">{sessionId}</code>
          </p>
        )}

        <div className="space-y-2">
          <Link
            to="/products"
            className="inline-block w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
          >
            Continue Shopping
          </Link>
          <div>
            <Link
              to="/orders"
              className="inline-block text-blue-600 hover:underline mt-2"
            >
              View my orders
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          {cleared ? "Your cart has been cleared." : "Finalizing your order…"}
        </p>
      </div>
    </div>
  );
}