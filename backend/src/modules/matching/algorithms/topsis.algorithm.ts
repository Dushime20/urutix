export interface TopsisAlternative {
  id: string;
  criteria: number[];
  metadata?: any;
}

export interface TopsisCriteria {
  name: string;
  weight: number;
  beneficial: boolean; // true for "bigger is better", false for "smaller is better"
}

export interface TopsisResult extends TopsisAlternative {
  score: number;
  rank: number;
  distanceToIdeal: number;
  distanceToNegativeIdeal: number;
}

export class TopsisAlgorithm {
  /**
   * Applies TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
   * @param alternatives - Array of alternatives with their criteria values
   * @param criteria - Array of criteria with weights and optimization direction
   * @returns Ranked alternatives with TOPSIS scores
   */
  solve(
    alternatives: TopsisAlternative[],
    criteria: TopsisCriteria[],
  ): TopsisResult[] {
    if (!alternatives.length || !criteria.length) {
      return [];
    }

    // Step 1: Normalize the decision matrix
    const normalizedMatrix = this.normalizeMatrix(alternatives, criteria);

    // Step 2: Calculate weighted normalized matrix
    const weightedMatrix = this.applyWeights(normalizedMatrix, criteria);

    // Step 3: Determine ideal and negative-ideal solutions
    const { ideal, negativeIdeal } = this.findIdealSolutions(
      weightedMatrix,
      criteria,
    );

    // Step 4: Calculate distances to ideal and negative-ideal solutions
    const results: TopsisResult[] = alternatives.map((alternative, index) => {
      const distanceToIdeal = this.calculateEuclideanDistance(
        weightedMatrix[index],
        ideal,
      );
      const distanceToNegativeIdeal = this.calculateEuclideanDistance(
        weightedMatrix[index],
        negativeIdeal,
      );

      // Step 5: Calculate relative closeness to ideal solution
      const score =
        distanceToNegativeIdeal / (distanceToIdeal + distanceToNegativeIdeal);

      return {
        ...alternative,
        score,
        rank: 0, // Will be set after sorting
        distanceToIdeal,
        distanceToNegativeIdeal,
      };
    });

    // Step 6: Rank alternatives
    results.sort((a, b) => b.score - a.score);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }

  private normalizeMatrix(
    alternatives: TopsisAlternative[],
    criteria: TopsisCriteria[],
  ): number[][] {
    const matrix: number[][] = alternatives.map((alt) => [...alt.criteria]);
    const n = alternatives.length;
    const m = criteria.length;

    // Calculate column sums of squares
    const columnSums = new Array(m).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        columnSums[j] += matrix[i][j] * matrix[i][j];
      }
    }

    // Normalize each element
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const denominator = Math.sqrt(columnSums[j]);
        matrix[i][j] = denominator > 0 ? matrix[i][j] / denominator : 0;
      }
    }

    return matrix;
  }

  private applyWeights(
    normalizedMatrix: number[][],
    criteria: TopsisCriteria[],
  ): number[][] {
    const weightedMatrix: number[][] = [];

    for (let i = 0; i < normalizedMatrix.length; i++) {
      weightedMatrix[i] = [];
      for (let j = 0; j < normalizedMatrix[i].length; j++) {
        weightedMatrix[i][j] = normalizedMatrix[i][j] * criteria[j].weight;
      }
    }

    return weightedMatrix;
  }

  private findIdealSolutions(
    weightedMatrix: number[][],
    criteria: TopsisCriteria[],
  ): {
    ideal: number[];
    negativeIdeal: number[];
  } {
    const m = criteria.length;
    const ideal: number[] = new Array(m);
    const negativeIdeal: number[] = new Array(m);

    for (let j = 0; j < m; j++) {
      const column = weightedMatrix.map((row) => row[j]);

      if (criteria[j].beneficial) {
        // For beneficial criteria, ideal is maximum, negative-ideal is minimum
        ideal[j] = Math.max(...column);
        negativeIdeal[j] = Math.min(...column);
      } else {
        // For non-beneficial criteria, ideal is minimum, negative-ideal is maximum
        ideal[j] = Math.min(...column);
        negativeIdeal[j] = Math.max(...column);
      }
    }

    return { ideal, negativeIdeal };
  }

  private calculateEuclideanDistance(
    point1: number[],
    point2: number[],
  ): number {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Creates TOPSIS alternatives from load-truck matching pairs
   */
  createAlternativesFromMatching(
    loadTruckPairs: Array<{
      loadId: string;
      truckId: string;
      load: any;
      truck: any;
    }>,
  ): TopsisAlternative[] {
    return loadTruckPairs.map((pair) => {
      const criteria = this.extractCriteriaValues(pair.load, pair.truck);
      return {
        id: `${pair.loadId}-${pair.truckId}`,
        criteria,
        metadata: { load: pair.load, truck: pair.truck },
      };
    });
  }

  /**
   * Gets default matching criteria for TOPSIS
   */
  getDefaultMatchingCriteria(): TopsisCriteria[] {
    return [
      { name: 'distance', weight: 0.2, beneficial: false },
      { name: 'capacity', weight: 0.25, beneficial: true },
      { name: 'equipment', weight: 0.25, beneficial: true },
      { name: 'rating', weight: 0.15, beneficial: true },
      { name: 'cost', weight: 0.15, beneficial: false },
    ];
  }

  private extractCriteriaValues(load: any, truck: any): number[] {
    const distance = this.calculateDistance(load, truck);
    const capacityUtilization = load.weight / truck.capacityWeight;
    const equipmentScore = this.calculateEquipmentScore(load, truck);
    const rating = truck.averageRating || 0;
    const cost = this.calculateEstimatedCost(load, truck);

    return [distance, capacityUtilization, equipmentScore, rating, cost];
  }

  private calculateDistance(load: any, truck: any): number {
    // Simplified distance calculation
    // In real implementation, use actual coordinates
    const baseDistance = 100; // km
    const randomFactor = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    return baseDistance * randomFactor;
  }

  private calculateEquipmentScore(load: any, truck: any): number {
    let score = 1.0;

    // Check refrigeration requirement
    if (load.requiresRefrigeration && !truck.hasRefrigeration) {
      score = 0; // Deal breaker
    }

    // Check hazmat requirement
    if (load.isHazardous && !truck.hasHazmatPermit) {
      score = 0; // Deal breaker
    }

    // Check loading equipment requirements
    if (load.requiresForklift && !truck.hasLiftGate) {
      score *= 0.8; // Partial penalty
    }

    if (load.requiresCrane && !truck.hasWinch) {
      score *= 0.7; // Partial penalty
    }

    return score;
  }

  private calculateEstimatedCost(load: any, truck: any): number {
    const distance = this.calculateDistance(load, truck);
    const baseCost = distance * 2.5; // $2.5 per km
    let multiplier = 1.0;

    // Adjust for special requirements
    if (load.requiresRefrigeration) multiplier += 0.3;
    if (load.isHazardous) multiplier += 0.4;
    if (load.isFragile) multiplier += 0.1;

    return baseCost * multiplier;
  }

  /**
   * Calculates distance between two points using Haversine formula
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
