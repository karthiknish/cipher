"use client";
import Image from "next/image";
import Link from "next/link";
import {
  UserCirclePlus,
  Clock,
  Broadcast,
  CurrencyDollar,
  Warning,
  CheckCircle,
  XCircle,
  Eye,
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { Influencer, InfluencerApplication } from "@/context/InfluencerContext";

interface InfluencersTabProps {
  influencers: Influencer[];
  applications: InfluencerApplication[];
  onApproveApplication: (applicationId: string) => void;
  onRejectApplication: (applicationId: string) => void;
  onUpdateTier: (influencerId: string, tier: Influencer["tier"]) => void;
  onUpdateCommissionRate: (influencerId: string, rate: number) => void;
}

export function InfluencersTab({
  influencers,
  applications,
  onApproveApplication,
  onRejectApplication,
  onUpdateTier,
  onUpdateCommissionRate,
}: InfluencersTabProps) {
  const tierColors: Record<string, string> = {
    bronze: "bg-amber-700 text-white",
    silver: "bg-gray-400 text-white",
    gold: "bg-yellow-500 text-white",
    platinum: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  };

  const pendingApplications = applications.filter(a => a.status === "pending");

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-6">
          <UserCirclePlus className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-medium">{influencers.filter(i => i.isActive).length}</p>
          <p className="text-xs text-gray-500 tracking-wider">ACTIVE CREATORS</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <Clock className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-medium">{pendingApplications.length}</p>
          <p className="text-xs text-gray-500 tracking-wider">PENDING APPLICATIONS</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <Broadcast className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-medium">{influencers.filter(i => i.isLive).length}</p>
          <p className="text-xs text-gray-500 tracking-wider">LIVE NOW</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <CurrencyDollar className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-medium">
            ${influencers.reduce((sum, i) => sum + i.totalEarnings, 0).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 tracking-wider">TOTAL PAYOUTS</p>
        </div>
      </div>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 p-4 flex items-center gap-3">
            <Warning className="w-5 h-5 text-amber-500" />
            <h3 className="font-medium">Pending Applications</h3>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
              {pendingApplications.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingApplications.map((app) => (
              <div key={app.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-gray-500">@{app.username}</p>
                  <p className="text-xs text-gray-400 mt-1">{app.followerCount?.toLocaleString()} followers</p>
                  <div className="flex items-center gap-2 mt-2">
                    {app.socialLinks?.instagram && (
                      <a href={app.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500">
                        <InstagramLogo className="w-4 h-4" />
                      </a>
                    )}
                    {app.socialLinks?.tiktok && (
                      <a href={app.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black">
                        <TiktokLogo className="w-4 h-4" />
                      </a>
                    )}
                    {app.socialLinks?.youtube && (
                      <a href={app.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500">
                        <YoutubeLogo className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 max-w-md">
                  <p className="line-clamp-2">{app.bio}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApproveApplication(app.id)}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => onRejectApplication(app.id)}
                    className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Influencers */}
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h3 className="font-medium">Active Creators</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase">
              <tr>
                <th className="text-left p-4">Creator</th>
                <th className="text-left p-4">Tier</th>
                <th className="text-left p-4">Commission</th>
                <th className="text-left p-4">Sales</th>
                <th className="text-left p-4">Earnings</th>
                <th className="text-left p-4">Pending</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {influencers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No active creators yet
                  </td>
                </tr>
              ) : (
                influencers.map((inf) => (
                  <tr key={inf.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {inf.avatar ? (
                            <Image src={inf.avatar} alt={inf.displayName} width={40} height={40} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white font-bold">
                              {inf.displayName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{inf.displayName}</p>
                          <p className="text-xs text-gray-500">@{inf.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={inf.tier}
                        onChange={(e) => onUpdateTier(inf.id, e.target.value as Influencer["tier"])}
                        className={`px-2 py-1 text-xs rounded ${tierColors[inf.tier]}`}
                      >
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="platinum">Platinum</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={inf.commissionRate}
                        onChange={(e) => onUpdateCommissionRate(inf.id, parseFloat(e.target.value))}
                        className="text-sm border border-gray-200 px-2 py-1 rounded"
                      >
                        <option value="0.10">10%</option>
                        <option value="0.12">12%</option>
                        <option value="0.15">15%</option>
                        <option value="0.18">18%</option>
                        <option value="0.20">20%</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm">{inf.totalSales}</td>
                    <td className="p-4 text-sm font-medium text-green-600">
                      ${inf.totalEarnings.toFixed(2)}
                    </td>
                    <td className="p-4 text-sm text-amber-600">
                      ${inf.pendingEarnings.toFixed(2)}
                    </td>
                    <td className="p-4">
                      {inf.isLive ? (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <Broadcast className="w-3 h-3 animate-pulse" weight="fill" />
                          LIVE
                        </span>
                      ) : inf.isActive ? (
                        <span className="text-xs text-green-600">Active</span>
                      ) : (
                        <span className="text-xs text-gray-400">Inactive</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/shop/creator/${inf.username}`}
                        target="_blank"
                        className="text-xs text-gray-500 hover:text-black flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
