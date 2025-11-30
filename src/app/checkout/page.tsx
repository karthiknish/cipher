"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useOrders, ShippingAddress } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, Loader2, Check, CreditCard, ChevronDown } from "lucide-react";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia"];
const US_STATES = ["California", "New York", "Texas", "Florida", "Washington", "Oregon", "Arizona", "Nevada"];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, subtotal, shipping, tax, total, clearCart } = useCart();
  const { createOrder } = useOrders();
  
  const [step, setStep] = useState<"shipping" | "payment" | "confirmation">("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [shippingData, setShippingData] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if cart is empty
  if (cart.length === 0 && step !== "confirmation") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">YOUR BAG IS EMPTY</h1>
          <p className="text-gray-500 mb-10">Add some items before checking out</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
          >
            SHOP NOW
          </Link>
        </motion.div>
      </div>
    );
  }

  const validateShipping = () => {
    const newErrors: Record<string, string> = {};
    
    if (!shippingData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!shippingData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!shippingData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingData.email)) newErrors.email = "Invalid email";
    if (!shippingData.phone.trim()) newErrors.phone = "Phone is required";
    if (!shippingData.street.trim()) newErrors.street = "Address is required";
    if (!shippingData.city.trim()) newErrors.city = "City is required";
    if (!shippingData.state.trim()) newErrors.state = "State is required";
    if (!shippingData.zip.trim()) newErrors.zip = "ZIP code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors: Record<string, string> = {};
    
    if (!paymentData.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
      newErrors.cardNumber = "Invalid card number";
    }
    if (!paymentData.cardName.trim()) newErrors.cardName = "Name on card is required";
    if (!paymentData.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      newErrors.expiry = "Invalid expiry (MM/YY)";
    }
    if (!paymentData.cvv.match(/^\d{3,4}$/)) {
      newErrors.cvv = "Invalid CVV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep("payment");
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayment()) return;

    if (!user) {
      setErrors({ general: "Please log in to complete your order" });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order
      const orderItems = cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        image: item.image,
      }));

      const newOrderId = await createOrder({
        items: orderItems,
        subtotal,
        shipping,
        tax,
        total,
        status: "confirmed",
        shippingAddress: shippingData,
        paymentMethod: `**** ${paymentData.cardNumber.slice(-4)}`,
      });

      if (newOrderId) {
        setOrderId(newOrderId);
        clearCart();
        setStep("confirmation");
      } else {
        setErrors({ general: "Failed to create order. Please try again." });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setErrors({ general: "Payment failed. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
    return v.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 2) return v.slice(0, 2) + "/" + v.slice(2);
    return v;
  };

  // Confirmation Page
  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-green-100 mx-auto mb-8 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">ORDER CONFIRMED</h1>
            <p className="text-gray-500 mb-2">Thank you for your purchase</p>
            <p className="text-sm text-gray-400 mb-8">Order #{orderId}</p>

            <div className="bg-gray-50 p-8 mb-8 text-left">
              <h3 className="text-sm tracking-wider text-gray-500 mb-4">SHIPPING TO</h3>
              <p className="font-medium">{shippingData.firstName} {shippingData.lastName}</p>
              <p className="text-gray-600">{shippingData.street}</p>
              <p className="text-gray-600">{shippingData.city}, {shippingData.state} {shippingData.zip}</p>
              <p className="text-gray-600">{shippingData.country}</p>
            </div>

            <p className="text-gray-500 mb-8">
              A confirmation email has been sent to <span className="font-medium">{shippingData.email}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
              >
                CONTINUE SHOPPING
              </Link>
              <Link
                href="/orders"
                className="border border-black px-10 py-4 text-sm tracking-wider font-medium hover:bg-black hover:text-white transition"
              >
                VIEW ORDERS
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition">
            <ArrowLeft className="w-4 h-4" /> Back to Bag
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Form */}
          <div className="lg:col-span-7">
            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-12">
              <div className={`flex items-center gap-2 ${step === "shipping" ? "text-black" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center text-sm ${step === "shipping" ? "bg-black text-white" : "bg-gray-100"}`}>
                  1
                </div>
                <span className="text-sm tracking-wider">SHIPPING</span>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
              <div className={`flex items-center gap-2 ${step === "payment" ? "text-black" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center text-sm ${step === "payment" ? "bg-black text-white" : "bg-gray-100"}`}>
                  2
                </div>
                <span className="text-sm tracking-wider">PAYMENT</span>
              </div>
            </div>

            {/* Shipping Form */}
            {step === "shipping" && (
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleShippingSubmit}
              >
                <h2 className="text-xl font-light tracking-tight mb-8">SHIPPING INFORMATION</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">FIRST NAME</label>
                    <input
                      type="text"
                      value={shippingData.firstName}
                      onChange={(e) => setShippingData(prev => ({ ...prev, firstName: e.target.value }))}
                      className={`w-full px-4 py-3 border ${errors.firstName ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">LAST NAME</label>
                    <input
                      type="text"
                      value={shippingData.lastName}
                      onChange={(e) => setShippingData(prev => ({ ...prev, lastName: e.target.value }))}
                      className={`w-full px-4 py-3 border ${errors.lastName ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">EMAIL</label>
                  <input
                    type="email"
                    value={shippingData.email}
                    onChange={(e) => setShippingData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 border ${errors.email ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">PHONE</label>
                  <input
                    type="tel"
                    value={shippingData.phone}
                    onChange={(e) => setShippingData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-4 py-3 border ${errors.phone ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">ADDRESS</label>
                  <input
                    type="text"
                    value={shippingData.street}
                    onChange={(e) => setShippingData(prev => ({ ...prev, street: e.target.value }))}
                    className={`w-full px-4 py-3 border ${errors.street ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                  />
                  {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">CITY</label>
                    <input
                      type="text"
                      value={shippingData.city}
                      onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                      className={`w-full px-4 py-3 border ${errors.city ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">STATE</label>
                    <div className="relative">
                      <select
                        value={shippingData.state}
                        onChange={(e) => setShippingData(prev => ({ ...prev, state: e.target.value }))}
                        className={`w-full px-4 py-3 border ${errors.state ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition appearance-none bg-white`}
                      >
                        <option value="">Select</option>
                        {US_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">ZIP CODE</label>
                    <input
                      type="text"
                      value={shippingData.zip}
                      onChange={(e) => setShippingData(prev => ({ ...prev, zip: e.target.value }))}
                      className={`w-full px-4 py-3 border ${errors.zip ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                    />
                    {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">COUNTRY</label>
                    <div className="relative">
                      <select
                        value={shippingData.country}
                        onChange={(e) => setShippingData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition appearance-none bg-white"
                      >
                        {COUNTRIES.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
                >
                  CONTINUE TO PAYMENT
                </button>
              </motion.form>
            )}

            {/* Payment Form */}
            {step === "payment" && (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handlePaymentSubmit}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-light tracking-tight">PAYMENT</h2>
                  <button
                    type="button"
                    onClick={() => setStep("shipping")}
                    className="text-sm text-gray-500 hover:text-black transition"
                  >
                    Edit Shipping
                  </button>
                </div>

                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 text-sm">
                    {errors.general}
                  </div>
                )}

                {!user && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                      Please <Link href="/login" className="underline font-medium">log in</Link> to complete your purchase.
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 p-4 mb-6 flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">Credit / Debit Card</span>
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">CARD NUMBER</label>
                  <input
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-3 border ${errors.cardNumber ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                  />
                  {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">NAME ON CARD</label>
                  <input
                    type="text"
                    value={paymentData.cardName}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, cardName: e.target.value }))}
                    className={`w-full px-4 py-3 border ${errors.cardName ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                  />
                  {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">EXPIRY DATE</label>
                    <input
                      type="text"
                      value={paymentData.expiry}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                      placeholder="MM/YY"
                      className={`w-full px-4 py-3 border ${errors.expiry ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                    />
                    {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">CVV</label>
                    <input
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      placeholder="123"
                      className={`w-full px-4 py-3 border ${errors.cvv ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`}
                    />
                    {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !user}
                  className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> PROCESSING
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> PAY ${total.toFixed(2)}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-2">
                  <Lock className="w-3 h-3" /> Secure checkout - Your data is encrypted
                </p>
              </motion.form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-neutral-50 p-8 sticky top-24">
              <h2 className="text-sm tracking-wider mb-6">ORDER SUMMARY</h2>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-white flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                      <p className="text-sm mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className={shipping === 0 ? "text-green-600" : ""}>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  Add ${(150 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
