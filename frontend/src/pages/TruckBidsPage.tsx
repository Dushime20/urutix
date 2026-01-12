import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { biddingAPI, biddingHelpers } from '../services/biddingApi';
import { fleetApi } from '../services/fleetApi';
import { FaSearch, FaGavel, FaDollarSign, FaClock, FaPlus, FaStar, FaRegStar, FaMapMarkerAlt, FaTimes, FaTruck, FaChartLine, FaCheckCircle, FaBolt, FaUser, FaRoute, FaFilter, FaArrowRight } from 'react-icons/fa';
import { Grid, Table, AlertTriangle, Clock, MapPin, Search, Bell, Menu, X, Filter, Download, Calendar, ArrowUpRight, ArrowDownRight, MoreVertical, Shield, Zap, Settings, LogOut, CheckCircle, Droplets, Fuel, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

	// Header/Navigation State
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const userMenuRef = React.useRef<HTMLDivElement>(null);

	// Close user menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setShowUserMenu(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [userMenuRef]);

	const handleLogout = async () => {
		try {
			await logout();
			navigate('/auth');
		} catch (error) {
			console.error('Logout error:', error);
			navigate('/auth');
		}
	};

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
			toast.success('Bid submitted successfully!');
			setShowQuickBidModal(false);
			setSelectedAuction(null);
			setQuickBidAmount('');
			setQuickAdvancePaymentPercentage('');
			setQuickRequireAdvancePayment(true);
			setProposedPickupDate('');
			setProposedDeliveryDate('');
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
			toast.success('Bid submitted successfully!');
			setShowBidModal(false);
			// Refresh auctions to show updated bid information
			await loadAuctions();
		} catch (e: any) {
			toast.error(e?.response?.data?.message || 'Failed to submit bid');
		}
	};

	// --- UI COMPONENTS (Copied from FleetOwnerDashboard) ---

	const Header = () => (
		<>
			{/* Marquee Alert Bar */}
			<div className="bg-[#0a101f] text-white py-2 overflow-hidden border-b border-white/5">
				<div className="flex items-center animate-marquee whitespace-nowrap">
					<div className="flex gap-16 items-center text-[11px] font-bold tracking-widest uppercase opacity-80">
						<span className="flex items-center gap-2 text-emerald-400">
							<CheckCircle size={14} /> Fleet Health: All vehicles fully operational
						</span>
						<span className="flex items-center gap-2">
							<Droplets size={14} className="text-blue-400" /> Weather Update: Heavy Rain Expected (Nairobi-Mombasa)
						</span>
						<span className="flex items-center gap-2 text-green-400">
							<CheckCircle size={14} /> Border Status: Busia & Malaba operating normally
						</span>
						<span className="flex items-center gap-2 text-amber-400">
							<Fuel size={14} /> Fuel Price: Diesel KES 210.00 (+2% effective Jan 15th)
						</span>
					</div>
				</div>
			</div>

			{/* Header Section - Dark Theme */}
			<div className="bg-[#0f172a] text-white">
				<header className="max-w-[1920px] mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-20 py-5 border-b border-white/10">
					<div className="flex items-center gap-4 md:gap-10">
						{/* Mobile Menu Toggle */}
						<button
							className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						>
							{isMobileMenuOpen ? <X size={24} /> : (
								<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							)}
						</button>

						{/* Logo */}
						<div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard/fleet')}>
							<div className="size-10 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center rounded-xl shadow-lg shadow-blue-500/20">
								<FaTruck className="size-5 text-white" />
							</div>
							<h2 className="text-xl md:text-2xl font-black tracking-tighter text-white">UrutiX<span className="text-blue-400">.</span></h2>
						</div>

						{/* Desktop Navigation */}
						<nav className="hidden lg:flex items-center gap-10">
							<a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet">Dashboard</a>
							<a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/fleet-manager">Fleet Assets</a>
							<a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/drivers">Drivers</a>
							<a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/maintenance">Maintenance</a>
							<a className="text-white text-sm font-bold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-blue-500" href="/dashboard/fleet/bids">Load Board</a>
							<a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/reports">Reports</a>
						</nav>

						{/* Search Bar */}
						<div className="hidden xl:flex items-center relative ml-8 group">
							<Search className="absolute left-3 text-white/40 group-focus-within:text-blue-500 transition-colors" size={16} />
							<input
								type="text"
								placeholder="Search loads, lanes, rates..."
								className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/50 w-64 transition-all"
							/>
							<span className="absolute right-3 text-[10px] font-bold text-white/20 border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
						</div>
					</div>

					<div className="flex items-center gap-4 md:gap-6">
						{/* Fleet Status Badge */}
						<div className="hidden 2xl:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
							<span className="text-blue-400">⚡</span>
							<span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Live Market</span>
						</div>

						{/* Quick Actions Button */}
						<button
							onClick={() => navigate('/dashboard/fleet/dispatch')}
							className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
						>
							<Zap size={16} /> Dispatch
						</button>

						{/* Notification Bell */}
						<button className="p-2 text-white/60 hover:text-white transition-all relative">
							<Bell size={24} />
							<span className="absolute top-2 right-2 size-2 bg-blue-500 rounded-full border-2 border-[#0f172a]"></span>
						</button>

						{/* User Profile with Dropdown */}
						<div className="relative" ref={userMenuRef}>
							<button
								onClick={() => setShowUserMenu(!showUserMenu)}
								className="flex items-center gap-3 pl-4 md:pl-6 border-l border-white/10 hover:opacity-80 transition-opacity cursor-pointer"
							>
								<div className="text-right hidden sm:block">
									<p className="text-sm font-bold">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Fleet Manager'}</p>
									<p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Fleet Owner</p>
								</div>
								<div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white/20 shadow-inner overflow-hidden">
									<img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Fleet'}`} alt="User" className="size-full" />
								</div>
							</button>

							{/* Dropdown Menu */}
							{showUserMenu && (
								<div className="absolute top-full right-0 mt-2 w-56 bg-[#1e293b] rounded-lg shadow-2xl border border-white/10 z-[9999] overflow-hidden">
									<div className="p-2">
										<div className="px-3 py-2 border-b border-white/10">
											<div className="text-sm font-semibold text-white">
												{user?.firstName && user?.lastName
													? `${user.firstName} ${user.lastName}`
													: user?.firstName || user?.email || 'User'
												}
											</div>
											<div className="text-xs text-gray-400 truncate">{user?.email}</div>
										</div>
										<button
											onClick={() => {
												setShowUserMenu(false);
												navigate('/dashboard/fleet/settings');
											}}
											className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 mt-1"
										>
											<Settings size={16} />
											Profile Settings
										</button>
										<div className="border-t border-white/10 my-1"></div>
										<button
											onClick={handleLogout}
											className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
										>
											<LogOut size={16} />
											Logout
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</header>

				{/* Mobile Nav Menu */}
				{isMobileMenuOpen && (
					<div className="lg:hidden absolute top-[120px] left-0 right-0 bg-[#0f172a] border-b border-white/10 p-4 z-50 shadow-xl">
						<nav className="flex flex-col space-y-3 text-sm font-semibold text-gray-400">
							<a href="/dashboard/fleet" className="hover:text-white px-3 py-2">Dashboard</a>
							<a href="/fleet-manager" className="hover:text-white px-3 py-2">Fleet Manager</a>
							<a href="/dashboard/fleet/drivers" className="hover:text-white px-3 py-2">Drivers</a>
							<a href="/dashboard/fleet/maintenance" className="hover:text-white px-3 py-2">Maintenance</a>
							<a href="/dashboard/fleet/bids" className="text-white px-3 py-2 bg-white/5 rounded-lg">Load Board</a>
							<a href="/dashboard/fleet/reports" className="hover:text-white px-3 py-2">Reports</a>
						</nav>
					</div>
				)}
			</div>
		</>
	);

	const Footer = () => (
		<footer className="bg-[#0a101f] text-white pt-16 md:pt-20 pb-8 md:pb-10 border-t border-white/5 mt-auto">
			<div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-16">
					<div className="lg:col-span-4">
						<div className="flex items-center gap-3 mb-6">
							<div className="size-10 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center rounded-xl shadow-lg shadow-blue-500/20">
								<FaTruck className="size-5 text-white" />
							</div>
							<h2 className="text-2xl font-black tracking-tighter text-white">UrutiX<span className="text-blue-400">.</span></h2>
						</div>
						<p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
							UrutiX Fleet Command is Africa's premier fleet management and logistics platform, empowering fleet owners to optimize operations and maximize profitability.
						</p>
					</div>
					<div className="lg:col-span-2">
						<h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Fleet</h4>
						<ul className="space-y-3 md:space-y-4">
							<li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/trucks">Manage Fleet</a></li>
							<li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/bids">Load Board</a></li>
						</ul>
					</div>
				</div>
				<div className="pt-6 md:pt-8 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
					<p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center md:text-left">
						© 2026 UrutiX Technologies Inc. All Rights Reserved.
					</p>
				</div>
			</div>
		</footer>
	);

	return (
		<div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-500/30 flex flex-col">
			<Header />

			{/* Page Header */}
			<div className="bg-white border-b border-gray-200 shadow-sm relative z-10">
				<div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-black tracking-tight text-gray-900">Load Board</h1>
							<p className="text-gray-500 text-sm mt-0.5">Real-time marketplace for active shipments</p>
						</div>
						<button onClick={seedAuctions} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold shadow-md hover:bg-black transition-all">
							<FaPlus size={12} /> Seed Data
						</button>
					</div>
				</div>
			</div>

			<main className="flex-1 px-4 md:px-8 lg:px-12 xl:px-20 py-8 max-w-[1536px] mx-auto w-full relative z-0">

				{/* Control Bar */}
				<div className="bg-white border border-gray-200 rounded-xl p-2 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
					<div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
						<button
							onClick={() => { setStatus('all'); setPage(1); }}
							className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${status === 'all' ? 'bg-[#0f172a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
						>
							All Loads
						</button>
						<button
							onClick={() => { setStatus('ACTIVE'); setPage(1); }}
							className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${status === 'ACTIVE' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
						>
							<Zap size={14} className={status === 'ACTIVE' ? 'text-yellow-300' : ''} /> Live Auctions
						</button>
						<button
							onClick={() => { setStatus('SCHEDULED'); setPage(1); }}
							className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${status === 'SCHEDULED' ? 'bg-gray-100 text-gray-900 border border-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
						>
							Scheduled
						</button>
						<button
							onClick={() => { setShowWatchedOnly(!showWatchedOnly); }}
							className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${showWatchedOnly ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
						>
							<FaStar className={showWatchedOnly ? 'text-yellow-500' : 'text-gray-400'} size={14} /> Watchlist
						</button>
					</div>

					<div className="flex items-center gap-2 w-full md:w-auto">
						<div className="relative flex-1 md:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
							<input
								value={search}
								onChange={(e) => { setSearch(e.target.value); setPage(1); }}
								placeholder="Search routes, IDs..."
								className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
							/>
						</div>
						<div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
							<button
								onClick={() => setView('cards')}
								className={`p-1.5 rounded-md transition-all ${view === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
							>
								<Grid size={16} />
							</button>
							<button
								onClick={() => setView('table')}
								className={`p-1.5 rounded-md transition-all ${view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
							>
								<Table size={16} />
							</button>
						</div>
					</div>
				</div>

				{view === 'cards' ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{loading ? (
							<div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
								<p className="font-medium">Searching specifically for high-value loads...</p>
							</div>
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
								const cargoOwnerName = getCargoOwnerName(a?.load);
								const pickupLocation = getLocationName(a?.load, 'PICKUP');
								const deliveryLocation = getLocationName(a?.load, 'DELIVERY');
								const timeLeft = a.auctionEnd ? biddingHelpers.getTimeRemaining(a.auctionEnd) : '00:00:00';
								const isUrgent = timeLeft.includes('m') && !timeLeft.includes('d') && !timeLeft.includes('h');

								return (
									<div key={a.id} className="group bg-white border border-gray-200 rounded-2xl p-0 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all duration-300 flex flex-col relative overflow-hidden">
										{/* Status Stripe */}
										<div className={`absolute top-0 left-0 w-1 h-full transition-colors ${a.status === 'ACTIVE' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>

										<div className="p-5 flex-1">
											<div className="flex justify-between items-start mb-4">
												<div className="flex gap-3 items-center">
													<div className="size-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
														<FaTruck />
													</div>
													<div>
														<div className="flex items-center gap-2">
															<span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">
																{a.load?.referenceNumber || `LD-${a.id.slice(0, 4)}`}
															</span>
															{isUrgent && (
																<span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wide flex items-center gap-1 animate-pulse">
																	<FaBolt size={10} /> Closing Soon
																</span>
															)}
														</div>
														<h3 className="font-bold text-gray-900 text-lg leading-tight mt-0.5 group-hover:text-blue-600 transition-colors line-clamp-1" title={a?.load?.title}>{a?.load?.title || 'Untitled Shipment'}</h3>
													</div>
												</div>
												<button
													onClick={(e) => { e.stopPropagation(); toggleWatch(a); }}
													className={`p-2 rounded-full transition-all ${watchedIds.has(a.id) ? 'text-yellow-400 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'}`}
												>
													{watchedIds.has(a.id) ? <FaStar size={16} /> : <FaRegStar size={16} />}
												</button>
											</div>

											{/* Route Visual */}
											<div className="relative py-4 my-2">
												<div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-gray-200 border-l border-dashed border-gray-300"></div>
												<div className="flex flex-col gap-4">
													<div className="flex items-start gap-4 reltive z-10">
														<div className="size-3.5 mt-1 rounded-full border-[3px] border-white ring-2 ring-emerald-500 bg-emerald-500 shadow-sm"></div>
														<div>
															<p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Origin</p>
															<p className="text-sm font-bold text-gray-900">{pickupLocation}</p>
															<p className="text-xs text-gray-500">Jan 15, 08:00 AM</p>
														</div>
													</div>
													<div className="flex items-start gap-4 relative z-10">
														<div className="size-3.5 mt-1 rounded-full border-[3px] border-white ring-2 ring-blue-600 bg-blue-600 shadow-sm"></div>
														<div>
															<p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Destination</p>
															<p className="text-sm font-bold text-gray-900">{deliveryLocation}</p>
															<p className="text-xs text-gray-500">Jan 17, 12:00 PM</p>
														</div>
													</div>
												</div>
											</div>
										</div>

										{/* Stats Grid */}
										<div className="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100 bg-gray-50/50">
											<div className="p-3 flex flex-col items-center justify-center text-center">
												<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Current Bid</p>
												<p className="text-lg font-black text-gray-900 tracking-tight flex items-baseline gap-0.5">
													<span className="text-xs text-gray-500 font-bold">$</span>
													{a.currentBid ? a.currentBid.toLocaleString() : '---'}
												</p>
											</div>
											<div className="p-3 flex flex-col items-center justify-center text-center">
												<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Time Left</p>
												<p className={`text-sm font-bold flex items-center gap-1.5 ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
													<Clock size={14} className={isUrgent ? 'animate-pulse' : ''} />
													{timeLeft}
												</p>
											</div>
										</div>

										{/* Actions */}
										<div className="p-4 border-t border-gray-100 flex gap-2">
											<button
												onClick={() => openBidModal(a)}
												className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
											>
												Custom Bid
											</button>
											<button
												onClick={() => openQuickBidModal(a)}
												className="flex-1 py-2.5 px-4 rounded-xl bg-[#0f172a] text-white font-bold text-sm shadow-md shadow-gray-900/10 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] transform duration-200"
											>
												<Zap size={14} className="text-yellow-400" /> Quick Bid
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
													<div className="font-bold text-gray-900">{a.currentBid ? biddingHelpers.formatCurrency(a.currentBid) : '—'}</div>
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
			</main>
			<Footer />
		</div >
	);
};

export default TruckBidsPage;


