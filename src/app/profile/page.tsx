"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile, SavedAddress, StyleQuizAnswers } from "@/context/UserProfileContext";
import { signOut } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, MapPin, Plus, Edit2, Trash2, X, 
  Heart, Palette, Ruler, Save, Camera, LogOut,
  ChevronRight, Package, Settings, Check
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Style Quiz Component
function StyleQuizSection() {
  const { profile, saveStyleQuiz } = useUserProfile();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showQuiz, setShowQuiz] = useState(false);

  const questions = [
    {
      id: "style",
      question: "How would you describe your style?",
      options: ["minimalist", "streetwear", "classic", "bold"],
      multi: false
    },
    {
      id: "colors",
      question: "What colors do you gravitate towards?",
      options: ["Black", "White", "Gray", "Navy", "Earth Tones", "Bold Colors"],
      multi: true
    },
    {
      id: "fit",
      question: "What fit do you prefer?",
      options: ["slim", "regular", "oversized"],
      multi: false
    },
    {
      id: "occasions",
      question: "When do you mostly shop for?",
      options: ["casual", "street", "work", "active"],
      multi: true
    },
    {
      id: "budget",
      question: "What's your typical budget per piece?",
      options: ["budget", "mid", "premium"],
      multi: false
    }
  ];

  useEffect(() => {
    if (profile?.styleQuiz?.completed && profile.styleQuiz.answers) {
      setAnswers(profile.styleQuiz.answers);
    }
  }, [profile?.styleQuiz]);

  const handleAnswer = (questionId: string, answer: string, multi: boolean) => {
    let newAnswers: Record<string, string | string[]>;
    
    if (multi) {
      const current = (answers[questionId] as string[]) || [];
      if (current.includes(answer)) {
        newAnswers = { ...answers, [questionId]: current.filter(a => a !== answer) };
      } else {
        newAnswers = { ...answers, [questionId]: [...current, answer] };
      }
    } else {
      newAnswers = { ...answers, [questionId]: answer };
    }
    
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Save quiz
      const quizAnswers: StyleQuizAnswers["answers"] = {
        style: (answers.style as string) || "",
        colors: (answers.colors as string[]) || [],
        fit: (answers.fit as string) || "",
        occasions: (answers.occasions as string[]) || [],
        budget: (answers.budget as string) || ""
      };
      saveStyleQuiz(quizAnswers);
      setShowQuiz(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowQuiz(true);
  };

  if (!showQuiz && !profile?.styleQuiz?.completed) {
    return (
      <div className="text-center py-8">
        <Palette className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="font-medium mb-2">Complete Your Style Profile</h3>
        <p className="text-sm text-gray-500 mb-6">
          Take a quick quiz to get personalized recommendations
        </p>
        <button 
          onClick={() => setShowQuiz(true)}
          className="bg-black text-white px-8 py-3 text-sm tracking-wider hover:bg-gray-900 transition"
        >
          START QUIZ
        </button>
      </div>
    );
  }

  if (profile?.styleQuiz?.completed && !showQuiz) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-medium">Your Style Profile</h3>
          <button 
            onClick={resetQuiz}
            className="text-sm text-gray-500 hover:text-black transition"
          >
            Retake Quiz
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Style</p>
            <p className="font-medium capitalize">{profile.styleQuiz.answers.style || "Not set"}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Preferred Fit</p>
            <p className="font-medium capitalize">{profile.styleQuiz.answers.fit || "Not set"}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Favorite Colors</p>
            <p className="font-medium">{profile.styleQuiz.answers.colors?.join(", ") || "Not set"}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Budget</p>
            <p className="font-medium capitalize">{profile.styleQuiz.answers.budget || "Not set"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          {questions.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 w-8 transition-colors ${
                idx <= currentQuestion ? "bg-black" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <button onClick={() => setShowQuiz(false)} className="text-gray-400 hover:text-black">
          <X className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <h3 className="text-lg font-medium">{questions[currentQuestion].question}</h3>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option) => {
              const isSelected = questions[currentQuestion].multi
                ? ((answers[questions[currentQuestion].id] as string[]) || []).includes(option)
                : answers[questions[currentQuestion].id] === option;
              
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(
                    questions[currentQuestion].id, 
                    option, 
                    questions[currentQuestion].multi
                  )}
                  className={`w-full p-4 text-left border transition-all capitalize flex items-center justify-between ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:border-black"
                  }`}
                >
                  {option}
                  {isSelected && <Check className="w-5 h-5" />}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleNext}
            className="w-full bg-black text-white py-4 text-sm tracking-wider hover:bg-gray-900 transition"
          >
            {currentQuestion < questions.length - 1 ? "NEXT" : "FINISH"}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Address Form Modal
function AddressFormModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialAddress 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (address: Omit<SavedAddress, "id">) => void;
  initialAddress?: SavedAddress;
}) {
  const [formData, setFormData] = useState({
    label: initialAddress?.label || "",
    firstName: initialAddress?.firstName || "",
    lastName: initialAddress?.lastName || "",
    street: initialAddress?.street || "",
    city: initialAddress?.city || "",
    state: initialAddress?.state || "",
    zip: initialAddress?.zip || "",
    country: initialAddress?.country || "United States",
    phone: initialAddress?.phone || "",
    isDefault: initialAddress?.isDefault || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-light tracking-tight">
              {initialAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">ADDRESS LABEL</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Home, Office"
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wider text-gray-500 mb-2">FIRST NAME</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-wider text-gray-500 mb-2">LAST NAME</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">STREET ADDRESS</label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wider text-gray-500 mb-2">CITY</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-wider text-gray-500 mb-2">STATE</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wider text-gray-500 mb-2">ZIP CODE</label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-wider text-gray-500 mb-2">COUNTRY</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition bg-white"
                required
              >
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Australia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">PHONE NUMBER</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-5 h-5 border-gray-300 rounded"
            />
            <span className="text-sm">Set as default address</span>
          </label>

          <button
            type="submit"
            className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
          >
            {initialAddress ? "UPDATE ADDRESS" : "SAVE ADDRESS"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { 
    profile, 
    loading,
    updateAvatar, 
    updateStylePreferences,
    addAddress, 
    updateAddress,
    deleteAddress, 
    setDefaultAddress 
  } = useUserProfile();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "preferences" | "style">("profile");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for preferences
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [preferredFit, setPreferredFit] = useState<string>("");

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile?.stylePreferences) {
      setFavoriteColors(profile.stylePreferences.favoriteColors || []);
      setPreferredFit(profile.stylePreferences.preferredFit || "");
    }
  }, [profile?.stylePreferences]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    await updateStylePreferences({ 
      favoriteColors, 
      preferredFit: preferredFit as "slim" | "regular" | "oversized" | "" 
    });
    setIsSaving(false);
  };

  const handleAddAddress = (addressData: Omit<SavedAddress, "id">) => {
    addAddress(addressData);
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleUpdateAddress = (addressData: Omit<SavedAddress, "id">) => {
    if (editingAddress) {
      updateAddress(editingAddress.id, addressData);
    }
    setEditingAddress(undefined);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      deleteAddress(addressId);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const toggleColor = (color: string) => {
    setFavoriteColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color) 
        : [...prev, color]
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const colors = ["Black", "White", "Gray", "Navy", "Brown", "Olive", "Burgundy"];
  const fits = ["slim", "regular", "oversized"];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile?.avatar ? (
                <Image 
                  src={profile.avatar} 
                  alt="Avatar" 
                  width={80} 
                  height={80} 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition">
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-tight">
                {profile?.displayName || user.displayName || "CIPHER Member"}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "addresses", label: "Addresses", icon: MapPin },
              { id: "preferences", label: "Preferences", icon: Settings },
              { id: "style", label: "Style Quiz", icon: Palette },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 text-sm tracking-wider border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-black font-medium"
                    : "border-transparent text-gray-500 hover:text-black"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-gray-50 p-6">
                <h3 className="font-medium mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p>{profile?.displayName || user.displayName || "Not set"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/orders" className="group p-6 border border-gray-200 hover:border-black transition">
                  <Package className="w-6 h-6 mb-4 text-gray-400 group-hover:text-black transition" />
                  <h4 className="font-medium mb-1">Orders</h4>
                  <p className="text-sm text-gray-500">View order history</p>
                  <ChevronRight className="w-5 h-5 mt-4 text-gray-300 group-hover:text-black transition" />
                </Link>

                <Link href="/wishlist" className="group p-6 border border-gray-200 hover:border-black transition">
                  <Heart className="w-6 h-6 mb-4 text-gray-400 group-hover:text-black transition" />
                  <h4 className="font-medium mb-1">Wishlist</h4>
                  <p className="text-sm text-gray-500">Saved items</p>
                  <ChevronRight className="w-5 h-5 mt-4 text-gray-300 group-hover:text-black transition" />
                </Link>

                <button 
                  onClick={() => setActiveTab("addresses")}
                  className="group p-6 border border-gray-200 hover:border-black transition text-left"
                >
                  <MapPin className="w-6 h-6 mb-4 text-gray-400 group-hover:text-black transition" />
                  <h4 className="font-medium mb-1">Addresses</h4>
                  <p className="text-sm text-gray-500">{profile?.savedAddresses?.length || 0} saved</p>
                  <ChevronRight className="w-5 h-5 mt-4 text-gray-300 group-hover:text-black transition" />
                </button>
              </div>

              <div className="pt-8 border-t border-gray-200">
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm tracking-wider">LOG OUT</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-light tracking-tight">SAVED ADDRESSES</h2>
                <button 
                  onClick={() => {
                    setEditingAddress(undefined);
                    setIsAddressModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-sm tracking-wider hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              </div>

              {profile?.savedAddresses && profile.savedAddresses.length > 0 ? (
                <div className="grid gap-4">
                  {profile.savedAddresses.map((address) => (
                    <div 
                      key={address.id}
                      className={`p-6 border transition ${
                        address.isDefault ? "border-black" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{address.label}</span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-black text-white text-xs">Default</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditAddress(address)}
                            className="p-2 hover:bg-gray-100 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.id)}
                            className="p-2 hover:bg-red-50 text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{address.firstName} {address.lastName}</p>
                      <p className="text-sm text-gray-600">{address.street}</p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.zip}
                      </p>
                      <p className="text-sm text-gray-600">{address.country}</p>
                      {address.phone && (
                        <p className="text-sm text-gray-500 mt-2">{address.phone}</p>
                      )}
                      {!address.isDefault && (
                        <button
                          onClick={() => setDefaultAddress(address.id)}
                          className="mt-4 text-xs tracking-wider underline underline-offset-4 hover:no-underline"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No saved addresses yet</p>
                  <button 
                    onClick={() => setIsAddressModalOpen(true)}
                    className="bg-black text-white px-6 py-3 text-sm tracking-wider hover:bg-gray-900 transition"
                  >
                    ADD ADDRESS
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-lg font-light tracking-tight mb-2">SHOPPING PREFERENCES</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Help us personalize your experience
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Favorite Colors
                </h3>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={`px-6 py-3 border text-sm tracking-wider transition ${
                        favoriteColors.includes(color)
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-black"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Preferred Fit
                </h3>
                <div className="flex flex-wrap gap-3">
                  {fits.map((fit) => (
                    <button
                      key={fit}
                      onClick={() => setPreferredFit(fit)}
                      className={`px-6 py-3 border text-sm tracking-wider capitalize transition ${
                        preferredFit === fit
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-black"
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="bg-black text-white px-8 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "SAVING..." : "SAVE PREFERENCES"}
              </button>
            </motion.div>
          )}

          {/* Style Quiz Tab */}
          {activeTab === "style" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <h2 className="text-lg font-light tracking-tight mb-2">STYLE PROFILE</h2>
                <p className="text-sm text-gray-500">
                  Complete our style quiz to get personalized product recommendations
                </p>
              </div>
              <StyleQuizSection />
            </motion.div>
          )}
        </div>
      </div>

      {/* Address Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <AddressFormModal
            isOpen={isAddressModalOpen}
            onClose={() => {
              setIsAddressModalOpen(false);
              setEditingAddress(undefined);
            }}
            onSave={editingAddress ? handleUpdateAddress : handleAddAddress}
            initialAddress={editingAddress}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
