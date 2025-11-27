# Matching Algorithms Test Seed Script

This script creates comprehensive test data to validate all matching algorithms in the system.

## What It Creates

### Users
- **deborah@gmail.com** (Cargo Owner) - Creates or finds existing user
- **truck.owner1@test.com** through **truck.owner10@test.com** (Truck Owners) - Creates 10 truck owners

### Test Scenarios

#### 1. WEIGHTED_SCORE Algorithm Test
- **1 Cargo**: Weighted Score Algorithm Test Cargo
- **5 Trucks**: WEIGHTED-001 through WEIGHTED-005
  - Different capacities, distances, ratings, and prices
  - Tests ranking and scoring system
  - Expected: Trucks ranked by overall weighted score

#### 2. HUNGARIAN Algorithm Test
- **3 Cargos**: Hungarian Algorithm Test Cargo 1-3
- **3 Trucks**: HUNGARIAN-T1 through HUNGARIAN-T3
  - Tests optimal assignment for multiple loads and trucks
  - Expected: Cost-minimizing optimal assignments

#### 3. GENETIC Algorithm Test
- **5 Cargos**: Genetic Algorithm Test Cargo 1-5
- **5 Trucks**: GENETIC-T1 through GENETIC-T5
  - Tests evolutionary optimization
  - Expected: Best combinations through genetic evolution

#### 4. TOPSIS Algorithm Test
- **1 Cargo**: TOPSIS Algorithm Test Cargo
- **4 Trucks**: TOPSIS-001 through TOPSIS-004
  - Trucks with conflicting criteria (distance vs price vs rating)
  - Tests multi-criteria decision making
  - Expected: Best compromise solution

#### 5. HYBRID Algorithm Test
- **1 Cargo**: Hybrid Algorithm Test Cargo
- **6 Trucks**: HYBRID-T1 through HYBRID-T6
  - Diverse truck characteristics
  - Tests ensemble approach
  - Expected: Combined results from multiple algorithms

## How to Run

```bash
# From the backend directory
cd urutixv2/backend
npm run seed:matching-algorithms
```

Or using ts-node directly:
```bash
ts-node -r tsconfig-paths/register src/scripts/seed-matching-algorithms-test.ts
```

## Testing the Algorithms

### 1. WEIGHTED_SCORE Algorithm
```bash
POST /matching/find-matches
{
  "loadId": "<weighted-score-cargo-id>",
  "algorithm": "WEIGHTED_SCORE",
  "limit": 10
}
```
**Expected**: 5 trucks ranked by overall weighted score

### 2. HUNGARIAN Algorithm
```bash
POST /matching/find-matches/hungarian
{
  "loadId": "<any-hungarian-cargo-id>",
  "limit": 10
}
```
**Expected**: Optimal assignment minimizing total cost across all cargos and trucks

### 3. GENETIC Algorithm
```bash
POST /matching/find-matches/genetic
{
  "loadId": "<any-genetic-cargo-id>",
  "maxProcessingTime": 30,
  "limit": 10
}
```
**Expected**: Evolutionary optimization finding best combinations

### 4. TOPSIS Algorithm
```bash
POST /matching/find-matches/topsis
{
  "loadId": "<topsis-cargo-id>",
  "limit": 10
}
```
**Expected**: Multi-criteria decision based on ideal/negative-ideal solutions

### 5. HYBRID Algorithm
```bash
POST /matching/find-matches/hybrid
{
  "loadId": "<hybrid-cargo-id>",
  "limit": 10
}
```
**Expected**: Ensemble results combining multiple algorithms

## Test Data Summary

| Scenario | Cargos | Trucks | Algorithm | Purpose |
|----------|--------|--------|-----------|---------|
| Weighted Score | 1 | 5 | WEIGHTED_SCORE | Ranking test |
| Hungarian | 3 | 3 | HUNGARIAN | Optimal assignment |
| Genetic | 5 | 5 | GENETIC | Evolutionary optimization |
| TOPSIS | 1 | 4 | TOPSIS | Multi-criteria decision |
| Hybrid | 1 | 6 | HYBRID | Ensemble approach |

## Expected Results

### WEIGHTED_SCORE
- Trucks ranked by weighted combination of all factors
- Score breakdown shows individual factor contributions
- Best match should have highest overall score

### HUNGARIAN
- Optimal assignments for multiple cargos
- Minimizes total cost across all assignments
- Handles unbalanced scenarios

### GENETIC
- Population-based optimization
- Finds best combinations through evolution
- Converges to optimal solution

### TOPSIS
- Considers ideal and negative-ideal solutions
- Finds best compromise across conflicting criteria
- Normalized decision matrix

### HYBRID
- Combines results from multiple algorithms
- Deduplicates and re-scores
- Highest confidence matches

## Notes

- All data uses tenant ID: `00000000-0000-0000-0000-000000000001`
- Script is idempotent - finds existing data if already created
- Trucks are set to AVAILABLE status
- Cargos are in CREATED/PENDING status
- All trucks and cargos are properly linked to users

## Troubleshooting

If you encounter errors:
1. Ensure database is running
2. Check that users exist (deborah@gmail.com and truck owners)
3. Verify tenant ID matches your system
4. Check truck and cargo entity constraints

