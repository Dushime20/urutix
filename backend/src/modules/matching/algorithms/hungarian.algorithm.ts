export interface Assignment {
  loadIndex: number;
  truckIndex: number;
  cost: number;
}

export interface HungarianResult {
  assignments: Assignment[];
  totalCost: number;
  efficiency: number;
}

export class HungarianAlgorithm {
  /**
   * Solves the assignment problem using the Hungarian algorithm
   * @param costMatrix - 2D array where costMatrix[i][j] is the cost of assigning load i to truck j
   * @returns Optimal assignments with minimum total cost
   */
  solve(costMatrix: number[][]): HungarianResult {
    if (!costMatrix || costMatrix.length === 0) {
      return { assignments: [], totalCost: 0, efficiency: 0 };
    }

    const n = costMatrix.length;
    const m = costMatrix[0].length;

    // Make the matrix square by padding with high costs
    const matrix = this.makeSquareMatrix(costMatrix);
    const size = matrix.length;

    // Step 1: Subtract row minimums
    this.subtractRowMinimums(matrix);

    // Step 2: Subtract column minimums
    this.subtractColumnMinimums(matrix);

    // Step 3: Cover zeros with minimum lines
    let coveredRows = new Set<number>();
    let coveredCols = new Set<number>();
    let assignments: number[] = new Array(size).fill(-1);

    while (true) {
      // Find maximum matching
      assignments = this.findMaximalMatching(matrix, size);
      const matchedCount = assignments.filter((a) => a !== -1).length;

      if (matchedCount === size) {
        break; // Found optimal solution
      }

      // Cover zeros with minimum lines
      const { rows, cols } = this.findMinimumCover(matrix, assignments, size);
      coveredRows = rows;
      coveredCols = cols;

      // Step 4: Create additional zeros
      this.createAdditionalZeros(matrix, coveredRows, coveredCols, size);
    }

    // Extract valid assignments (within original matrix bounds)
    const validAssignments: Assignment[] = [];
    let totalCost = 0;

    for (let i = 0; i < Math.min(size, n); i++) {
      const j = assignments[i];
      if (j !== -1 && j < m) {
        const cost = costMatrix[i][j];
        validAssignments.push({
          loadIndex: i,
          truckIndex: j,
          cost,
        });
        totalCost += cost;
      }
    }

    const efficiency = this.calculateEfficiency(validAssignments, costMatrix);

    return {
      assignments: validAssignments,
      totalCost,
      efficiency,
    };
  }

  private makeSquareMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;
    const m = matrix[0].length;
    const size = Math.max(n, m);

    const squareMatrix: number[][] = [];
    const maxCost = this.findMaxCost(matrix) * 10; // Use high cost for padding

    for (let i = 0; i < size; i++) {
      squareMatrix[i] = [];
      for (let j = 0; j < size; j++) {
        if (i < n && j < m) {
          squareMatrix[i][j] = matrix[i][j];
        } else {
          squareMatrix[i][j] = maxCost;
        }
      }
    }

    return squareMatrix;
  }

  private findMaxCost(matrix: number[][]): number {
    let maxCost = 0;
    for (const row of matrix) {
      for (const cost of row) {
        maxCost = Math.max(maxCost, cost);
      }
    }
    return maxCost;
  }

  private subtractRowMinimums(matrix: number[][]): void {
    for (let i = 0; i < matrix.length; i++) {
      const minCost = Math.min(...matrix[i]);
      for (let j = 0; j < matrix[i].length; j++) {
        matrix[i][j] -= minCost;
      }
    }
  }

  private subtractColumnMinimums(matrix: number[][]): void {
    for (let j = 0; j < matrix[0].length; j++) {
      let minCost = Infinity;
      for (let i = 0; i < matrix.length; i++) {
        minCost = Math.min(minCost, matrix[i][j]);
      }
      for (let i = 0; i < matrix.length; i++) {
        matrix[i][j] -= minCost;
      }
    }
  }

  private findMaximalMatching(matrix: number[][], size: number): number[] {
    const assignments: number[] = new Array(size).fill(-1);
    const visited = new Set<number>();

    for (let i = 0; i < size; i++) {
      visited.clear();
      this.dfs(matrix, i, assignments, visited, size);
    }

    return assignments;
  }

  private dfs(
    matrix: number[][],
    row: number,
    assignments: number[],
    visited: Set<number>,
    size: number,
  ): boolean {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col] === 0 && !visited.has(col)) {
        visited.add(col);

        if (
          assignments[col] === -1 ||
          this.dfs(matrix, assignments[col], assignments, visited, size)
        ) {
          assignments[col] = row;
          return true;
        }
      }
    }
    return false;
  }

  private findMinimumCover(
    matrix: number[][],
    assignments: number[],
    size: number,
  ): {
    rows: Set<number>;
    cols: Set<number>;
  } {
    const markedRows = new Set<number>();
    const markedCols = new Set<number>();

    // Mark all rows having no assignment
    for (let i = 0; i < size; i++) {
      if (!assignments.includes(i)) {
        markedRows.add(i);
      }
    }

    // Mark all columns having zeros in marked rows
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < size; i++) {
        if (markedRows.has(i)) {
          for (let j = 0; j < size; j++) {
            if (matrix[i][j] === 0 && !markedCols.has(j)) {
              markedCols.add(j);
              changed = true;
            }
          }
        }
      }

      // Mark all rows having assignments in marked columns
      for (let j = 0; j < size; j++) {
        if (markedCols.has(j) && assignments[j] !== -1) {
          if (!markedRows.has(assignments[j])) {
            markedRows.add(assignments[j]);
            changed = true;
          }
        }
      }
    }

    // Cover consists of unmarked rows and marked columns
    const coveredRows = new Set<number>();
    const coveredCols = new Set<number>();

    for (let i = 0; i < size; i++) {
      if (!markedRows.has(i)) {
        coveredRows.add(i);
      }
    }

    for (let j = 0; j < size; j++) {
      if (markedCols.has(j)) {
        coveredCols.add(j);
      }
    }

    return { rows: coveredRows, cols: coveredCols };
  }

  private createAdditionalZeros(
    matrix: number[][],
    coveredRows: Set<number>,
    coveredCols: Set<number>,
    size: number,
  ): void {
    // Find minimum uncovered value
    let minUncovered = Infinity;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!coveredRows.has(i) && !coveredCols.has(j)) {
          minUncovered = Math.min(minUncovered, matrix[i][j]);
        }
      }
    }

    // Subtract from uncovered elements and add to doubly covered elements
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!coveredRows.has(i) && !coveredCols.has(j)) {
          matrix[i][j] -= minUncovered;
        } else if (coveredRows.has(i) && coveredCols.has(j)) {
          matrix[i][j] += minUncovered;
        }
      }
    }
  }

  private calculateEfficiency(
    assignments: Assignment[],
    originalMatrix: number[][],
  ): number {
    if (assignments.length === 0) return 0;

    const totalCost = assignments.reduce(
      (sum, assignment) => sum + assignment.cost,
      0,
    );
    const maxPossibleCost =
      assignments.length * this.findMaxCost(originalMatrix);

    return maxPossibleCost > 0
      ? (maxPossibleCost - totalCost) / maxPossibleCost
      : 0;
  }
}
