import { useState, useEffect } from "react";
import { motion } from "@/lib/motion";
import { X } from "@phosphor-icons/react";
import { useUserProfile, SavedAddress } from "@/context/UserProfileContext";

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAddress?: SavedAddress | null;
}

export default function AddressFormModal({ isOpen, onClose, editAddress }: AddressFormModalProps) {
  const { addAddress, updateAddress } = useUserProfile();
  const [formData, setFormData] = useState({
    label: "Home",
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    phone: "",
    isDefault: false,
  });

  useEffect(() => {
    if (editAddress) {
      setFormData({
        label: editAddress.label,
        firstName: editAddress.firstName,
        lastName: editAddress.lastName,
        street: editAddress.street,
        city: editAddress.city,
        state: editAddress.state,
        zip: editAddress.zip,
        country: editAddress.country,
        phone: editAddress.phone,
        isDefault: editAddress.isDefault,
      });
    } else {
      setFormData({
        label: "Home",
        firstName: "",
        lastName: "",
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "United States",
        phone: "",
        isDefault: false,
      });
    }
  }, [editAddress, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editAddress?.id) {
      await updateAddress(editAddress.id, formData);
    } else {
      await addAddress(formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-950/60 z-50 flex items-center justify-center p-4"
      role="presentation"
    ><button type="button" aria-label="Close" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-light tracking-tight">
            {editAddress ? "EDIT ADDRESS" : "ADD ADDRESS"}
          </h2>
          <button aria-label="x" type="button" onClick={onClose} className="p-2 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input aria-label="First Name"
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
            />
            <input aria-label="Last Name"
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
            />
          </div>
          <input aria-label="Street Address"
            type="text"
            placeholder="Street Address"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
          />
          <div className="grid grid-cols-2 gap-4">
            <input aria-label="City"
              type="text"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
            />
            <input aria-label="State"
              type="text"
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input aria-label="ZIP Code"
              type="text"
              placeholder="ZIP Code"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
            />
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none bg-white"
            >
              <option>United States</option>
              <option>Canada</option>
              <option>United Kingdom</option>
            </select>
          </div>
          <input aria-label="Phone Number"
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
          />
          <div className="flex gap-4">
            <select
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none bg-white"
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input aria-label="Set as default address" id="AddressFormModal-field-34"
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="accent-black"
            />
            <span>Set as default address</span>
          </label>
          <button
            type="submit"
            className="w-full bg-gray-950 text-white py-3 text-sm tracking-wider hover:bg-gray-800"
          >
            {editAddress ? "UPDATE ADDRESS" : "SAVE ADDRESS"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
