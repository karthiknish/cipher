"use client";
import { Envelope } from "@phosphor-icons/react";
import { CustomerData } from "../types";
import { CLVPrediction } from "./types";
import { getSegmentForCustomer } from "./clvUtils";

interface AllCustomersTableProps {
  customers: CustomerData[];
  clvPredictions: CLVPrediction[];
  onSendEmail: (customer: CustomerData) => void;
}

export function AllCustomersTable({ 
  customers, 
  clvPredictions, 
  onSendEmail 
}: AllCustomersTableProps) {
  return (
    <div className="bg-white border border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-medium">All Customers</h3>
        <p className="text-xs text-gray-500 mt-1">{customers.length} total customers</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">EMAIL</th>
              <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">ORDERS</th>
              <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">TOTAL SPENT</th>
              <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">AVG ORDER</th>
              <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">LAST ORDER</th>
              <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">SEGMENT</th>
              <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.slice(0, 10).map((customer, i) => {
              const { segment, segmentColor } = getSegmentForCustomer(customer, clvPredictions);

              return (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-6 text-sm">{customer.email}</td>
                  <td className="py-3 px-6 text-sm">{customer.orders}</td>
                  <td className="py-3 px-6 text-sm font-medium">${customer.totalSpent.toFixed(0)}</td>
                  <td className="py-3 px-6 text-sm">${customer.avgOrderValue.toFixed(0)}</td>
                  <td className="py-3 px-6 text-sm text-gray-500">
                    {new Date(customer.lastOrder).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-1 text-xs ${segmentColor}`}>{segment}</span>
                  </td>
                  <td className="py-3 px-6">
                    <button
                      onClick={() => onSendEmail(customer)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Envelope className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
