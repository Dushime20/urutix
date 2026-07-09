import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { createPortal } from 'react-dom';
import { biddingAPI, biddingHelpers } from '../services/biddingApi';
import { fleetApi } from '../services/fleetApi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { localToUTC } from '../utils/dateTime';
import { FaTimes, FaStar, FaRegStar, FaUser, FaArrowRight, FaClock } from 'react-icons/fa';
import { Grid, Table, Clock, Search, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import ModernLoader from '../components/common/ModernLoader';

const TruckBidsPage: React.FC = () => {
	const { compact: fmtBid } = useCurrencyFormat();
	const { user } = useAuth();
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
	const [advancePaymentPercentage, setAdvancePaymentPercentage] = useState<string>('');
	const [quickAdvancePaymentPercentage, setQuickAdvancePaymentPercentage] = useState<string>('');
	const [requireAdvancePayment, setRequireAdvancePayment] = useState<boolean>(true);
	const [quickRequireAdvancePayment, setQuickRequireAdvancePayment] = useState<boolean>(true);
	const [trucks, setTrucks] = useState<any[]>([]);
	const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
	const [loadingDrivers, setLoadingDrivers] = useState(false);
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

			console.log('📦 Auctions loaded:', auctionsList.length);
			setAuctions(auctionsList);

			// Record views for loaded auctions (best-effort)
			try {
				await Promise.all(auctionsList.slice(0, 10).map((a: any) =>
					biddingAPI.recordAuctionView(a.id)
				)).catch(() => { });
			} catch { }

			// Load watched auctions
			try {
				const watched = await biddingAPI.getWatchedAuctions();
				const ids = Array.isArray(watched?.data?.auctions)
					? watched.data.auctions.map((a: any) => a.id)
					: (Array.isArray(watched?.data) ? watched.data.map((a: any) => a.id) : []);
				setWatchedIds(new Set(ids));
			} catch { }
		} catch (e: any) {
			console.error('Error loading auctions:', e);
			if (e?.response?.status === 401) {
				toast.error('Session expired. Please login again.');
				// window.location.href = '/login';
			} else {
				toast.error('Failed to load auctions.');
			}
			setAuctions([]);
		} finally {
			setLoading(false);
		}
	}, [status, page, limit]);

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
		setQuickAdvancePaymentPercentage(''); // Reset to empty, user can set their preferred percentage
		setQuickRequireAdvancePayment(true); // Default to requiring advance payment
		// Reset dates
		setProposedPickupDate('');
		setProposedDeliveryDate('');
		setShowQuickBidModal(true);
	};

	const submitQuickBid = async () => {
		if (!selectedAuction) return;
		const amountNum = Number(quickBidAmount);
		if (!amountNum || amountNum <= 0) {
			toast.error('Enter a valid bid amount');
			return;
		}

		// Require pickup and delivery dates
		if (!proposedPickupDate) {
			toast.error('Please specify when you will pick up the cargo');
			return;
		}

		if (!proposedDeliveryDate) {
			toast.error('Please specify when you will deliver the cargo');
			return;
		}

		// Validate that delivery date is after pickup date
		const pickupDate = new Date(proposedPickupDate);
		const deliveryDate = new Date(proposedDeliveryDate);
		if (deliveryDate <= pickupDate) {
			toast.error('Delivery date must be after pickup date');
			return;
		}

		// Validate advance payment percentage if provided
		const advancePercentage = quickAdvancePaymentPercentage ? Number(quickAdvancePaymentPercentage) : undefined;
		if (advancePercentage !== undefined && (advancePercentage < 0 || advancePercentage > 100)) {
			toast.error('Advance payment percentage must be between 0 and 100');
			return;
		}

		// If advance payment is not required, percentage should be 0 or undefined
		if (!quickRequireAdvancePayment && advancePercentage !== undefined && advancePercentage > 0) {
			toast.error('Cannot specify advance payment percentage when advance payment is not required');
			return;
		}

		try {
			await biddingAPI.submitBid({
				loadId: selectedAuction.loadId,
				bidAmount: amountNum,
				bidCurrency: 'USD',
				proposedPickupDate: localToUTC(proposedPickupDate),
				proposedDeliveryDate: localToUTC(proposedDeliveryDate),
				bidNotes: 'Quick bid from Truck Owner',
				advancePaymentPercentage: quickRequireAdvancePayment ? advancePercentage : undefined,
				requireAdvancePayment: quickRequireAdvancePayment,
				bidDetails: {
					truckSpecifications: {},
				},
			});
			toast.success('Bid submitted successfully! View it in My Bids tab.');
			setShowQuickBidModal(false);
			setSelectedAuction(null);
			setQuickBidAmount('');
			setQuickAdvancePaymentPercentage('');
			setQuickRequireAdvancePayment(true);
			setProposedPickupDate('');
			setProposedDeliveryDate('');
			// Refresh auctions and myBids
			await Promise.all([loadAuctions()]);
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
		setAdvancePaymentPercentage(''); // Reset to empty, user can set their preferred percentage
		setRequireAdvancePayment(true); // Default to requiring advance payment
		setSelectedTruckId('');
		setSelectedDriverId('');
		setAvailableDrivers([]);
		try {
			// Use availability endpoint so only this truck owner's trucks are returned,
			// pre-filtered for the auction date window and no scheduling conflicts.
			const pickupDate = auction?.load?.pickupDate
				? new Date(auction.load.pickupDate).toISOString()
				: new Date().toISOString();
			const deliveryDate = auction?.load?.deliveryDate
				? new Date(auction.load.deliveryDate).toISOString()
				: new Date(Date.now() + 86_400_000).toISOString();

			const capacityWeight = auction?.load?.weight ?? auction?.load?.cargoWeight ?? undefined;

			const params: Record<string, string> = {
				pickupDateTime: pickupDate,
				deliveryDateTime: deliveryDate,
			};
			if (capacityWeight) params.capacityWeight = String(capacityWeight);

			const res = await api.get('/availability/trucks', { params });
			const availTrucks: any[] = res.data?.data ?? [];

			// Safety net: if the endpoint doesn't scope by owner server-side
			// (older deployment), filter client-side by ownerId === current user
			const myTrucks = availTrucks.filter(
				(t: any) => !t.ownerId || t.ownerId === user?.id
			);

			setTrucks(myTrucks);
		} catch {
			// Fallback: fetch fleet trucks and filter by owner client-side
			try {
				const truckList = await fleetApi.getTrucks({});
				setTrucks((truckList || []).filter((t: any) => !t.ownerId || t.ownerId === user?.id));
			} catch {
				setTrucks([]);
			}
		}
		setShowBidModal(true);
	};

	// Fetch available drivers (not currently in trips) when truck is selected
	const loadAvailableDrivers = async () => {
		if (!selectedTruckId) {
			setAvailableDrivers([]);
			return;
		}

		setLoadingDrivers(true);
		try {
			// Get all active drivers
			const allDrivers = await fleetApi.getDrivers({ status: 'ACTIVE' });

			// Filter to get only available drivers (drivers not currently in trips)
			// Available drivers are those without currentTripId
			const available = allDrivers.filter((driver: any) => {
				// Driver is available if they don't have a currentTripId
				return !driver.currentTripId;
			});

			setAvailableDrivers(available || []);
		} catch (error) {
			console.error('Error loading available drivers:', error);
			setAvailableDrivers([]);
			toast.error('Failed to load available drivers');
		} finally {
			setLoadingDrivers(false);
		}
	};

	// Handle truck selection - load available drivers when truck is selected
	const handleTruckSelection = (truckId: string) => {
		setSelectedTruckId(truckId);
		setSelectedDriverId(''); // Reset driver selection when truck changes
		if (truckId) {
			loadAvailableDrivers();
		} else {
			setAvailableDrivers([]);
		}
	};

	const placeBid = async () => {
		if (!selectedAuction) return;
		const amountNum = Number(bidAmount);
		if (!amountNum || amountNum <= 0) {
			toast.error('Enter a valid bid amount');
			return;
		}

		// Require truck selection
		if (!selectedTruckId) {
			toast.error('Please select a truck for this cargo');
			return;
		}

		// Require pickup date
		if (!proposedPickupDate) {
			toast.error('Please specify when you will pick up the cargo');
			return;
		}

		// Require delivery date
		if (!proposedDeliveryDate) {
			toast.error('Please specify when you will deliver the cargo');
			return;
		}

		// Validate that delivery date is after pickup date
		const pickupDate = new Date(proposedPickupDate);
		const deliveryDate = new Date(proposedDeliveryDate);
		if (deliveryDate <= pickupDate) {
			toast.error('Delivery date must be after pickup date');
			return;
		}

		// Validate advance payment percentage if provided
		const advancePercentage = advancePaymentPercentage ? Number(advancePaymentPercentage) : undefined;
		if (advancePercentage !== undefined && (advancePercentage < 0 || advancePercentage > 100)) {
			toast.error('Advance payment percentage must be between 0 and 100');
			return;
		}

		// If advance payment is not required, percentage should be 0 or undefined
		if (!requireAdvancePayment && advancePercentage !== undefined && advancePercentage > 0) {
			toast.error('Cannot specify advance payment percentage when advance payment is not required');
			return;
		}

		try {
			await biddingAPI.submitBid({
				loadId: selectedAuction.loadId,
				bidAmount: amountNum,
				bidCurrency: 'USD',
				proposedPickupDate: localToUTC(proposedPickupDate),
				proposedDeliveryDate: localToUTC(proposedDeliveryDate),
				bidNotes: bidNotes || undefined,
				advancePaymentPercentage: requireAdvancePayment ? advancePercentage : undefined,
				requireAdvancePayment: requireAdvancePayment,
				bidDetails: {
					truckSpecifications: { truckId: selectedTruckId },
					driverInfo: selectedDriverId ? { driverId: selectedDriverId } : undefined,
				},
			});
			toast.success('Bid submitted successfully! View it in My Bids tab.');
			setShowBidModal(false);
			// Refresh auctions and myBids
			await Promise.all([loadAuctions()]);
		} catch (e: any) {
			toast.error(e?.response?.data?.message || 'Failed to submit bid');
		}
	};

	// --- UI COMPONENTS (Copied from FleetOwnerDashboard) ---



	return (
		<div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-500/30 flex flex-col">

			<main className="flex-1 px-4 md:px-8 lg:px-12 xl:px-20 py-8 max-w-[1920px] mx-auto w-full relative z-0">

				{/* Header */}
				<div className="mb-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h1 className="mb-2 text-2xl sm:text-3xl font-bold text-gray-900">Cargo Bids</h1>
							<p className="text-sm text-gray-600">Real-time marketplace for active shipments</p>
						</div>
						<button
							onClick={() => { loadAuctions(); }}
							disabled={loading}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors shadow-sm"
						>
							<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
							<span className="hidden sm:inline">Refresh</span>
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-6">
					<div className="flex flex-col gap-3">
						<div className="w-full">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
								<input
									type="text"
									placeholder="Search routes, IDs..."
									value={search}
									onChange={(e) => { setSearch(e.target.value); setPage(1); }}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
								/>
							</div>
						</div>

						<div className="flex flex-col md:flex-row items-center gap-3 w-full">
							<div className="flex items-center gap-2 w-full md:w-auto">
								<Filter className="text-gray-400 w-4 h-4 flex-shrink-0" />
								<select
									value={status}
									onChange={(e) => { setStatus(e.target.value); setPage(1); }}
									className="flex-1 md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
								>
									<option value="all">All Statuses</option>
									<option value="ACTIVE">Active Auctions</option>
									<option value="SCHEDULED">Scheduled</option>
								</select>
							</div>

							<button
								onClick={() => setShowWatchedOnly(!showWatchedOnly)}
								className={`w-full md:w-auto px-4 py-2 border rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${showWatchedOnly
									? 'bg-yellow-50 text-yellow-700 border-yellow-200'
									: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
									}`}
							>
								{showWatchedOnly ? <FaStar className="text-yellow-500" /> : <FaRegStar className="text-gray-400" />}
								<span>Watchlist</span>
							</button>

							<div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 ml-auto">
								<button
									onClick={() => setView('cards')}
									className={`p-1.5 rounded-md transition-all ${view === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
									title="Grid View"
								>
									<Grid size={16} />
								</button>
								<button
									onClick={() => setView('table')}
									className={`p-1.5 rounded-md transition-all ${view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
									title="Table View"
								>
									<Table size={16} />
								</button>
							</div>
						</div>
					</div>
				</div>

				{view === 'cards' ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{loading ? (
							<ModernLoader isLoading={true} type="cards" items={6} columns={3} />
						) : filtered.length === 0 ? (
							<div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
								<div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
									<Filter className="text-gray-400" size={32} />
								</div>
								<h3 className="text-lg font-bold text-gray-900">No loads found</h3>
								<p className="text-sm">Try adjusting your filters or search criteria.</p>
								<button onClick={() => { setSearch(''); setStatus('all'); }} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Clear all filters</button>
							</div>
						) : (
							filtered.map((a) => {
								if (!a) return null;
								const pickupLocation = getLocationName(a?.load, 'PICKUP');
								const deliveryLocation = getLocationName(a?.load, 'DELIVERY');
								const timeLeft = a.auctionEnd ? biddingHelpers.getTimeRemaining(a.auctionEnd) : '00:00:00';

								return (
									<div key={a.id} className="relative group bg-white rounded-[3rem] p-1 border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 overflow-hidden flex flex-col">
										<div className="p-8 pb-4 flex-1">
											<div className="flex justify-between items-start mb-6">
												<div className="flex flex-wrap gap-2">
													<div className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm flex items-center gap-1.5 ${a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
														<span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
														{a.status}
													</div>
													<span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-slate-900/10">
														{a.auctionType || 'REVERSE'}
													</span>
												</div>
												<button
													onClick={(e) => { e.stopPropagation(); toggleWatch(a); }}
													className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${watchedIds.has(a.id) ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-slate-50 border border-slate-100 text-slate-300 hover:text-amber-500 hover:border-amber-100'}`}
												>
													<FaStar size={20} className={watchedIds.has(a.id) ? 'fill-current' : ''} />
												</button>
											</div>

											<div className="space-y-4">
												<div>
													<h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
														{a.load?.title || 'Unknown Cargo'}
													</h3>
													<p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 bg-slate-50 w-fit px-2 py-1 rounded">LOG ID: {a.id?.slice(0, 8) || 'N/A'}</p>
												</div>

												<div className="py-6 border-y border-gray-50 space-y-4">
													<div className="flex items-center justify-between">
														<div className="flex flex-col items-start gap-1">
															<span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price</span>
															<span className="text-2xl font-black text-emerald-600 italic">
																{a.currentBid ? fmtBid(a.currentBid) : '—'}
															</span>
														</div>
														<div className="text-right">
															<span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Weight</span>
															<span className="text-sm font-black text-slate-900">{a.load?.weight?.toLocaleString() || '0'} KG</span>
														</div>
													</div>

													<div className="flex items-center gap-4 py-4 px-5 bg-slate-50/80 rounded-2xl">
														<div className="flex-1 min-w-0">
															<p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Route</p>
															<div className="flex items-center gap-3">
																<span className="text-[11px] font-black text-slate-900 truncate uppercase">
																	{pickupLocation.split(',')[0]}
																</span>
																<FaArrowRight size={10} className="text-slate-300 shrink-0" />
																<span className="text-[11px] font-black text-slate-900 truncate uppercase">
																	{deliveryLocation.split(',')[0]}
																</span>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className="px-8 pb-8 pt-4 bg-slate-50/30">
											<div className="flex items-center justify-between mb-6">
												<div className="flex items-center gap-2 text-slate-400">
													<FaClock size={12} />
													<span className="text-[10px] font-black uppercase tracking-widest">{timeLeft} REMAINING</span>
												</div>
												<div className="text-right">
													<span className="text-[10px] font-black text-slate-900 tracking-tighter">0 ACTIVE OFFERS</span>
												</div>
											</div>

											<button
											onClick={() => openBidModal(a)}
											disabled={a.status !== 'ACTIVE'}
											className="w-full py-5 bg-white border-2 border-slate-50 text-[#8b919d] rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
										>
											CUSTOM BID
										</button>
										</div>
									</div>
								);
							})
						)}
					</div>
				) : (
					<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Load Details</th>
										<th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
										<th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
										<th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing</th>
										<th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time Remaining</th>
										<th className="px-6 py-4"></th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{loading ? (
										<tr><td className="px-6 py-12 text-center text-gray-500" colSpan={6}>Loading...</td></tr>
									) : filtered.length === 0 ? (
										<tr><td className="px-6 py-12 text-center text-gray-500" colSpan={6}>No auctions found matching your criteria.</td></tr>
									) : (
										filtered.map((a) => (
											<tr key={a.id} className="hover:bg-blue-50/30 transition-colors group">
												<td className="px-6 py-4">
													<div className="flex items-center gap-3">
														<button onClick={() => toggleWatch(a)} className={`transition-colors ${watchedIds.has(a.id) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
															{watchedIds.has(a.id) ? <FaStar /> : <FaRegStar />}
														</button>
														<div>
															<div className="font-bold text-gray-900">{a?.load?.title || 'Untitled Load'}</div>
															<div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
																<FaUser size={10} /> {getCargoOwnerName(a?.load) || 'Unknown Owner'}
															</div>
														</div>
													</div>
												</td>
												<td className="px-6 py-4">
													<div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
														<span className="max-w-[100px] truncate" title={getLocationName(a?.load, 'PICKUP')}>{getLocationName(a?.load, 'PICKUP')}</span>
														<FaArrowRight className="text-gray-300 text-xs flex-shrink-0" />
														<span className="max-w-[100px] truncate" title={getLocationName(a?.load, 'DELIVERY')}>{getLocationName(a?.load, 'DELIVERY')}</span>
													</div>
												</td>
												<td className="px-6 py-4">
													<span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
														{a.status}
													</span>
												</td>
												<td className="px-6 py-4">
													<div className="font-bold text-gray-900">{a.currentBid ? fmtBid(a.currentBid) : '—'}</div>
													<div className="text-xs text-gray-500">Current Bid</div>
												</td>
												<td className="px-6 py-4">
													<div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
														<Clock className="text-gray-400" size={14} />
														{a.auctionEnd ? biddingHelpers.getTimeRemaining(a.auctionEnd) : '—'}
													</div>
												</td>
												<td className="px-6 py-4 text-right">
													<button
														onClick={() => openBidModal(a)}
														className="px-4 py-2 rounded-lg bg-[#0f172a] text-white text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
													>
														Place Bid
													</button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}

			</main>

			{/* Quick Bid Modal */}
			{showQuickBidModal && selectedAuction && createPortal(
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
					<div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
						{/* Header */}
						<div className="px-10 py-8 border-b border-gray-100">
							<h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">Quick Bid</h2>
							<div className="mt-2 space-y-1">
								<p className="text-lg font-medium text-gray-600">{selectedAuction?.load?.title || 'Untitled Load'}</p>
								<p className="text-sm text-gray-400 font-medium">
									Cargo Owner: {selectedAuction?.load?.cargoOwner?.profile?.firstName || ''} {selectedAuction?.load?.cargoOwner?.profile?.lastName || 'Admin'}
								</p>
							</div>
						</div>

						{/* Form Content */}
						<div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
							{/* Bid Amount Input */}
							<div className="space-y-3">
								<label className="block text-base font-bold text-gray-700">Bid Amount (USD) *</label>
								<div className="relative group">
									<input
										type="number"
										value={quickBidAmount}
										onChange={(e) => setQuickBidAmount(e.target.value)}
										className="w-full h-16 px-6 bg-white border-2 border-gray-200 rounded-2xl text-xl font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#345E85] transition-all"
										placeholder="0.00"
									/>
								</div>
								<div className="text-sm font-medium text-gray-400">
									Reserve price: {selectedAuction.reservePrice ? fmtBid(selectedAuction.reservePrice) : '—'}
								</div>
							</div>

							{/* Advance Payment Section */}
							<div className="space-y-6">
								<label className="flex items-center gap-3 cursor-pointer group">
									<div className="relative flex items-center justify-center">
										<input
											type="checkbox"
											checked={quickRequireAdvancePayment}
											onChange={(e) => {
												setQuickRequireAdvancePayment(e.target.checked);
												if (!e.target.checked) setQuickAdvancePaymentPercentage('');
											}}
											className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
										/>
										<svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
											<path d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<span className="text-base font-bold text-gray-700">Require advance payment before trip starts</span>
								</label>

								{quickRequireAdvancePayment && (
									<div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
										<label className="block text-base font-bold text-gray-700">Advance Payment Percentage (Optional)</label>
										<input
											type="number"
											value={quickAdvancePaymentPercentage}
											onChange={(e) => setQuickAdvancePaymentPercentage(e.target.value)}
											className="w-full h-14 px-6 bg-white border-2 border-gray-100 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
											placeholder="e.g., 70 (for 70% advance payment)"
										/>
										<p className="text-sm text-gray-400 leading-relaxed font-medium">
											Percentage of transportation fee to be paid before trip starts (0-100). Leave empty to use system default.
										</p>
									</div>
								)}
							</div>

							{/* Schedule Delivery Box */}
							<div className="bg-[#f0f9ff]/80 p-8 rounded-[1.5rem] border border-blue-100 space-y-6">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#0369a1]">
										<FaClock size={18} />
									</div>
									<h4 className="text-lg font-extrabold text-[#0369a1]">Schedule Delivery</h4>
								</div>

								<div className="grid grid-cols-2 gap-6">
									<div className="space-y-2">
										<label className="text-sm font-bold text-gray-700">Pickup Date & Time *</label>
										<input
											type="datetime-local"
											value={proposedPickupDate}
											onChange={(e) => setProposedPickupDate(e.target.value)}
											className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-400 transition-all"
										/>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-bold text-gray-700">Delivery Date & Time *</label>
										<input
											type="datetime-local"
											value={proposedDeliveryDate}
											onChange={(e) => setProposedDeliveryDate(e.target.value)}
											className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-400 transition-all"
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Footer Actions */}
						<div className="p-10 pt-0 flex items-center justify-end gap-4">
							<button
								onClick={() => {
									setShowQuickBidModal(false);
									setSelectedAuction(null);
								}}
								className="px-10 py-4 bg-gray-100 text-gray-700 rounded-xl text-base font-bold hover:bg-gray-200 transition-all active:scale-95"
							>
								Cancel
							</button>
							<button
								onClick={submitQuickBid}
								disabled={!quickBidAmount || !proposedPickupDate || !proposedDeliveryDate}
								className="px-10 py-4 bg-[#94a3b8] text-white rounded-xl text-base font-bold hover:bg-[#64748b] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Submit Bid
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}

			{showBidModal && selectedAuction && createPortal(
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
					<div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
						{/* Header */}
						<div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
							<div>
								<h2 className="text-xl font-bold text-gray-900 tracking-tight">Custom Bid</h2>
								<p className="text-sm text-gray-500 mt-0.5">{selectedAuction?.load?.title || 'Untitled Shipment'}</p>
							</div>
							<button
								onClick={() => setShowBidModal(false)}
								className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
							>
								<FaTimes size={18} />
							</button>
						</div>

						{/* Form Content */}
						<div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
							{/* Bid Amount */}
							<div className="space-y-3">
								<label className="block text-sm font-bold text-gray-700">Bid Amount (USD) *</label>
								<div className="relative">
									<span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">$</span>
									<input
										value={bidAmount}
										onChange={(e) => setBidAmount(e.target.value)}
										type="number"
										className="w-full h-14 pl-12 pr-6 bg-white border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:border-[#345E85] transition-all"
										placeholder="0.00"
									/>
								</div>
								<div className="flex items-center gap-4 text-xs font-medium">
									<span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Floor: {fmtBid(selectedAuction.currentBid || selectedAuction.reservePrice || 0)}</span>
									<span className="text-gray-400">Min. Increment: {fmtBid(selectedAuction.minimumBidIncrement || 100)}</span>
								</div>
							</div>

							{/* Truck & Driver */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<label className="block text-sm font-bold text-gray-700">Select Truck *</label>
									<select
										value={selectedTruckId}
										onChange={(e) => handleTruckSelection(e.target.value)}
										className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#345E85] transition-all cursor-pointer"
									>
										<option value="">Select Unit</option>
										{trucks.map((t) => (
											<option key={t.id} value={t.id}>{t.plateNumber || t.id.slice(0, 8)} - {t.make}</option>
										))}
									</select>
								</div>
								<div className="space-y-2">
									<label className="block text-sm font-bold text-gray-700">Select Driver</label>
									<select
										value={selectedDriverId}
										onChange={(e) => setSelectedDriverId(e.target.value)}
										disabled={!selectedTruckId || loadingDrivers}
										className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#345E85] transition-all cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
									>
										<option value="">{loadingDrivers ? 'Loading...' : 'Select Driver'}</option>
										{availableDrivers.map((d) => (
											<option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
										))}
									</select>
								</div>
							</div>

							{/* Schedule */}
							<div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-5">
								<div className="flex items-center gap-2.5">
									<div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-[#0369a1]">
										<FaClock size={14} />
									</div>
									<h4 className="text-sm font-bold text-[#0369a1]">Schedule</h4>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-gray-600 px-1">Pickup Date *</label>
										<input
											type="datetime-local"
											value={proposedPickupDate}
											onChange={(e) => setProposedPickupDate(e.target.value)}
											className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400"
										/>
									</div>
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-gray-600 px-1">Delivery Date *</label>
										<input
											type="datetime-local"
											value={proposedDeliveryDate}
											onChange={(e) => setProposedDeliveryDate(e.target.value)}
											className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400"
										/>
									</div>
								</div>
							</div>

							{/* Advance Payment */}
							<div className="space-y-5">
								<label className="flex items-center gap-3 cursor-pointer group">
									<input
										type="checkbox"
										checked={requireAdvancePayment}
										onChange={(e) => {
											setRequireAdvancePayment(e.target.checked);
											if (!e.target.checked) setAdvancePaymentPercentage('');
										}}
										className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span className="text-sm font-bold text-gray-700">Require advance payment before trip</span>
								</label>

								{requireAdvancePayment && (
									<div className="animate-in slide-in-from-top-2 duration-300 space-y-2 pl-8">
										<label className="block text-xs font-bold text-gray-600">Percentage (0-100)</label>
										<div className="relative max-w-[200px]">
											<input
												type="number"
												value={advancePaymentPercentage}
												onChange={(e) => setAdvancePaymentPercentage(e.target.value)}
												className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-500"
												placeholder="70"
											/>
											<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">%</span>
										</div>
									</div>
								)}
							</div>

							{/* Notes */}
							<div className="space-y-2">
								<label className="block text-sm font-bold text-gray-700">Additional Notes</label>
								<textarea
									value={bidNotes}
									onChange={(e) => setBidNotes(e.target.value)}
									className="w-full p-5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#345E85] transition-all min-h-[120px] resize-none"
									placeholder="Add any additional notes..."
								/>
							</div>
						</div>

						{/* Footer */}
						<div className="px-8 py-6 border-t bg-gray-50 flex items-center justify-end gap-3 shrink-0">
							<button
								onClick={() => setShowBidModal(false)}
								className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95"
							>
								Cancel
							</button>
							<button
								onClick={placeBid}
								disabled={!bidAmount || !selectedTruckId || !proposedPickupDate || !proposedDeliveryDate}
								className="px-8 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
							>
								Submit Bid
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}
		</div>
	);
};

export default TruckBidsPage;


