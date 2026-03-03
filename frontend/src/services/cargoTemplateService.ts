// Cargo Template Service - Manages cargo templates in localStorage

export interface CargoTemplate {
    id: string;
    name: string;
    createdAt: string;
    data: {
        title: string;
        description?: string;
        weight: number;
        volume?: number;
        cargoType: string;
        pickupLocationId: string;
        deliveryLocationId: string;
        pickupLocation?: {
            name: string;
            address: string;
        };
        deliveryLocation?: {
            name: string;
            address: string;
        };
        loadValue: number;
        offeredPrice?: number;
        currencyCode: string;
        isFragile: boolean;
        isHazardous: boolean;
        requiresRefrigeration: boolean;
        specialRequirements?: string;
        loadingInstructions?: string;
        unloadingInstructions?: string;
        // Enhanced fields
        length?: number;
        width?: number;
        height?: number;
        temperatureMin?: number;
        temperatureMax?: number;
        requiresForklift?: boolean;
        requiresCrane?: boolean;
        requiresLoadingDock?: boolean;
        packagingType?: string;
        numberOfPieces?: number;
        numberOfPallets?: number;
        urgencyLevel?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
        truckRequirements?: any;
        carrierPreferences?: any;
        costPreferences?: any;
    };
}

const STORAGE_KEY = 'cargo_templates';
const MAX_TEMPLATES = 10; // Store up to 10, show 5

class CargoTemplateService {
    /**
     * Save a cargo as a template
     */
    saveTemplate(cargo: any): void {
        try {
            const templates = this.getAllTemplates();

            // Create template from cargo
            const template: CargoTemplate = {
                id: `template_${Date.now()}`,
                name: cargo.title || 'Untitled Template',
                createdAt: new Date().toISOString(),
                data: {
                    title: cargo.title,
                    description: cargo.description,
                    weight: cargo.weight,
                    volume: cargo.volume,
                    cargoType: cargo.cargoType,
                    pickupLocationId: cargo.pickupLocationId,
                    deliveryLocationId: cargo.deliveryLocationId,
                    pickupLocation: cargo.pickupLocation,
                    deliveryLocation: cargo.deliveryLocation,
                    loadValue: cargo.loadValue,
                    offeredPrice: cargo.offeredPrice,
                    currencyCode: cargo.currencyCode,
                    isFragile: cargo.isFragile,
                    isHazardous: cargo.isHazardous,
                    requiresRefrigeration: cargo.requiresRefrigeration,
                    specialRequirements: cargo.specialRequirements,
                    loadingInstructions: cargo.loadingInstructions,
                    unloadingInstructions: cargo.unloadingInstructions,
                    length: cargo.length,
                    width: cargo.width,
                    height: cargo.height,
                    temperatureMin: cargo.temperatureMin,
                    temperatureMax: cargo.temperatureMax,
                    requiresForklift: cargo.requiresForklift,
                    requiresCrane: cargo.requiresCrane,
                    requiresLoadingDock: cargo.requiresLoadingDock,
                    packagingType: cargo.packagingType,
                    numberOfPieces: cargo.numberOfPieces,
                    numberOfPallets: cargo.numberOfPallets,
                    urgencyLevel: cargo.urgencyLevel,
                    truckRequirements: cargo.truckRequirements,
                    carrierPreferences: cargo.carrierPreferences,
                    costPreferences: cargo.costPreferences,
                }
            };

            // Add to beginning of array (most recent first)
            templates.unshift(template);

            // Keep only MAX_TEMPLATES
            const limitedTemplates = templates.slice(0, MAX_TEMPLATES);

            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedTemplates));
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    }

    /**
     * Get recent templates (limited to specified count)
     */
    getRecentTemplates(limit: number = 5): CargoTemplate[] {
        try {
            const templates = this.getAllTemplates();
            return templates.slice(0, limit);
        } catch (error) {
            console.error('Failed to get templates:', error);
            return [];
        }
    }

    /**
     * Get all templates from localStorage
     */
    private getAllTemplates(): CargoTemplate[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            return JSON.parse(stored);
        } catch (error) {
            console.error('Failed to parse templates:', error);
            return [];
        }
    }

    /**
     * Delete a specific template
     */
    deleteTemplate(templateId: string): void {
        try {
            const templates = this.getAllTemplates();
            const filtered = templates.filter(t => t.id !== templateId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    }

    /**
     * Clear all templates
     */
    clearTemplates(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear templates:', error);
        }
    }

    /**
     * Get template by ID
     */
    getTemplate(templateId: string): CargoTemplate | null {
        try {
            const templates = this.getAllTemplates();
            return templates.find(t => t.id === templateId) || null;
        } catch (error) {
            console.error('Failed to get template:', error);
            return null;
        }
    }
}

export const cargoTemplateService = new CargoTemplateService();
