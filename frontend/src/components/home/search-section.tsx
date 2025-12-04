import { useState } from "react"
import { Search, MapPin, Calendar, Package } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { TranslatedText } from "@/components/translated-text"

type TabType = "tracking" | "schedule" | "office"

export function SearchSection() {
  const [activeTab, setActiveTab] = useState<TabType>("tracking")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [officeLocation, setOfficeLocation] = useState("")

  const handleSearch = () => {
    // Handle search based on active tab
    if (activeTab === "tracking") {
      // Navigate to tracking page with tracking number
      if (trackingNumber) {
        window.location.href = `/dashboard/tracking?tracking=${trackingNumber}`
      }
    } else if (activeTab === "schedule") {
      // Navigate to schedule page
      if (origin && destination) {
        window.location.href = `/dashboard/routes?origin=${origin}&destination=${destination}`
      }
    } else if (activeTab === "office") {
      // Navigate to office locator with search query
      // Maersk-style: Shows map with office markers and list of nearby offices
      if (officeLocation) {
        // Encode the search query for URL
        const encodedLocation = encodeURIComponent(officeLocation)
        window.location.href = `/dashboard/locations?q=${encodedLocation}&view=map`
      }
    }
  }

  return (
    <section className="relative -mt-24 z-40 mb-20">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="bg-white rounded-xl  border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab("tracking")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "tracking"
                  ? "bg-white text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="h-4 w-4" />
                <span><TranslatedText text="Tracking" /></span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "schedule"
                  ? "bg-white text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                <span><TranslatedText text="Schedule" /></span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("office")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "office"
                  ? "bg-white text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                <span><TranslatedText text="Office Locator" /></span>
              </div>
            </button>
          </div>

          {/* Search Content */}
          <div className="p-6">
            {activeTab === "tracking" && (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="Tracking Number" />
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number or booking reference"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                </div>
                <div className="lg:flex lg:items-end">
                  <Button
                    onClick={handleSearch}
                    className="w-full lg:w-auto bg-primary-600 hover:bg-primary-700 text-white py-3 px-8 lg:min-w-[180px]"
                    disabled={!trackingNumber.trim()}
                  >
                    <Search className="mr-2 h-5 w-5 inline" />
                    <TranslatedText text="Track Shipment" />
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TranslatedText text="Origin" />
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="City, Country or Port"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TranslatedText text="Destination" />
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="City, Country or Port"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:flex lg:items-end">
                  <Button
                    onClick={handleSearch}
                    className="w-full lg:w-auto bg-primary-600 hover:bg-primary-700 text-white py-3 px-8 lg:min-w-[180px]"
                    disabled={!origin.trim() || !destination.trim()}
                  >
                    <Search className="mr-2 h-5 w-5 inline" />
                    <TranslatedText text="Find Schedule" />
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "office" && (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TranslatedText text="Location" />
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={officeLocation}
                      onChange={(e) => setOfficeLocation(e.target.value)}
                      placeholder="City, Country or Postal Code"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                </div>
                <div className="lg:flex lg:items-end">
                  <Button
                    onClick={handleSearch}
                    className="w-full lg:w-auto bg-primary-600 hover:bg-primary-700 text-white py-3 px-8 lg:min-w-[180px]"
                    disabled={!officeLocation.trim()}
                  >
                    <Search className="mr-2 h-5 w-5 inline" />
                    <TranslatedText text="Find Office" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

