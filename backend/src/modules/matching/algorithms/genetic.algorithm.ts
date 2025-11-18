export interface Individual {
  chromosome: number[];
  fitness: number;
}

export interface GeneticAlgorithmOptions {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  elitismRate: number;
}

export interface GeneticAlgorithmResult {
  bestSolution: number[];
  bestFitness: number;
  generations: number;
  convergenceHistory: number[];
}

export class GeneticAlgorithm {
  private loads: any[];
  private trucks: any[];
  private options: GeneticAlgorithmOptions;

  constructor(
    loads: any[],
    trucks: any[],
    options?: Partial<GeneticAlgorithmOptions>,
  ) {
    this.loads = loads;
    this.trucks = trucks;
    this.options = {
      populationSize: 50,
      generations: 100,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.2,
      ...options,
    };
  }

  solve(): GeneticAlgorithmResult {
    let population = this.initializePopulation();
    const convergenceHistory: number[] = [];
    let bestEverFitness = -Infinity;
    let bestEverSolution: number[] = [];

    for (
      let generation = 0;
      generation < this.options.generations;
      generation++
    ) {
      // Evaluate fitness for all individuals
      this.evaluatePopulation(population);

      // Track best solution
      const currentBest = this.getBestIndividual(population);
      if (currentBest.fitness > bestEverFitness) {
        bestEverFitness = currentBest.fitness;
        bestEverSolution = [...currentBest.chromosome];
      }

      convergenceHistory.push(currentBest.fitness);

      // Check for convergence
      if (this.hasConverged(convergenceHistory, 10)) {
        break;
      }

      // Create next generation
      population = this.createNextGeneration(population);
    }

    return {
      bestSolution: bestEverSolution,
      bestFitness: bestEverFitness,
      generations: convergenceHistory.length,
      convergenceHistory,
    };
  }

  private initializePopulation(): Individual[] {
    const population: Individual[] = [];
    const chromosomeLength = this.loads.length;

    for (let i = 0; i < this.options.populationSize; i++) {
      const chromosome: number[] = [];

      for (let j = 0; j < chromosomeLength; j++) {
        // Randomly assign each load to a truck (or -1 for unassigned)
        chromosome.push(
          Math.floor(Math.random() * (this.trucks.length + 1)) - 1,
        );
      }

      population.push({
        chromosome,
        fitness: 0,
      });
    }

    return population;
  }

  private evaluatePopulation(population: Individual[]): void {
    for (const individual of population) {
      individual.fitness = this.calculateFitness(individual.chromosome);
    }
  }

  private calculateFitness(chromosome: number[]): number {
    let totalFitness = 0;
    const truckLoads = new Map<number, number[]>(); // truckId -> loadIds

    // Group loads by truck
    for (let i = 0; i < chromosome.length; i++) {
      const truckIndex = chromosome[i];
      if (truckIndex >= 0 && truckIndex < this.trucks.length) {
        const truckId = this.trucks[truckIndex].id;
        if (!truckLoads.has(truckId)) {
          truckLoads.set(truckId, []);
        }
        truckLoads.get(truckId).push(i);
      }
    }

    // Calculate fitness for each truck-load assignment
    for (const [truckId, loadIndices] of truckLoads) {
      const truck = this.trucks.find((t) => t.id === truckId);
      if (!truck) continue;

      for (const loadIndex of loadIndices) {
        const load = this.loads[loadIndex];
        if (!load) continue;

        const compatibility = this.calculateLoadTruckCompatibility(load, truck);
        totalFitness += compatibility;
      }
    }

    // Add utilization bonus for trucks with multiple loads
    const utilizationBonus = this.calculateUtilizationBonus(truckLoads);
    totalFitness += utilizationBonus;

    return totalFitness;
  }

  private calculateLoadTruckCompatibility(load: any, truck: any): number {
    let compatibility = 0;

    // Distance compatibility
    const distance = this.calculateDistance(load, truck);
    const distanceScore = Math.max(0, 1 - distance / 1000); // 1000km = 0 score
    compatibility += distanceScore * 0.2;

    // Capacity compatibility
    if (load.weight <= truck.capacityWeight) {
      const capacityUtilization = load.weight / truck.capacityWeight;
      const capacityScore =
        capacityUtilization <= 0.9
          ? capacityUtilization
          : 1 - (capacityUtilization - 0.9) * 10;
      compatibility += capacityScore * 0.3;
    }

    // Equipment compatibility
    let equipmentScore = 1.0;
    if (load.requiresRefrigeration && !truck.hasRefrigeration)
      equipmentScore = 0;
    if (load.isHazardous && !truck.hasHazmatPermit) equipmentScore = 0;
    compatibility += equipmentScore * 0.25;

    // Rating compatibility
    const ratingScore = (truck.averageRating || 0) / 5;
    compatibility += ratingScore * 0.15;

    // Cost compatibility
    const estimatedCost = this.estimateTransportCost(load, truck);
    const marketAverage = this.getMarketAverageCost(load);
    const costRatio = estimatedCost / marketAverage;
    const costScore = costRatio <= 1.0 ? 1.0 : Math.max(0, 2 - costRatio);
    compatibility += costScore * 0.1;

    return compatibility;
  }

  private calculateUtilizationBonus(truckLoads: Map<number, number[]>): number {
    let bonus = 0;

    for (const [truckId, loadIndices] of truckLoads) {
      if (loadIndices.length > 1) {
        // Bonus for efficient truck utilization
        bonus += 0.1 * loadIndices.length;
      }
    }

    return bonus;
  }

  private createNextGeneration(population: Individual[]): Individual[] {
    const newPopulation: Individual[] = [];
    const eliteCount = Math.floor(
      this.options.populationSize * this.options.elitismRate,
    );

    // Elitism: keep best individuals
    population.sort((a, b) => b.fitness - a.fitness);
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push({ ...population[i] });
    }

    // Generate rest of population through crossover and mutation
    while (newPopulation.length < this.options.populationSize) {
      const parent1 = this.tournamentSelection(population);
      const parent2 = this.tournamentSelection(population);

      if (Math.random() < this.options.crossoverRate) {
        const [child1, child2] = this.crossover(parent1, parent2);
        newPopulation.push(child1);
        if (newPopulation.length < this.options.populationSize) {
          newPopulation.push(child2);
        }
      } else {
        newPopulation.push({ ...parent1 });
        if (newPopulation.length < this.options.populationSize) {
          newPopulation.push({ ...parent2 });
        }
      }
    }

    // Apply mutation
    for (let i = eliteCount; i < newPopulation.length; i++) {
      if (Math.random() < this.options.mutationRate) {
        this.mutate(newPopulation[i]);
      }
    }

    return newPopulation;
  }

  private tournamentSelection(
    population: Individual[],
    tournamentSize = 3,
  ): Individual {
    const tournament: Individual[] = [];

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }

    return tournament.reduce((best, current) =>
      current.fitness > best.fitness ? current : best,
    );
  }

  private crossover(
    parent1: Individual,
    parent2: Individual,
  ): [Individual, Individual] {
    const crossoverPoint = Math.floor(
      Math.random() * parent1.chromosome.length,
    );

    const child1: Individual = {
      chromosome: [
        ...parent1.chromosome.slice(0, crossoverPoint),
        ...parent2.chromosome.slice(crossoverPoint),
      ],
      fitness: 0,
    };

    const child2: Individual = {
      chromosome: [
        ...parent2.chromosome.slice(0, crossoverPoint),
        ...parent1.chromosome.slice(crossoverPoint),
      ],
      fitness: 0,
    };

    return [child1, child2];
  }

  private mutate(individual: Individual): void {
    const mutationIndex = Math.floor(
      Math.random() * individual.chromosome.length,
    );
    individual.chromosome[mutationIndex] =
      Math.floor(Math.random() * (this.trucks.length + 1)) - 1;
  }

  private getBestIndividual(population: Individual[]): Individual {
    return population.reduce((best, current) =>
      current.fitness > best.fitness ? current : best,
    );
  }

  private hasConverged(history: number[], windowSize: number): boolean {
    if (history.length < windowSize) return false;

    const recentValues = history.slice(-windowSize);
    const variance = this.calculateVariance(recentValues);
    const mean =
      recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;

    // Consider converged if variance is very low relative to mean
    return variance < mean * 0.01;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateDistance(load: any, truck: any): number {
    // Simplified distance calculation
    // In real implementation, use actual coordinates
    const baseDistance = 100; // km
    const randomFactor = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    return baseDistance * randomFactor;
  }

  private estimateTransportCost(load: any, truck: any): number {
    const distance = this.calculateDistance(load, truck);
    const baseCost = distance * 2.5; // $2.5 per km
    let multiplier = 1.0;

    // Adjust for special requirements
    if (load.requiresRefrigeration) multiplier += 0.3;
    if (load.isHazardous) multiplier += 0.4;
    if (load.isFragile) multiplier += 0.1;

    return baseCost * multiplier;
  }

  private getMarketAverageCost(load: any): number {
    const distance = this.calculateDistance(load, {} as any);
    return distance * 3.0; // Simplified market average
  }
}
