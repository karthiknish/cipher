"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useOrders, ShippingAddress } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useUserProfile, SavedAddress } from "@/context/UserProfileContext";
import { usePromoCode } from "@/context/PromoCodeContext";
import { useInventory } from "@/context/InventoryContext";
import { useLiveActivity } from "@/context/LiveActivityContext";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, Lock, SpinnerGap, Check, CreditCard, CaretDown, 
  Tag, X, MapPin, User, Sparkle 
} from "@phosphor-icons/react";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia"];
const US_STATES = ["California", "New York", "Texas", "Florida", "Washington", "Oregon", "Arizona", "Nevada"];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, subtotal, shipping: baseShipping, tax, total: baseTotal, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { profile, getDefaultAddress, addAddress } = useUserProfile();
  const { appliedCode, discount, applyCode, removeCode } = usePromoCode();
  const { confirmSale } = useInventory();
  const { logPurchase } = useLiveActivity();
  const toast = useToast();
  
  const [step, setStep] = useState<"shipping" | "payment" | "confirmation">("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  
  const [shippingData, setShippingData] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
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

  // Calculate final totals with promo
  const promoShipping = appliedCode?.type === "freeShipping" ? 0 : baseShipping;
  const finalDiscount = appliedCode?.type === "freeShipping" ? baseShipping : discount;
  const finalTotal = Math.max(0, baseTotal - finalDiscount + (appliedCode?.type === "freeShipping" ? -baseShipping : 0));

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setShippingData(prev => ({
        ...prev,
        email: user.email || prev.email,
      }));
      
      // Load default address if available
      const defaultAddr = getDefaultAddress();
      if (defaultAddr) {
        setShippingData(prev => ({
          ...prev,
          firstName: defaultAddr.firstName,
          lastName: defaultAddr.lastName,
          street: defaultAddr.street,
          city: defaultAddr.city,
          state: defaultAddr.state,
          zip: defaultAddr.zip,
          country: defaultAddr.country,
          phone: defaultAddr.phone,
        }));
      }
    }
  }, [user, getDefaultAddress]);

  // Handle selecting a saved address
  const selectSavedAddress = (address: SavedAddress) => {
    setShippingData(prev => ({
      ...prev,
      firstName: address.firstName,
      lastName: address.lastName,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone,
    }));
    setShowSavedAddresses(false);
    toast.success(`${address.label} address selected`);
  };

  // Redirect if cart is empty
  if (cart.length === 0 && step !== "confirmation") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">YOUR BAG IS EMPTY</h1>
          <p className="text-gray-500 mb-10">Add some items before checking out</p>
          <Link href="/shop" className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition">SHOP NOW</Link>
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
    if (!paymentData.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) newErrors.cardNumber = "Invalid card number";
    if (!paymentData.cardName.trim()) newErrors.cardName = "Name on card is required";
    if (!paymentData.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) newErrors.expiry = "Invalid expiry (MM/YY)";
    if (!paymentData.cvv.match(/^\d{3,4}$/)) newErrors.cvv = "Invalid CVV";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping()) {
      if (saveAddress && user) {
        await addAddress({
          label: addressLabel,
          firstName: shippingData.firstName,
          lastName: shippingData.lastName,
          street: shippingData.street,
          city: shippingData.city,
          state: shippingData.state,
          zip: shippingData.zip,
          country: shippingData.country,
          phone: shippingData.phone,
          isDefault: profile?.savedAddresses.length === 0,
        });
        toast.success("Address saved to your profile");
      }
      setStep("payment");
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayment()) return;
    if (!user && !isGuestCheckout) {
      setErrors({ general: "Please log in or continue as guest" });
      return;
    }
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const orderItems = cart.map(item => ({
        productId: item.id, name: item.name, price: item.price, quantity: item.quantity, size: item.size, color: item.color, image: item.image,
      }));
      const newOrderId = await createOrder({
        items: orderItems, subtotal, shipping: promoShipping, tax, total: finalTotal,
        status: "confirmed", shippingAddress: shippingData, paymentMethod: `**** ${paymentData.cardNumber.slice(-4)}`,
      });
      if (newOrderId) {
        setOrderId(newOrderId);
        // Sync inventory - decrement stock for each purchased item
        for (const item of orderItems) {
          await confirmSale(item.productId, item.quantity, newOrderId);
          // Log purchase for live activity ticker (social proof)
          logPurchase(item.productId, item.name, item.image);
        }
        // Mark cart as recovered (completed purchase) before clearing
        await clearCart(true);
        removeCode();
        toast.success("Order placed successfully!");
        setStep("confirmation");
      } else {
        toast.error("Failed to create order.");
        setErrors({ general: "Failed to create order." });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Payment failed.");
      setErrors({ general: "Payment failed." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPromo = () => {
    setPromoError("");
    const categories = cart.map(item => item.category).filter(Boolean) as string[];
    const result = applyCode(promoInput, subtotal, categories);
    if (result.success) { toast.success(result.message); setPromoInput(""); }
    else { setPromoError(result.message); }
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

  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="w-20 h-20 bg-green-100 mx-auto mb-8 flex items-center justify-center"><Check className="w-10 h-10 text-green-600" /></div>
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
            <p className="text-gray-500 mb-8">A confirmation email has been sent to <span className="font-medium">{shippingData.email}</span></p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop" className="bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition">CONTINUE SHOPPING</Link>
              {user && <Link href="/orders" className="border border-black px-10 py-4 text-sm tracking-wider font-medium hover:bg-black hover:text-white transition">VIEW ORDERS</Link>}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition"><ArrowLeft className="w-4 h-4" /> Back to Bag</Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-12">
              <div className={`flex items-center gap-2 ${step === "shipping" ? "text-black" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center text-sm ${step === "shipping" ? "bg-black text-white" : "bg-gray-100"}`}>1</div>
                <span className="text-sm tracking-wider">SHIPPING</span>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
              <div className={`flex items-center gap-2 ${step === "payment" ? "text-black" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center text-sm ${step === "payment" ? "bg-black text-white" : "bg-gray-100"}`}>2</div>
                <span className="text-sm tracking-wider">PAYMENT</span>
              </div>
            </div>

            {/* Guest Notice */}
            {!user && step === "shipping" && (
              <div className="bg-gray-50 p-6 mb-8">
                <div className="flex items-start gap-4">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Already have an account?</p>
                    <p className="text-sm text-gray-500 mb-4"><Link href="/login" className="underline">Sign in</Link> for faster checkout.</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isGuestCheckout} onChange={(e) => setIsGuestCheckout(e.target.checked)} className="w-4 h-4 accent-black" />
                      <span className="text-sm">Continue as guest</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Form */}
            {step === "shipping" && (
              <motion.form initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleShippingSubmit}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-light tracking-tight">SHIPPING INFORMATION</h2>
                  {user && profile && profile.savedAddresses.length > 0 && (
                    <div className="relative">
                      <button type="button" onClick={() => setShowSavedAddresses(!showSavedAddresses)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition">
                        <MapPin className="w-4 h-4" /> Saved Addresses <CaretDown className={`w-4 h-4 transition ${showSavedAddresses ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {showSavedAddresses && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 shadow-lg z-10">
                            {profile.savedAddresses.map((addr) => (
                              <button key={addr.id} type="button" onClick={() => selectSavedAddress(addr)} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{addr.label}</span>
                                  {addr.isDefault && <span className="text-xs bg-black text-white px-2 py-0.5">Default</span>}
                                </div>
                                <p className="text-xs text-gray-500">{addr.street}, {addr.city}, {addr.state}</p>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">FIRST NAME</label>
                    <input type="text" value={shippingData.firstName} onChange={(e) => setShippingData(prev => ({ ...prev, firstName: e.target.value }))} className={`w-full px-4 py-3 border ${errors.firstName ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">LAST NAME</label>
                    <input type="text" value={shippingData.lastName} onChange={(e) => setShippingData(prev => ({ ...prev, lastName: e.target.value }))} className={`w-full px-4 py-3 border ${errors.lastName ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">EMAIL</label>
                  <input type="email" value={shippingData.email} onChange={(e) => setShippingData(prev => ({ ...prev, email: e.target.value }))} className={`w-full px-4 py-3 border ${errors.email ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">PHONE</label>
                  <input type="tel" value={shippingData.phone} onChange={(e) => setShippingData(prev => ({ ...prev, phone: e.target.value }))} className={`w-full px-4 py-3 border ${errors.phone ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">ADDRESS</label>
                  <input type="text" value={shippingData.street} onChange={(e) => setShippingData(prev => ({ ...prev, street: e.target.value }))} className={`w-full px-4 py-3 border ${errors.street ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                  {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">CITY</label>
                    <input type="text" value={shippingData.city} onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))} className={`w-full px-4 py-3 border ${errors.city ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">STATE</label>
                    <div className="relative">
                      <select value={shippingData.state} onChange={(e) => setShippingData(prev => ({ ...prev, state: e.target.value }))} className={`w-full px-4 py-3 border ${errors.state ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition appearance-none bg-white`}>
                        <option value="">Select</option>
                        {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                      </select>
                      <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">ZIP CODE</label>
                    <input type="text" value={shippingData.zip} onChange={(e) => setShippingData(prev => ({ ...prev, zip: e.target.value }))} className={`w-full px-4 py-3 border ${errors.zip ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                    {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">COUNTRY</label>
                    <div className="relative">
                      <select value={shippingData.country} onChange={(e) => setShippingData(prev => ({ ...prev, country: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition appearance-none bg-white">
                        {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
                      </select>
                      <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {user && (
                  <div className="mb-8 p-4 bg-gray-50">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-4 h-4 accent-black" />
                      <span className="text-sm">Save this address to my profile</span>
                    </label>
                    {saveAddress && (
                      <div className="mt-3 pl-7">
                        <label className="block text-xs tracking-wider text-gray-500 mb-2">ADDRESS LABEL</label>
                        <select value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} className="px-3 py-2 border border-gray-200 text-sm">
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={!user && !isGuestCheckout} className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed">CONTINUE TO PAYMENT</button>
              </motion.form>
            )}

            {/* Payment Form */}
            {step === "payment" && (
              <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handlePaymentSubmit}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-light tracking-tight">PAYMENT</h2>
                  <button type="button" onClick={() => setStep("shipping")} className="text-sm text-gray-500 hover:text-black transition">Edit Shipping</button>
                </div>

                {errors.general && <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 text-sm">{errors.general}</div>}

                <div className="bg-gray-50 p-4 mb-6 flex items-center gap-3"><CreditCard className="w-5 h-5 text-gray-400" /><span className="text-sm">Credit / Debit Card</span></div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">CARD NUMBER</label>
                  <input type="text" value={paymentData.cardNumber} onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))} placeholder="1234 5678 9012 3456" className={`w-full px-4 py-3 border ${errors.cardNumber ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                  {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">NAME ON CARD</label>
                  <input type="text" value={paymentData.cardName} onChange={(e) => setPaymentData(prev => ({ ...prev, cardName: e.target.value }))} className={`w-full px-4 py-3 border ${errors.cardName ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                  {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">EXPIRY DATE</label>
                    <input type="text" value={paymentData.expiry} onChange={(e) => setPaymentData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))} placeholder="MM/YY" className={`w-full px-4 py-3 border ${errors.expiry ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                    {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">CVV</label>
                    <input type="text" value={paymentData.cvv} onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="123" className={`w-full px-4 py-3 border ${errors.cvv ? "border-red-500" : "border-gray-200"} focus:border-black outline-none transition`} />
                    {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                  </div>
                </div>

                <button type="submit" disabled={isProcessing} className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isProcessing ? <><SpinnerGap className="w-4 h-4 animate-spin" /> PROCESSING</> : <><Lock className="w-4 h-4" /> PAY ${finalTotal.toFixed(2)}</>}
                </button>
                <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-2"><Lock className="w-3 h-3" /> Secure checkout - Your data is encrypted</p>
              </motion.form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-neutral-50 p-8 sticky top-24">
              <h2 className="text-sm tracking-wider mb-6">ORDER SUMMARY</h2>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-white flex-shrink-0"><Image src={item.image} alt={item.name} fill className="object-cover" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">Size: {item.size}{item.color && ` | Color: ${item.color}`} | Qty: {item.quantity}</p>
                      <p className="text-sm mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex items-center gap-2 mb-3"><Tag className="w-4 h-4 text-gray-400" /><span className="text-sm tracking-wider">PROMO CODE</span></div>
                {appliedCode ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3">
                    <div className="flex items-center gap-2"><Sparkle className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-700">{appliedCode.code}</span></div>
                    <button onClick={removeCode} className="text-green-600 hover:text-green-800 transition"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 px-4 py-2 border border-gray-200 text-sm focus:border-black outline-none transition" />
                      <button onClick={handleApplyPromo} disabled={!promoInput.trim()} className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-900 transition disabled:opacity-50">Apply</button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
                    <p className="text-xs text-gray-400 mt-2">Try: WELCOME10, CIPHER20, FREESHIP</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {appliedCode && finalDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({appliedCode.code})</span><span>-${finalDiscount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={promoShipping === 0 ? "text-green-600" : ""}>{promoShipping === 0 ? "Free" : `$${promoShipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${tax.toFixed(2)}</span></div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between text-lg font-medium"><span>Total</span><span>${finalTotal.toFixed(2)}</span></div>
              </div>

              {baseShipping > 0 && !appliedCode && <p className="text-xs text-gray-500 mt-4">Add ${(150 - subtotal).toFixed(2)} more for free shipping</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
