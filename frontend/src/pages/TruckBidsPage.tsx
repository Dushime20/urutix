import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { biddingAPI, biddingHelpers } from '../services/biddingApi';
import { fleetApi } from '../services/fleetApi';
import { FaSearch, FaGavel, FaDollarSign, FaClock, FaPlus, FaStar, FaRegStar, FaMapMarkerAlt, FaTimes, FaHistory, FaCheckCircle, FaHourglass, FaEye, FaBox, FaRuler, FaWeight, FaRoute, FaCalendarAlt, FaBuilding, FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import { Grid, Table } from 'lucide-react';
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
	const [showDetailsModal, setShowDetailsModal] = useState(false);
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
	
	// Track user's past bids to prevent re-bidding
	const [myBids, setMyBids] = useState<any[]>([]);
	const [myBidLoadIds, setMyBidLoadIds] = useState<Set<string>>(new Set());
	const [loadingMyBids, setLoadingMyBids] = useState(false);
	const [activeTab, setActiveTab] = useState<'auctions' | 'my-bids'>('auctions');

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

	// Load user's past bids to prevent re-bidding
	const loadMyBids = useCallback(async () => {
		setLoadingMyBids(true);
		try {
			const response = await biddingAPI.getMyBids();
			let bidsList: any[] = [];
			if (Array.isArray(response?.data)) {
				bidsList = response.data;
			} else if (Array.isArray(response?.data?.bids)) {
				bidsList = response.data.bids;
			} else if (Array.isArray(response?.data?.data)) {
				bidsList = response.data.data;
			}
			
			setMyBids(bidsList);
			// Create a set of loadIds that user has already bid on
			const loadIds = new Set(bidsList.map((bid: any) => bid.loadId || bid.load?.id));
			setMyBidLoadIds(loadIds);
			console.log('📋 My bids loaded:', bidsList.length, 'Load IDs:', Array.from(loadIds));
		} catch (e: any) {
			console.error('Error loading my bids:', e);
			if (e?.response?.status === 401) {
				toast.error('Session expired. Please login again.');
				// Optional: Redirect to login or triggering a global auth event
				// window.location.href = '/login'; 
			}
			setMyBids([]);
			setMyBidLoadIds(new Set());
		} finally {
			setLoadingMyBids(false);
		}
	}, []);

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
		loadMyBids(); // Load user's past bids
	}, [status, page, limit, loadMyBids]);

	// Auto-refresh auctions every 30 seconds to see new bids from cargo owners
	useEffect(() => {
		if (status === 'ACTIVE') {
			const interval = setInterval(() => {
				loadAuctions();
			}, 30000); // Refresh every 30 seconds

			return () => clearInterval(interval);
		}
	}, [status, loadAuctions]);

	// Helper function to check if user has already bid on an auction
	const hasUserBidOnAuction = useCallback((auction: any) => {
		return myBidLoadIds.has(auction?.loadId) || myBidLoadIds.has(auction?.load?.id);
	}, [myBidLoadIds]);

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

	// Auctions user has NOT bid on yet (available for bidding)
	const availableAuctions = useMemo(() => {
		return filtered.filter((a) => {
			// 1. User must not have already bid on it
			if (hasUserBidOnAuction(a)) return false;

			// 2. Auction must be in a "biddable" state (ACTIVE or SCHEDULED)
			// CLOSED, CANCELLED, EXPIRED, etc. should not be shown in "Available"
			const isAuctionOpen = ['ACTIVE', 'SCHEDULED'].includes(a.status);
			if (!isAuctionOpen) return false;

			// 3. Load must not be already assigned or in transit
			// Even if auction is technically active, if load is assigned, you can't bid
			const unavailableLoadStatuses = ['ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
			if (a.load?.status && unavailableLoadStatuses.includes(a.load.status)) return false;

			return true;
		});
	}, [filtered, hasUserBidOnAuction]);



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

	const openDetailsModal = (auction: any) => {
		setSelectedAuction(auction);
		setShowDetailsModal(true);
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
				proposedPickupDate: proposedPickupDate,
				proposedDeliveryDate: proposedDeliveryDate,
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
			// Refresh auctions and myBids, then switch to My Bids tab
			await Promise.all([loadAuctions(), loadMyBids()]);
			setActiveTab('my-bids'); // Switch to My Bids tab to show the submitted bid
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
			// Only load trucks initially, drivers will be loaded when truck is selected
			const truckList = await fleetApi.getTrucks({});
			setTrucks(truckList || []);
		} catch {
			setTrucks([]);
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
				proposedPickupDate: proposedPickupDate,
				proposedDeliveryDate: proposedDeliveryDate,
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
			// Refresh auctions and myBids, then switch to My Bids tab
			await Promise.all([loadAuctions(), loadMyBids()]);
			setActiveTab('my-bids'); // Switch to My Bids tab to show the submitted bid
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
					{/* View Mode Toggle */}
					<div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
						<button
							onClick={() => setView('cards')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'cards'
								? 'bg-gray-900 text-white'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
								}`}
						>
							<Grid className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Cards</span>
						</button>
						<button
							onClick={() => setView('table')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'table'
								? 'bg-gray-900 text-white'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
								}`}
						>
							<Table className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Table</span>
						</button>
					</div>
					<button onClick={() => setShowWatchedOnly((v) => !v)} className={`inline-flex items-center gap-2 px-3 py-2 rounded text-xs sm:text-sm ${showWatchedOnly ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
						{showWatchedOnly ? <FaStar /> : <FaRegStar />} {showWatchedOnly ? 'Watched' : 'Show Watched'}
					</button>
					<button onClick={seedAuctions} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs sm:text-sm"><FaPlus /> Seed Samples</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-gray-200 mb-6">
				<button
					onClick={() => setActiveTab('auctions')}
					className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'auctions'
						? 'border-primary-600 text-primary-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
				>
					<div className="flex items-center gap-2">
						<FaGavel />
						Available Auctions
						<span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
							{availableAuctions.length}
						</span>
					</div>
				</button>
				<button
					onClick={() => setActiveTab('my-bids')}
					className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my-bids'
						? 'border-primary-600 text-primary-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
				>
					<div className="flex items-center gap-2">
						<FaHistory />
						My Past Bids
						<span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
							{myBids.length}
						</span>
					</div>
				</button>
			</div>

			{activeTab === 'auctions' ? (
				<>
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

							</select>
							<div className="flex items-center text-sm text-gray-600">Total: {availableAuctions.length}</div>
						</div>
					</div>

					{view === 'cards' ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{loading ? (
								<div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
							) : availableAuctions.length === 0 ? (
								<div className="col-span-full text-center py-8 text-gray-500">No available auctions found. Check your past bids or try different filters.</div>
							) : (
								availableAuctions.map((a) => {
									if (!a) return null;
									const cargoOwnerName = getCargoOwnerName(a?.load);
									const pickupLocation = getLocationName(a?.load, 'PICKUP');
									const deliveryLocation = getLocationName(a?.load, 'DELIVERY');
									const alreadyBidded = hasUserBidOnAuction(a);

									return (
										<div key={a.id} className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${alreadyBidded ? 'opacity-75 bg-gray-50' : ''}`}>
											<div className="flex items-start justify-between">
												<div className="flex-1 min-w-0">
													<div className="font-semibold text-gray-900 truncate">{a?.load?.title || 'Untitled Load'}</div>
													{cargoOwnerName ? (
														<div className="text-xs text-gray-500 mt-0.5">Owner: {cargoOwnerName}</div>
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
												{alreadyBidded ? (
													<div className="w-full py-2 px-3 bg-gray-100 text-gray-500 rounded text-sm text-center font-medium flex items-center justify-center gap-2">
														<FaCheckCircle className="text-green-500" /> Bid Submitted
													</div>
												) : (
													<>
														<button onClick={() => openDetailsModal(a)} className="px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex items-center gap-2 text-sm"><FaEye /> Details</button>
														<button onClick={() => openQuickBidModal(a)} className="px-3 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 inline-flex items-center gap-2 text-sm"><FaPlus /> Quick Bid</button>
														<button onClick={() => openBidModal(a)} className="px-3 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 inline-flex items-center gap-2 text-sm">Custom Bid</button>
													</>
												)}
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
										) : availableAuctions.length === 0 ? (
											<tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>No available auctions found</td></tr>
										) : (
											availableAuctions.map((a) => {
												const alreadyBidded = hasUserBidOnAuction(a);
												return (
													<tr key={a.id} className={alreadyBidded ? 'bg-gray-50' : ''}>
														<td className="px-4 py-3">
															<button onClick={() => toggleWatch(a)} className="text-yellow-500 hover:text-yellow-600" title={watchedIds.has(a.id) ? 'Unwatch' : 'Watch'}>
																{watchedIds.has(a.id) ? <FaStar /> : <FaRegStar />}
															</button>
														</td>
														<td className="px-4 py-3">
															<div className="font-medium text-gray-900">{a?.load?.title || 'Untitled Load'}</div>
															{getCargoOwnerName(a?.load) && (
																<div className="text-xs text-gray-500 mt-0.5">Owner: {getCargoOwnerName(a?.load)}</div>
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
															{alreadyBidded ? (
																<span className="text-xs font-medium text-green-600 inline-flex items-center gap-1">
																	<FaCheckCircle /> Bid Placed
																</span>
															) : (
																<div className="inline-flex items-center gap-2">
																	<button onClick={() => openDetailsModal(a)} className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"><FaEye className="inline mr-1"/> Details</button>
																	<button onClick={() => openQuickBidModal(a)} className="px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 text-sm">Quick Bid</button>
																	<button onClick={() => openBidModal(a)} className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm">Custom Bid</button>
																</div>
															)}
														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</>
			) : (
				// My Bids Tab Content
				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load / Auction</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">My Bid Amount</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid Status</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid Notes</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{loadingMyBids ? (
									<tr><td className="px-6 py-8 text-center text-gray-500" colSpan={5}>Loading your bids...</td></tr>
								) : myBids.length === 0 ? (
									<tr><td className="px-6 py-8 text-center text-gray-500" colSpan={5}>You haven't placed any bids yet.</td></tr>
								) : (
									myBids.map((bid) => (
										<tr key={bid.id}>
											<td className="px-6 py-4">
												<div className="text-sm font-medium text-gray-900">{bid.load?.title || 'Unknown Load'}</div>
												<div className="text-xs text-gray-500 mt-0.5">
													{getLocationName(bid.load, 'PICKUP')} → {getLocationName(bid.load, 'DELIVERY')}
												</div>
											</td>
											<td className="px-6 py-4 text-sm font-bold text-gray-900">
												{biddingHelpers.formatCurrency(bid.amount || bid.bidAmount)}
											</td>
											<td className="px-6 py-4">
												<span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
													${bid.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
														bid.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
															'bg-yellow-100 text-yellow-800'}`}>
													{bid.status || 'PENDING'}
												</span>
											</td>
											<td className="px-6 py-4 text-sm text-gray-500">
												{new Date(bid.createdAt).toLocaleDateString()} {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</td>
											<td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={bid.notes || bid.bidNotes}>
												{bid.notes || bid.bidNotes || '-'}
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
							<div>
								<label className="flex items-center gap-2 mb-2">
									<input
										type="checkbox"
										checked={quickRequireAdvancePayment}
										onChange={(e) => {
											setQuickRequireAdvancePayment(e.target.checked);
											if (!e.target.checked) {
												setQuickAdvancePaymentPercentage(''); // Clear percentage if not required
											}
										}}
										className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
									/>
									<span className="text-sm font-medium text-gray-700">
										Require advance payment before trip starts
									</span>
								</label>
								{quickRequireAdvancePayment && (
									<div className="mt-2">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Advance Payment Percentage (Optional)
										</label>
										<input
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={quickAdvancePaymentPercentage}
											onChange={(e) => setQuickAdvancePaymentPercentage(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
											placeholder="e.g., 70 (for 70% advance payment)"
										/>
										<div className="text-xs text-gray-500 mt-1">
											Percentage of transportation fee to be paid before trip starts (0-100). Leave empty to use system default.
										</div>
									</div>
								)}
								{!quickRequireAdvancePayment && (
									<div className="text-xs text-gray-500 mt-1">
										Trip can start without advance payment. Payment will be processed after trip completion.
									</div>
								)}
							</div>

							{/* Delivery Schedule Section - Required */}
							<div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-primary-200">
								<div className="flex items-center gap-2 mb-3">
									<FaClock className="text-primary-600" />
									<h4 className="text-sm font-semibold text-gray-900">Schedule Delivery</h4>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-semibold text-gray-900 mb-1.5">
											Pickup Date & Time <span className="text-red-500">*</span>
										</label>
										<input
											type="datetime-local"
											value={proposedPickupDate}
											onChange={(e) => setProposedPickupDate(e.target.value)}
											required
											className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-gray-900 mb-1.5">
											Delivery Date & Time <span className="text-red-500">*</span>
										</label>
										<input
											type="datetime-local"
											value={proposedDeliveryDate}
											onChange={(e) => setProposedDeliveryDate(e.target.value)}
											required
											min={proposedPickupDate || undefined}
											className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
										/>
									</div>
								</div>
							</div>
						</div>
						<div className="p-6 border-t flex items-center justify-end gap-2">
							<button
								onClick={() => {
									setShowQuickBidModal(false);
									setSelectedAuction(null);
									setQuickBidAmount('');
									setProposedPickupDate('');
									setProposedDeliveryDate('');
								}}
								className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
							>
								Cancel
							</button>
							<button
								onClick={submitQuickBid}
								disabled={!quickBidAmount || Number(quickBidAmount) <= 0 || !proposedPickupDate || !proposedDeliveryDate}
								className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								Submit Bid
							</button>
						</div>
					</div>
				</div>
			)}

			{showBidModal && selectedAuction && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<div className="p-6 border-b bg-gradient-to-r from-primary-50 to-blue-50">
							<div className="flex items-center justify-between">
								<div>
									<div className="text-xl font-bold text-gray-900 flex items-center gap-2">
										<FaGavel className="text-primary-600" />
										Place Your Bid
									</div>
									<div className="text-sm text-gray-600 mt-1.5">
										{selectedAuction?.load?.title || 'Untitled Load'}
									</div>
									{selectedAuction?.load && (
										<div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
											<FaMapMarkerAlt className="text-primary-500" />
											<span>{getLocationName(selectedAuction.load, 'PICKUP')} → {getLocationName(selectedAuction.load, 'DELIVERY')}</span>
										</div>
									)}
								</div>
								<button
									onClick={() => setShowBidModal(false)}
									className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
								>
									<FaTimes className="w-5 h-5" />
								</button>
							</div>
						</div>
						<div className="p-6 space-y-5">
							{/* Bid Amount */}
							<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
								<label className="block text-sm font-semibold text-gray-900 mb-2">
									Bid Amount (USD) <span className="text-red-500">*</span>
								</label>
								<input
									value={bidAmount}
									onChange={(e) => setBidAmount(e.target.value)}
									type="number"
									min="0.01"
									step="0.01"
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold"
									placeholder="Enter your bid amount"
								/>
								<div className="flex items-center gap-4 mt-2 text-xs">
									{selectedAuction.currentBid && (
										<span className="text-gray-600">
											Current: <span className="font-semibold text-gray-900">{biddingHelpers.formatCurrency(selectedAuction.currentBid)}</span>
										</span>
									)}
									{selectedAuction.minimumBidIncrement && (
										<span className="text-gray-600">
											Min increment: <span className="font-semibold text-gray-900">{biddingHelpers.formatCurrency(selectedAuction.minimumBidIncrement)}</span>
										</span>
									)}
								</div>
							</div>

							{/* Advance Payment Section */}
							<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
								<label className="flex items-center gap-3 mb-3 cursor-pointer">
									<input
										type="checkbox"
										checked={requireAdvancePayment}
										onChange={(e) => {
											setRequireAdvancePayment(e.target.checked);
											if (!e.target.checked) {
												setAdvancePaymentPercentage(''); // Clear percentage if not required
											}
										}}
										className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
									/>
									<div>
										<span className="text-sm font-semibold text-gray-900">
											Require advance payment before trip starts
										</span>
										<p className="text-xs text-gray-600 mt-0.5">
											Enable this to require payment before the trip begins
										</p>
									</div>
								</label>

								{requireAdvancePayment && (
									<div className="mt-4 pl-8 border-l-2 border-primary-200">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Advance Payment Percentage <span className="text-gray-500 font-normal">(Optional)</span>
										</label>
										<div className="relative">
											<input
												type="number"
												min="0"
												max="100"
												step="0.1"
												value={advancePaymentPercentage}
												onChange={(e) => setAdvancePaymentPercentage(e.target.value)}
												className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
												placeholder="e.g., 70"
											/>
											<span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
										</div>
										<div className="text-xs text-gray-500 mt-2 flex items-start gap-1">
											<span className="text-blue-600">ℹ️</span>
											<span>Percentage of transportation fee to be paid before trip starts (0-100). Leave empty to use system default (70%).</span>
										</div>
									</div>
								)}

								{!requireAdvancePayment && (
									<div className="mt-3 pl-8">
										<div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
											<span className="font-medium">Note:</span> Trip can start without advance payment. Payment will be processed after trip completion.
										</div>
									</div>
								)}
							</div>
							{/* Delivery Schedule Section - Required */}
							<div className="bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-lg border-2 border-primary-200">
								<div className="flex items-center gap-2 mb-4">
									<FaClock className="text-primary-600 text-lg" />
									<h3 className="text-lg font-semibold text-gray-900">Schedule Delivery</h3>
								</div>
								<p className="text-sm text-gray-600 mb-4">
									Specify when you will pick up the cargo and when you will deliver it. This helps the cargo owner plan their operations.
								</p>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-semibold text-gray-900 mb-2">
											Pickup Date & Time <span className="text-red-500">*</span>
										</label>
										<input
											type="datetime-local"
											value={proposedPickupDate}
											onChange={(e) => setProposedPickupDate(e.target.value)}
											required
											className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium"
										/>
										<div className="text-xs text-gray-600 mt-1.5">
											When will you pick up the cargo?
										</div>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-900 mb-2">
											Delivery Date & Time <span className="text-red-500">*</span>
										</label>
										<input
											type="datetime-local"
											value={proposedDeliveryDate}
											onChange={(e) => setProposedDeliveryDate(e.target.value)}
											required
											min={proposedPickupDate || undefined}
											className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium"
										/>
										<div className="text-xs text-gray-600 mt-1.5">
											When will you deliver the cargo?
										</div>
									</div>
								</div>
								{proposedPickupDate && proposedDeliveryDate && (
									<div className="mt-4 p-3 bg-white rounded-lg border border-primary-200">
										<div className="flex items-center gap-2 text-sm">
											<FaClock className="text-primary-600" />
											<span className="font-medium text-gray-900">Estimated Duration: </span>
											<span className="text-gray-700">
												{(() => {
													const pickup = new Date(proposedPickupDate);
													const delivery = new Date(proposedDeliveryDate);
													const diffMs = delivery.getTime() - pickup.getTime();
													const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
													const diffDays = Math.floor(diffHours / 24);
													const hours = diffHours % 24;
													if (diffDays > 0) {
														return `${diffDays} day${diffDays > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
													}
													return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
												})()}
											</span>
										</div>
									</div>
								)}
							</div>

							{/* Truck Selection - Required */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Select Truck <span className="text-red-500">*</span>
								</label>
								<select
									value={selectedTruckId}
									onChange={(e) => handleTruckSelection(e.target.value)}
									className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
									required
								>
									<option value="">— Select Truck —</option>
									{trucks.map((t) => (
										<option key={t.id} value={t.id}>
											{t.plateNumber || t.name || t.id.slice(0, 8)} • {t.make} {t.model}
										</option>
									))}
								</select>
								<div className="text-xs text-gray-500 mt-1">
									Select the truck you want to use for this cargo shipment
								</div>
							</div>

							{/* Driver Selection - Only shown after truck is selected */}
							{selectedTruckId && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Select Driver <span className="text-gray-500 font-normal">(Optional)</span>
									</label>
									{loadingDrivers ? (
										<div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
											<span className="text-sm text-gray-500">Loading available drivers...</span>
										</div>
									) : (
										<select
											value={selectedDriverId}
											onChange={(e) => setSelectedDriverId(e.target.value)}
											className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
										>
											<option value="">— Select Driver (Optional) —</option>
											{availableDrivers.length === 0 ? (
												<option value="" disabled>No available drivers (all drivers are currently on trips)</option>
											) : (
												availableDrivers.map((d) => (
													<option key={d.id} value={d.id}>
														{d.firstName} {d.lastName} {d.licenseNumber ? `• ${d.licenseNumber}` : ''}
													</option>
												))
											)}
										</select>
									)}
									<div className="text-xs text-gray-500 mt-1">
										{availableDrivers.length === 0
											? 'No drivers are currently available (all drivers are on trips)'
											: `Showing ${availableDrivers.length} available driver(s) (not currently on trips)`
										}
									</div>
								</div>
							)}

							{/* Notes Section */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Additional Notes <span className="text-gray-500 font-normal">(Optional)</span>
								</label>
								<textarea
									value={bidNotes}
									onChange={(e) => setBidNotes(e.target.value)}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
									rows={4}
									placeholder="Add any details about your offer, equipment, timing, special requirements, etc."
								/>
								<div className="text-xs text-gray-500 mt-1">
									Provide any additional information that might help the cargo owner make a decision.
								</div>
							</div>
						</div>
						<div className="p-6 border-t bg-gray-50 flex items-center justify-between gap-3">
							<button
								onClick={() => setShowBidModal(false)}
								className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={placeBid}
								disabled={!bidAmount || Number(bidAmount) <= 0 || !selectedTruckId || !proposedPickupDate || !proposedDeliveryDate}
								className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
							>
								Submit Bid
							</button>
						</div>
					</div>
				</div>
			)}


			{/* Details Modal */}
			{showDetailsModal && selectedAuction && createPortal(
				<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100000] p-4 overflow-hidden">
					<div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col animate-fade-in">
						<div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold text-gray-900">Cargo Details</h2>
								<span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-${biddingHelpers.getStatusColor(selectedAuction.status)}-100 text-${biddingHelpers.getStatusColor(selectedAuction.status)}-700`}>
									{selectedAuction.status}
								</span>
							</div>
							<button
								onClick={() => setShowDetailsModal(false)}
								className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
							>
								<FaTimes className="w-6 h-6" />
							</button>
						</div>
						<div className="p-6 space-y-8">
							{/* Basic Info */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div className="space-y-6">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
											<FaBox className="text-gray-400" /> Cargo Information
										</h3>
										<div className="bg-gray-50 rounded-lg p-4 space-y-4">
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Title</label>
												<p className="text-gray-900 font-medium text-lg">{selectedAuction.load?.title || 'Untitled Cargo'}</p>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</label>
													<p className="text-gray-900">{selectedAuction.load?.cargoType || 'General'}</p>
												</div>
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</label>
													<p className="text-gray-900 flex items-center gap-2">
														<FaWeight className="text-gray-400" />
														{selectedAuction.load?.weight?.toLocaleString() || '—'} kg
													</p>
												</div>
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</label>
													<p className="text-gray-900 flex items-center gap-2">
														<FaBox className="text-gray-400" />
														{selectedAuction.load?.volume || '—'} m³
													</p>
												</div>
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</label>
													<p className="text-gray-900 flex items-center gap-2">
														<FaRuler className="text-gray-400" />
														{selectedAuction.load?.length ? `${selectedAuction.load.length}x${selectedAuction.load.width}x${selectedAuction.load.height} m` : '—'}
													</p>
												</div>
											</div>
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
												<p className="text-gray-700 text-sm mt-1 leading-relaxed">{selectedAuction.load?.description || 'No description provided.'}</p>
											</div>
										</div>
									</div>

									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
											<FaUser className="text-gray-400" /> Cargo Owner
										</h3>
										<div className="bg-gray-50 rounded-lg p-4 space-y-3">
											<div className="flex items-center gap-3">
												<div className="bg-white p-2 rounded-full shadow-sm">
													<FaBuilding className="text-gray-400 w-5 h-5" />
												</div>
												<div>
													<p className="text-sm font-medium text-gray-900">{selectedAuction.load?.cargoOwnerCompany || 'Company Details Hidden'}</p>
													<p className="text-xs text-gray-500">Verified Shipper</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<div className="bg-white p-2 rounded-full shadow-sm">
													<FaUser className="text-gray-400 w-5 h-5" />
												</div>
												<div>
													<p className="text-sm font-medium text-gray-900">{getCargoOwnerName(selectedAuction.load) || 'Contact Hidden'}</p>
													<p className="text-xs text-gray-500">Representative</p>
												</div>
											</div>
											{selectedAuction.load?.cargoOwner?.phone && (
												<div className="flex items-center gap-3">
													<div className="bg-white p-2 rounded-full shadow-sm">
														<FaPhone className="text-gray-400 w-4 h-4" />
													</div>
													<div className="text-sm text-gray-900">{selectedAuction.load.cargoOwner.phone}</div>
												</div>
											)}
											{selectedAuction.load?.cargoOwner?.email && (
												<div className="flex items-center gap-3">
													<div className="bg-white p-2 rounded-full shadow-sm">
														<FaEnvelope className="text-gray-400 w-4 h-4" />
													</div>
													<div className="text-sm text-gray-900">{selectedAuction.load.cargoOwner.email}</div>
												</div>
											)}
										</div>
									</div>
								</div>

								<div className="space-y-6">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
											<FaRoute className="text-gray-400" /> Route Details
										</h3>
										<div className="bg-gray-50 rounded-lg p-4 space-y-4 relative">
											{/* Route Visualization Line */}
											<div className="absolute left-[27px] top-[48px] bottom-[48px] w-0.5 bg-gray-300 border-l border-dashed border-gray-400"></div>
											
											<div className="relative z-10">
												<div className="flex items-start gap-4">
													<div className="w-6 h-6 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center flex-shrink-0 mt-1">
														<div className="w-2 h-2 rounded-full bg-green-600"></div>
													</div>
													<div>
														<label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup</label>
														<p className="text-gray-900 font-medium">{getLocationName(selectedAuction.load, 'PICKUP')}</p>
														<p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
															<FaCalendarAlt className="w-3.5 h-3.5" />
															{selectedAuction.load?.pickupDate ? new Date(selectedAuction.load.pickupDate).toLocaleDateString() : 'Flexible'}
														</p>
													</div>
												</div>
											</div>

											<div className="pl-14 py-2">
												<div className="flex items-center gap-4 text-sm text-gray-600 bg-white p-2 rounded border border-gray-200 w-fit">
													<span className="flex items-center gap-1.5"><FaRoute className="w-3.5 h-3.5" /> {selectedAuction.load?.distance || '—'} km</span>
													<span className="text-gray-300">|</span>
													<span className="flex items-center gap-1.5"><FaClock className="w-3.5 h-3.5" /> {selectedAuction.load?.estimatedDuration || '—'} hrs</span>
												</div>
											</div>

											<div className="relative z-10">
												<div className="flex items-start gap-4">
													<div className="w-6 h-6 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center flex-shrink-0 mt-1">
														<div className="w-2 h-2 rounded-full bg-red-600"></div>
													</div>
													<div>
														<label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</label>
														<p className="text-gray-900 font-medium">{getLocationName(selectedAuction.load, 'DELIVERY')}</p>
														<p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
															<FaCalendarAlt className="w-3.5 h-3.5" />
															{selectedAuction.load?.deliveryDate ? new Date(selectedAuction.load.deliveryDate).toLocaleDateString() : 'Flexible'}
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>

									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
											<FaDollarSign className="text-gray-400" /> Auction Status
										</h3>
										<div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
											<div className="grid grid-cols-2 gap-6">
												<div>
													<label className="text-xs font-medium text-blue-600 uppercase tracking-wider">Current Bid</label>
													<p className="text-2xl font-bold text-gray-900 mt-1">
														{selectedAuction.currentBid ? biddingHelpers.formatCurrency(selectedAuction.currentBid) : 'No Bids'}
													</p>
												</div>
												<div>
													<label className="text-xs font-medium text-blue-600 uppercase tracking-wider">Time Remaining</label>
													<p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
														{selectedAuction.auctionEnd ? (
															<>
																<FaHourglass className="text-blue-500 w-5 h-5 animate-pulse" />
																{biddingHelpers.getTimeRemaining(selectedAuction.auctionEnd)}
															</>
														) : 'Ended'}
													</p>
												</div>
											</div>
											<div className="mt-4 pt-4 border-t border-blue-200">
												<div className="flex items-center justify-between text-sm">
													<span className="text-gray-600">Reserve Price:</span>
													<span className="font-medium text-gray-900">{selectedAuction.reservePrice ? biddingHelpers.formatCurrency(selectedAuction.reservePrice) : 'Not Set'}</span>
												</div>
												<div className="flex items-center justify-between text-sm mt-1">
													<span className="text-gray-600">Min Increment:</span>
													<span className="font-medium text-gray-900">{selectedAuction.minimumBidIncrement ? biddingHelpers.formatCurrency(selectedAuction.minimumBidIncrement) : '$50'}</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						
						<div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
							<button 
								onClick={() => setShowDetailsModal(false)}
								className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
							>
								Close
							</button>
							{!hasUserBidOnAuction(selectedAuction) && (
								<>
									<button 
										onClick={() => {
											setShowDetailsModal(false);
											openQuickBidModal(selectedAuction);
										}}
										className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm flex items-center gap-2"
									>
										<FaPlus className="w-4 h-4" /> Quick Bid
									</button>
									<button 
										onClick={() => {
											setShowDetailsModal(false);
											openBidModal(selectedAuction);
										}}
										className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm flex items-center gap-2"
									>
										<FaGavel className="w-4 h-4" /> Custom Bid
									</button>
								</>
							)}
						</div>
					</div>
				</div>,
				document.body
			)}
		</div>
	);
};

export default TruckBidsPage;


