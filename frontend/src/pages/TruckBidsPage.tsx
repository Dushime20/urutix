import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { biddingAPI, biddingHelpers } from '../services/biddingApi';
import { fleetApi } from '../services/fleetApi';
import { FaSearch, FaGavel, FaDollarSign, FaClock, FaTruck, FaPlus, FaStar, FaRegStar, FaMapMarkerAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const TruckBidsPage: React.FC = () => {
	const [auctions, setAuctions] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all'); // Show all statuses by default
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [showBidModal, setShowBidModal] = useState(false);
	const [showQuickBidModal, setShowQuickBidModal] = useState(false);
	const [selectedAuction, setSelectedAuction] = useState<any | null>(null);
	const [bidAmount, setBidAmount] = useState<string>('');
	const [quickBidAmount, setQuickBidAmount] = useState<string>('');
	const [bidNotes, setBidNotes] = useState('');
	const [proposedPickupDate, setProposedPickupDate] = useState('');
	const [proposedDeliveryDate, setProposedDeliveryDate] = useState('');
	const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
	const [selectedTruckId, setSelectedTruckId] = useState<string>('');
	const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [showWatchedOnly, setShowWatchedOnly] = useState(false);
  const [view, setView] = useState<'cards' | 'table'>('cards');

  // Helper function to get location name from load locations array
  const getLocationName = (load: any, type: 'PICKUP' | 'DELIVERY'): string => {
    if (!load) return type === 'PICKUP' ? 'Origin' : 'Destination';
    
    // First try locations array
    if (load.locations && Array.isArray(load.locations)) {
      const location = load.locations.find((loc: any) => loc.type === type);
      if (location?.locationData) {
        // Prefer name, fallback to address
        const name = location.locationData.name || location.locationData.address;
        if (name) return name;
      }
    }
    
    // Fallback to origin/destination fields
    if (type === 'PICKUP') {
      return load?.origin?.name || load?.origin?.address || load?.pickupLocation?.address || load?.pickupLocation?.locationData?.name || 'Origin';
    } else {
      return load?.destination?.name || load?.destination?.address || load?.deliveryLocation?.address || load?.deliveryLocation?.locationData?.name || 'Destination';
    }
  };

  // Helper function to get cargo owner name
  const getCargoOwnerName = (load: any): string => {
    if (!load?.cargoOwner) {
      console.warn('⚠️ No cargo owner found for load:', load?.id);
      return '';
    }
    
    // Log the full cargo owner structure for debugging
    console.log('🔍 Full cargo owner object:', JSON.stringify(load.cargoOwner, null, 2));
    console.log('🔍 Cargo owner keys:', Object.keys(load.cargoOwner));
    console.log('🔍 Cargo owner profile:', load.cargoOwner.profile);
    console.log('🔍 Cargo owner profile type:', typeof load.cargoOwner.profile);
    
    // Try multiple paths to get the name
    const firstName = 
      load.cargoOwner.profile?.firstName || 
      load.cargoOwner.cargoOwnerProfile?.firstName ||
      load.cargoOwner.firstName || 
      '';
    const lastName = 
      load.cargoOwner.profile?.lastName || 
      load.cargoOwner.cargoOwnerProfile?.lastName ||
      load.cargoOwner.lastName || 
      '';
    
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (!fullName) {
      console.warn('⚠️ Cargo owner has no name. Full cargo owner object:', JSON.stringify(load.cargoOwner, null, 2));
      console.warn('⚠️ Profile object:', JSON.stringify(load.cargoOwner.profile, null, 2));
      console.warn('⚠️ All cargo owner properties:', Object.keys(load.cargoOwner));
    }
    
    return fullName;
  };

  const loadAuctions = useCallback(async () => {
		setLoading(true);
		try {
			// Fetch auctions from cargo owners in the same tenant
			const params: any = { page, limit };
			if (status && status !== 'all') {
				params.status = status;
			}
			const response = await biddingAPI.getAuctions(params);
			// Handle different response structures
			let auctionsList: any[] = [];
			if (Array.isArray(response?.data)) {
				auctionsList = response.data;
			} else if (Array.isArray(response?.data?.auctions)) {
				auctionsList = response.data.auctions;
			} else if (Array.isArray(response?.data?.data)) {
				auctionsList = response.data.data;
			} else if (Array.isArray(response)) {
				auctionsList = response;
			}
			
			console.log('📦 Full API response:', JSON.stringify(response, null, 2));
			console.log('📦 Auctions loaded:', auctionsList.length);
			if (auctionsList.length > 0) {
				const firstAuction = auctionsList[0];
				console.log('📦 First auction sample:', JSON.stringify(firstAuction, null, 2));
				if (firstAuction?.load) {
					console.log('📦 Load data:', JSON.stringify(firstAuction.load, null, 2));
					console.log('📦 Cargo owner:', JSON.stringify(firstAuction.load.cargoOwner, null, 2));
					console.log('📦 Cargo owner profile:', JSON.stringify(firstAuction.load.cargoOwner?.profile, null, 2));
					console.log('📦 Cargo owner keys:', firstAuction.load.cargoOwner ? Object.keys(firstAuction.load.cargoOwner) : 'no cargo owner');
					if (firstAuction.load.cargoOwner?.profile) {
						console.log('📦 Profile keys:', Object.keys(firstAuction.load.cargoOwner.profile));
						console.log('📦 Profile firstName:', firstAuction.load.cargoOwner.profile.firstName);
						console.log('📦 Profile lastName:', firstAuction.load.cargoOwner.profile.lastName);
					}
				} else {
					console.warn('⚠️ First auction has no load data');
				}
			}
			setAuctions(auctionsList);
			
			// Record views for loaded auctions (best-effort)
			try {
				await Promise.all(auctionsList.slice(0, 10).map((a: any) => 
					biddingAPI.recordAuctionView(a.id)
				)).catch(() => {});
			} catch {}
			
			// Load watched auctions
			try {
				const watched = await biddingAPI.getWatchedAuctions();
				const ids = Array.isArray(watched?.data?.auctions)
					? watched.data.auctions.map((a: any) => a.id)
					: (Array.isArray(watched?.data) ? watched.data.map((a: any) => a.id) : []);
				setWatchedIds(new Set(ids));
			} catch {}
		} catch (e: any) {
			console.error('Error loading auctions:', e);
			toast.error('Failed to load auctions. Please try again.');
			setAuctions([]);
		} finally {
			setLoading(false);
		}
	}, [status, page, limit]);

	const generateSampleAuctions = () => {
		const now = Date.now();
		const hrs = (h: number) => new Date(now + h * 3600_000).toISOString();
		return [
			{
				id: 'auc-sample-1',
				status: 'ACTIVE',
				auctionType: 'REVERSE',
				currentBid: 1800,
				minimumBidIncrement: 50,
				reservePrice: 2000,
				auctionEnd: hrs(6),
				loadId: 'load-sample-ny-bos',
				load: { title: 'Palletized Electronics', origin: 'New York, NY', destination: 'Boston, MA' },
			},
			{
				id: 'auc-sample-2',
				status: 'ACTIVE',
				auctionType: 'REVERSE',
				currentBid: 3200,
				minimumBidIncrement: 100,
				reservePrice: 3500,
				auctionEnd: hrs(12),
				loadId: 'load-sample-la-sf',
				load: { title: 'Refrigerated Produce', origin: 'Los Angeles, CA', destination: 'San Francisco, CA' },
			},
			{
				id: 'auc-sample-3',
				status: 'SCHEDULED',
				auctionType: 'REVERSE',
				currentBid: null,
				minimumBidIncrement: 50,
				reservePrice: 2600,
				auctionEnd: hrs(24),
				loadId: 'load-sample-chi-det',
				load: { title: 'Auto Parts', origin: 'Chicago, IL', destination: 'Detroit, MI' },
			},
			{
				id: 'auc-sample-4',
				status: 'ACTIVE',
				auctionType: 'REVERSE',
				currentBid: 5400,
				minimumBidIncrement: 100,
				reservePrice: 6000,
				auctionEnd: hrs(3),
				loadId: 'load-sample-dal-hou',
				load: { title: 'Industrial Machinery', origin: 'Dallas, TX', destination: 'Houston, TX' },
			},
			{
				id: 'auc-sample-5',
				status: 'CLOSED',
				auctionType: 'REVERSE',
				currentBid: 1500,
				minimumBidIncrement: 50,
				reservePrice: 1700,
				auctionEnd: hrs(-1),
				loadId: 'load-sample-mia-orl',
				load: { title: 'Packaging Materials', origin: 'Miami, FL', destination: 'Orlando, FL' },
			},
		];
	};

	const seedAuctions = async () => {
		const samples = generateSampleAuctions();
		try {
			// Try to create via API if backend supports it
			for (const s of samples) {
				await biddingAPI.createAuction({
					loadId: s.loadId,
					auctionType: 'REVERSE',
					auctionStart: new Date().toISOString(),
					auctionEnd: s.auctionEnd,
					reservePrice: s.reservePrice,
					minimumBidIncrement: s.minimumBidIncrement,
				});
			}
			toast.success('Sample auctions created');
			await loadAuctions();
		} catch (e) {
			// Fallback to in-memory seeds for UI testing
			setAuctions(samples);
			toast.success('Loaded in-memory sample auctions');
		}
	};

	useEffect(() => {
		loadAuctions();
	}, [status, page, limit]);

	// Auto-refresh auctions every 30 seconds to see new bids from cargo owners
	useEffect(() => {
		if (status === 'ACTIVE') {
			const interval = setInterval(() => {
				loadAuctions();
			}, 30000); // Refresh every 30 seconds

			return () => clearInterval(interval);
		}
	}, [status, loadAuctions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = auctions;
    if (showWatchedOnly) {
      list = list.filter((a: any) => watchedIds.has(a.id));
    }
    if (!q) return list;
    return list.filter((a) =>
			(a?.load?.title || '').toLowerCase().includes(q) ||
			(a?.load?.origin || '').toLowerCase().includes(q) ||
			(a?.load?.destination || '').toLowerCase().includes(q)
		);
  }, [auctions, search, showWatchedOnly, watchedIds]);

  const toggleWatch = async (auction: any) => {
    const isWatched = watchedIds.has(auction.id);
    try {
      if (isWatched) {
        await biddingAPI.unwatchAuction(auction.id);
        setWatchedIds((prev) => {
          const next = new Set(prev);
          next.delete(auction.id);
          return next;
        });
        toast.success('Removed from watched');
      } else {
        await biddingAPI.watchAuction(auction.id);
        setWatchedIds((prev) => new Set(prev).add(auction.id));
        toast.success('Added to watched');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to toggle watch');
    }
  };

	const openQuickBidModal = (auction: any) => {
		setSelectedAuction(auction);
		// Set default bid amount based on current bid or reserve price
		const defaultAmount = auction?.currentBid 
			? auction.currentBid - (auction?.minimumBidIncrement || 1)
			: (auction?.reservePrice || 100) - 1;
		setQuickBidAmount(String(defaultAmount));
		setShowQuickBidModal(true);
	};

	const submitQuickBid = async () => {
		if (!selectedAuction) return;
		const amountNum = Number(quickBidAmount);
		if (!amountNum || amountNum <= 0) {
			toast.error('Enter a valid bid amount');
			return;
		}
		try {
			await biddingAPI.submitBid({
				loadId: selectedAuction.loadId,
				bidAmount: amountNum,
				bidCurrency: 'USD',
				bidNotes: 'Quick bid from Truck Owner',
				bidDetails: {
					truckSpecifications: {},
				},
			});
			toast.success('Bid submitted successfully!');
			setShowQuickBidModal(false);
			setSelectedAuction(null);
			setQuickBidAmount('');
			// Refresh auctions to show updated bid information
			await loadAuctions();
		} catch (e: any) {
			toast.error(e?.response?.data?.message || 'Failed to submit bid');
		}
	};

	const openBidModal = async (auction: any) => {
		setSelectedAuction(auction);
		setBidAmount(
			String(
				auction?.currentBid
					? auction.currentBid - (auction?.minimumBidIncrement || 1)
					: (auction?.reservePrice || 100) - 1
			)
		);
		setBidNotes('');
		setProposedPickupDate('');
		setProposedDeliveryDate('');
		setSelectedTruckId('');
		setSelectedDriverId('');
		try {
			const [truckList, driverList] = await Promise.all([
				fleetApi.getTrucks({}),
				fleetApi.getDrivers({ status: 'ACTIVE' })
			]);
			setTrucks(truckList || []);
			setDrivers(driverList || []);
		} catch {
			setTrucks([]);
			setDrivers([]);
		}
		setShowBidModal(true);
	};

	const placeBid = async () => {
		if (!selectedAuction) return;
		const amountNum = Number(bidAmount);
		if (!amountNum || amountNum <= 0) {
			toast.error('Enter a valid bid amount');
			return;
		}
		try {
			await biddingAPI.submitBid({
				loadId: selectedAuction.loadId,
				bidAmount: amountNum,
				bidCurrency: 'USD',
				proposedPickupDate: proposedPickupDate || undefined,
				proposedDeliveryDate: proposedDeliveryDate || undefined,
				bidNotes: bidNotes || undefined,
				bidDetails: {
					truckSpecifications: selectedTruckId ? { truckId: selectedTruckId } : {},
					driverInfo: selectedDriverId ? { driverId: selectedDriverId } : undefined,
				},
			});
			toast.success('Bid submitted successfully!');
			setShowBidModal(false);
			// Refresh auctions to show updated bid information
			await loadAuctions();
		} catch (e: any) {
			toast.error(e?.response?.data?.message || 'Failed to submit bid');
		}
	};

	return (
		<div className="p-4 md:p-6">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
						<FaGavel className="text-primary-600" /> Available Auctions
					</h2>
					<p className="text-sm text-gray-600 mt-1">
						Browse and bid on cargo shipments from all cargo owners
					</p>
				</div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center rounded border border-gray-200">
            <button onClick={() => setView('cards')} className={`px-3 py-2 text-sm ${view==='cards' ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'}`}>Cards</button>
            <button onClick={() => setView('table')} className={`px-3 py-2 text-sm ${view==='table' ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'}`}>Table</button>
          </div>
          <button onClick={() => setShowWatchedOnly((v) => !v)} className={`inline-flex items-center gap-2 px-3 py-2 rounded ${showWatchedOnly ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {showWatchedOnly ? <FaStar /> : <FaRegStar />} {showWatchedOnly ? 'Watched' : 'Show Watched'}
          </button>
          <button onClick={seedAuctions} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700"><FaPlus /> Seed Sample Auctions</button>
        </div>
			</div>

			<div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<div className="relative">
						<FaSearch className="absolute left-3 top-3 text-gray-400" />
						<input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search load, origin, destination..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
						<option value="all">All Statuses</option>
						<option value="ACTIVE">Active</option>
						<option value="SCHEDULED">Scheduled</option>
						<option value="CLOSED">Closed</option>
					</select>
					<div className="flex items-center text-sm text-gray-600">Total: {filtered.length}</div>
				</div>
			</div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">No auctions found</div>
          ) : (
            filtered.map((a) => {
              if (!a) return null;
              
              // Debug logging for each auction (only log first few to avoid spam)
              if (filtered.indexOf(a) < 2) {
                console.log(`🔍 Auction ${filtered.indexOf(a)}:`, {
                  id: a.id,
                  hasLoad: !!a.load,
                  loadTitle: a?.load?.title,
                  hasCargoOwner: !!a?.load?.cargoOwner,
                  cargoOwnerName: getCargoOwnerName(a?.load),
                  hasLocations: !!a?.load?.locations,
                  locationsCount: a?.load?.locations?.length,
                });
              }
              
              const cargoOwnerName = getCargoOwnerName(a?.load);
              const pickupLocation = getLocationName(a?.load, 'PICKUP');
              const deliveryLocation = getLocationName(a?.load, 'DELIVERY');
              
              return (
              <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{a?.load?.title || 'Untitled Load'}</div>
                    {cargoOwnerName ? (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Owner: {cargoOwnerName}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-0.5 italic">Owner: Not available</div>
                    )}
                    <div className="text-sm text-gray-600 mt-1.5 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-gray-400 text-xs flex-shrink-0" />
                      <span className="truncate">{pickupLocation} → {deliveryLocation}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleWatch(a)} className="text-yellow-500 hover:text-yellow-600" title={watchedIds.has(a.id) ? 'Unwatch' : 'Watch'}>
                      {watchedIds.has(a.id) ? <FaStar /> : <FaRegStar />}
                    </button>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${biddingHelpers.getStatusColor(a.status)}-100 text-${biddingHelpers.getStatusColor(a.status)}-700`}>{a.status}</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaDollarSign className="text-gray-400" /> 
                    <span>Current: {a.currentBid ? biddingHelpers.formatCurrency(a.currentBid) : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaClock className="text-gray-400" /> 
                    <span>Ends in: {a.auctionEnd ? biddingHelpers.getTimeRemaining(a.auctionEnd) : '—'}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => openQuickBidModal(a)} className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 inline-flex items-center gap-2"><FaPlus /> Quick Bid</button>
                  <button onClick={() => openBidModal(a)} className="px-3 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 inline-flex items-center gap-2">Custom Bid</button>
                </div>
              </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Watch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ends In</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>No auctions found</td></tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleWatch(a)} className="text-yellow-500 hover:text-yellow-600" title={watchedIds.has(a.id) ? 'Unwatch' : 'Watch'}>
                          {watchedIds.has(a.id) ? <FaStar /> : <FaRegStar />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{a?.load?.title || 'Untitled Load'}</div>
                        {getCargoOwnerName(a?.load) && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Owner: {getCargoOwnerName(a?.load)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {getLocationName(a?.load, 'PICKUP')} → {getLocationName(a?.load, 'DELIVERY')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${biddingHelpers.getStatusColor(a.status)}-100 text-${biddingHelpers.getStatusColor(a.status)}-700`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{a.currentBid ? biddingHelpers.formatCurrency(a.currentBid) : '—'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-1">
                          <FaClock className="text-gray-400 text-xs" />
                          <span>{a.auctionEnd ? biddingHelpers.getTimeRemaining(a.auctionEnd) : '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => openQuickBidModal(a)} className="px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 text-sm">Quick Bid</button>
                          <button onClick={() => openBidModal(a)} className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm">Custom Bid</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

			{/* Quick Bid Modal */}
			{showQuickBidModal && selectedAuction && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
						<div className="p-6 border-b">
							<div className="text-lg font-semibold text-gray-900">Quick Bid</div>
							<div className="text-sm text-gray-600 mt-1">
								{selectedAuction?.load?.title || 'Untitled Load'}
							</div>
							{selectedAuction?.load?.cargoOwner && (
								<div className="text-xs text-gray-500 mt-1">
									Cargo Owner: {selectedAuction?.load?.cargoOwner?.profile?.firstName || selectedAuction?.load?.cargoOwner?.firstName || ''} {selectedAuction?.load?.cargoOwner?.profile?.lastName || selectedAuction?.load?.cargoOwner?.lastName || ''}
								</div>
							)}
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount (USD) *</label>
								<input 
									type="number" 
									min="0.01" 
									step="0.01"
									value={quickBidAmount} 
									onChange={(e) => setQuickBidAmount(e.target.value)} 
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" 
									placeholder="Enter bid amount"
									autoFocus
								/>
								<div className="text-xs text-gray-500 mt-1">
									{selectedAuction.currentBid ? (
										<>Current: {biddingHelpers.formatCurrency(selectedAuction.currentBid)} • Min increment: {selectedAuction.minimumBidIncrement || 0}</>
									) : (
										<>Reserve price: {selectedAuction.reservePrice ? biddingHelpers.formatCurrency(selectedAuction.reservePrice) : 'Not set'}</>
									)}
								</div>
							</div>
						</div>
						<div className="p-6 border-t flex items-center justify-end gap-2">
							<button 
								onClick={() => {
									setShowQuickBidModal(false);
									setSelectedAuction(null);
									setQuickBidAmount('');
								}} 
								className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
							>
								Cancel
							</button>
							<button 
								onClick={submitQuickBid} 
								className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700"
							>
								Submit Bid
							</button>
						</div>
					</div>
				</div>
			)}

			{showBidModal && selectedAuction && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4">
						<div className="p-6 border-b">
							<div className="text-lg font-semibold text-gray-900">Place Bid</div>
							<div className="text-sm text-gray-600 mt-1">{selectedAuction?.load?.origin} → {selectedAuction?.load?.destination}</div>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount (USD)</label>
								<input value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
								<div className="text-xs text-gray-500 mt-1">Current: {selectedAuction.currentBid ? biddingHelpers.formatCurrency(selectedAuction.currentBid) : '—'} • Min increment: {selectedAuction.minimumBidIncrement || 0}</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Proposed Pickup</label>
									<input type="datetime-local" value={proposedPickupDate} onChange={(e) => setProposedPickupDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Proposed Delivery</label>
									<input type="datetime-local" value={proposedDeliveryDate} onChange={(e) => setProposedDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Select Truck (optional)</label>
									<select value={selectedTruckId} onChange={(e) => setSelectedTruckId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
										<option value="">— None —</option>
										{trucks.map((t) => (
											<option key={t.id} value={t.id}>{t.plateNumber || t.name || t.id.slice(0,8)} • {t.make} {t.model}</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Select Driver (optional)</label>
									<select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
										<option value="">— None —</option>
										{drivers.map((d) => (
											<option key={d.id} value={d.id}>{d.firstName} {d.lastName} • {d.licenseNumber}</option>
										))}
									</select>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
								<textarea value={bidNotes} onChange={(e) => setBidNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} placeholder="Add any details about your offer, equipment, timing, etc." />
							</div>
						</div>
						<div className="p-6 border-t flex items-center justify-end gap-2">
							<button onClick={() => setShowBidModal(false)} className="px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
							<button onClick={placeBid} className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">Submit Bid</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TruckBidsPage;


