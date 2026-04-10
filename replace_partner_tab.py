#!/usr/bin/env python3
import re

# Read the file
with open('frontend/src/pages/subscription/SubscriptionPlans.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start and end markers
start_marker = "/* Partner Plans Management View */"
end_marker = "/* Payment Modal */"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    exit(1)

# The new content to insert
new_content = '''/* Partner Plans Management View */
            <div className="space-y-6">
              {/* Parent Subscriptions Summary */}
              {parents.length > 0 && (
                <div className="grid md:grid-cols-3 gap-4">
                  {parents.map((parent) => (
                    <div key={parent.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[20px] p-5 border border-blue-100">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        {parent.plan.name}
                      </div>
                      <div className="text-2xl font-black text-[#345E85] tracking-tight">
                        {parent.availableCredits?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Credits available for allocation
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {parents.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-4">
                  <FaInfoCircle className="text-yellow-600 text-xl flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-2">No Parent Subscription</h3>
                    <p className="text-sm text-yellow-800">
                      You need to purchase a subscription plan first before creating partner plans for truck owners.
                    </p>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                      Purchase Subscription
                    </button>
                  </div>
                </div>
              )}

              {/* Partner Plans Grid */}
              {partnerPlans.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partnerPlans.map((plan) => {
                    const parent = getParentInfo(plan.parentSubscriptionId);
                    return (
                      <div
                        key={plan.id}
                        className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-[16px] bg-blue-50 flex items-center justify-center">
                              <FaRocket className="text-xl text-[#345E85]" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                {plan.name}
                              </h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {plan.slug}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                            plan.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-4 min-h-[40px]">
                          {plan.description}
                        </p>

                        {parent && (
                          <div className="bg-blue-50/50 rounded-xl p-3 mb-4 border border-blue-100">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              Parent: {parent.plan.name}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Price per Credit:</span>
                            <span className="font-black text-[#345E85]">
                              ${Number(plan.pricePerCredit).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Credits Per Partner:</span>
                            <span className="font-black text-blue-600">
                              {plan.creditCostPerPartner.toLocaleString()}
                            </span>
                          </
div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Available Slots:</span>
                            <span className="font-black text-purple-600">
                              {plan.availableSlots} partners
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                            <span className="text-slate-600 font-semibold">Total Allocation:</span>
                            <span className="font-black text-emerald-600">
                              {plan.totalCredits.toLocaleString()} credits
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Credits/Ton:</span>
                            <span className="font-bold text-slate-700">
                              {Number(plan.creditsPerTonTruckOwner).toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => handleOpenPartnerModal(plan)}
                            className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <FaEdit className="text-xs" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePartnerPlan(plan.id)}
                            className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <FaTrash className="text-xs" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : parents.length > 0 ? (
                <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                    <FaCrown className="text-4xl text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                    No Partner Plans Yet
                  </h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    Create partner plans to allow truck owners to purchase credits from your allocation.
                  </p>
                  <button
                    onClick={() => handleOpenPartnerModal()}
                    className="px-8 py-4 bg-[#345E85] text-white rounded-2xl hover:bg-[#2a4d6d] transition-all font-black text-[11px] uppercase tracking-widest shadow-lg inline-flex items-center gap-2"
                  >
                    <FaPlus />
                    Create Your First Plan
                  </button>
                </div>
              ) : null}

              {/* Create Partner Plan Button (Floating) */}
              {parents.length > 0 && partnerPlans.length > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => handleOpenPartnerModal()}
                    className="px-8 py-4 bg-[#345E85] text-white rounded-2xl hover:bg-[#2a4d6d] transition-all font-black text-[11px] uppercase tracking-widest shadow-lg inline-flex items-center gap-2"
                  >
                    <FaPlus />
                    Create New Partner Plan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      '''

# Replace the content
new_file_content = content[:start_idx] + new_content + content[end_idx:]

# Write back
with open('frontend/src/pages/subscription/SubscriptionPlans.tsx', 'w', encoding='utf-8') as f:
    f.write(new_file_content)

print("Replacement complete!")
