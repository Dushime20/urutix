# Lending Policies System - User Guide

## 🎯 Quick Start

### Accessing the System
1. Log in to UrutiX as a Lender
2. Navigate to: **Lender Dashboard → Policies** or directly to `/lender/policies`
3. The system will load your existing policies

## 📋 Understanding the Interface

### Main Dashboard
When you first access the page, you'll see:

**Top Statistics Cards:**
- **Active Rate Policies** - Number of active interest rate policies
- **Avg Base Rate** - Average interest rate across all policies
- **Max Exposure** - Maximum loan exposure limit
- **Policy Health** - Overall system health percentage

**Left Sidebar - Policy Types:**
- 📊 Interest Rates
- 💰 Loan Limits
- 👥 Eligibility
- ⚖️ Risk Rules
- 📅 Repayment
- 🚛 Cargo Policies
- ⚙️ System Config

**Main Content Area:**
- Table showing policies for the selected type
- "NEW CONFIGURATION" button to create new policies

## 🆕 Creating a New Policy

### Step 1: Select Policy Type
Click on any policy type in the left sidebar:
- Interest Rates
- Loan Limits
- Eligibility
- Risk Rules
- Repayment
- Cargo Policies
- System Config

### Step 2: Click "NEW CONFIGURATION"
The button is located in the top-right of the content area.

### Step 3: Fill in the Form
A modal will open with fields specific to the policy type you selected.

#### Example: Creating an Interest Rate Policy
1. **Policy Name**: "Standard Rate for SMEs"
2. **Risk Level**: Select from dropdown (low, medium, high, critical)
3. **Base Rate (%)**: 12.0
4. **Minimum Rate (%)**: 10.0
5. **Maximum Rate (%)**: 15.0
6. **Adjustment Factors**:
   - Credit Score Factor: 0.5
   - Loan History Factor: 0.3
   - Collateral Factor: 0.4
   - Business Type Factor: 0.2

#### Example: Creating a Loan Limit Policy
1. **Policy Name**: "SME Loan Limits"
2. **Business Type**: Select "sme" from dropdown
3. **Minimum Amount (RWF)**: 100,000
4. **Maximum Amount (RWF)**: 5,000,000
5. **Credit Score Requirement**: 650
6. **Collateral Requirement (%)**: 120
7. **Max Utilization (%)**: 80

#### Example: Creating System Configuration
1. **Configuration Name**: "Global Lending Config"
2. **Auto Approval Limit (RWF)**: 200,000
3. **Manual Review Threshold (RWF)**: 500,000
4. **Max Concurrent Loans**: 5
5. **Total Exposure Limit (RWF)**: 10,000,000
6. **Cooldown Period (days)**: 30
7. **Strict Compliance Mode**: ✓ (checked)
8. **Audit Trail Enabled**: ✓ (checked)

### Step 4: Submit
Click the **"Create Policy"** button at the bottom of the modal.

### Step 5: Confirmation
- You'll see a success message
- The modal will close
- The page will refresh
- Your new policy will appear in the table

## 🔄 Managing Existing Policies

### Viewing Policies
- Click on any tab to see policies of that type
- Policies are displayed in a table with all relevant information
- Active policies are highlighted
- Inactive policies are grayed out

### Activating/Deactivating a Policy
1. Find the policy in the table
2. Look for the toggle switch in the "STATUS" column
3. Click the toggle to activate or deactivate
4. The change is saved immediately to the database
5. Visual indicator updates instantly

**Active Policy:**
- Toggle switch is blue/green
- Shows "Active" label
- Policy is used in loan validation

**Inactive Policy:**
- Toggle switch is gray
- Shows "Disabled" label
- Policy is ignored in loan validation

### Editing a Policy
1. Find the policy in the table
2. Click the edit icon (pencil) on the right
3. Modal opens with current values
4. Make your changes
5. Click "Save Changes"

### Exporting Policies
1. Click the **"Export Scheme"** button in the top-right
2. A JSON file will download with all your policies
3. Use this for backup or documentation

## 📊 Policy Types Explained

### 1. Interest Rates
**Purpose**: Define how interest rates are calculated based on risk levels.

**Key Fields:**
- **Risk Level**: low, medium, high, critical
- **Base Rate**: Starting interest rate
- **Min/Max Rate**: Allowed range
- **Adjustment Factors**: How different factors affect the rate

**Example Use Case:**
- Low-risk borrowers get 8-10% interest
- High-risk borrowers get 15-20% interest
- Factors like credit score adjust the final rate

### 2. Loan Limits
**Purpose**: Set maximum and minimum loan amounts for different business types.

**Key Fields:**
- **Business Type**: individual, SME, corporation, cooperative
- **Min/Max Amount**: Loan size limits
- **Credit Score Requirement**: Minimum credit score needed
- **Collateral Requirement**: Percentage of collateral needed

**Example Use Case:**
- Individuals can borrow 50K-500K RWF
- SMEs can borrow 100K-5M RWF
- Corporations can borrow 1M-50M RWF

### 3. Eligibility Criteria
**Purpose**: Define requirements borrowers must meet to qualify for loans.

**Key Fields:**
- **Category**: credit_score, business_age, revenue, etc.
- **Requirement**: Description of what's needed
- **Min/Max Values**: Numeric thresholds
- **Required**: Whether this is mandatory

**Example Use Case:**
- Credit score must be above 600
- Business must be at least 2 years old
- Annual revenue must exceed 10M RWF

### 4. Risk Assessment Rules
**Purpose**: Define how borrower risk is calculated.

**Key Fields:**
- **Factor**: What aspect to evaluate (credit_score, payment_history, etc.)
- **Weight**: How important this factor is (%)
- **Scoring Criteria**: Points for excellent, good, fair, poor

**Example Use Case:**
- Credit score (40% weight): 750+ = excellent, 650-749 = good, etc.
- Payment history (30% weight): 0 late payments = excellent, etc.
- Total score determines approval

### 5. Repayment Policies
**Purpose**: Define repayment terms and penalties.

**Key Fields:**
- **Frequency**: weekly, monthly, quarterly, etc.
- **Grace Period**: Days before late fees apply
- **Late Fee**: Fixed amount charged for late payment
- **Penalty Rate**: Additional interest for late payment
- **Default Threshold**: Days before loan is considered defaulted

**Example Use Case:**
- Monthly payments required
- 7-day grace period
- 5,000 RWF late fee after grace period
- 2% penalty rate on overdue amount
- Default after 90 days

### 6. Cargo Type Policies
**Purpose**: Set special rules for different types of cargo.

**Key Fields:**
- **Cargo Type**: electronics, food, chemicals, etc.
- **Risk Level**: low, medium, high, critical
- **Risk Multiplier**: How much to adjust risk score
- **Max Loan Amount**: Maximum for this cargo type
- **Insurance Required**: Whether insurance is mandatory
- **Special Conditions**: Additional requirements

**Example Use Case:**
- Electronics: high risk, insurance required, max 2M RWF
- Food: medium risk, refrigeration required, max 1M RWF
- Textiles: low risk, standard terms, max 5M RWF

### 7. System Configuration
**Purpose**: Set global parameters for the entire lending system.

**Key Fields:**
- **Auto Approval Limit**: Loans below this are auto-approved
- **Manual Review Threshold**: Loans above this need manual review
- **Max Concurrent Loans**: Maximum loans per borrower
- **Total Exposure Limit**: Maximum total lending exposure
- **Cooldown Period**: Days between loan applications
- **Compliance Mode**: Strict rule enforcement
- **Audit Trail**: Log all policy changes

**Example Use Case:**
- Auto-approve loans under 200K RWF
- Manually review loans over 500K RWF
- Allow max 5 concurrent loans per borrower
- Total exposure capped at 10M RWF
- 30-day cooldown between applications

## 🎯 Best Practices

### Starting Fresh
1. **Create System Config First**: Set global limits
2. **Create Interest Rate Policies**: Define pricing
3. **Create Loan Limit Policies**: Set borrowing limits
4. **Create Eligibility Criteria**: Define who qualifies
5. **Create Risk Assessment Rules**: Define how to score borrowers
6. **Create Repayment Policies**: Set payment terms
7. **Create Cargo Type Policies**: Add industry-specific rules

### Naming Conventions
- Use descriptive names: "SME Standard Rate" not "Policy 1"
- Include risk level in name: "High Risk Premium Rate"
- Include business type: "Individual Borrower Limits"

### Testing Policies
1. Create policies with conservative limits first
2. Test with a few loans
3. Monitor results
4. Adjust policies based on performance
5. Gradually increase limits as confidence grows

### Managing Multiple Policies
- Keep only necessary policies active
- Deactivate outdated policies instead of deleting
- Use priority to control which policy applies first
- Export policies regularly for backup

### Compliance
- Enable "Strict Compliance Mode" in System Config
- Enable "Audit Trail" to track all changes
- Review policies quarterly
- Document reasons for policy changes

## 🔍 Troubleshooting

### "No policies found"
- This is normal for new lenders
- Click "NEW CONFIGURATION" to create your first policy
- Start with System Config to set global limits

### "Failed to create policy"
- Check that all required fields are filled
- Ensure numeric values are valid
- Check that min values are less than max values
- Verify you have permission to create policies

### "Policy not appearing after creation"
- Wait a moment and refresh the page
- Check the correct tab is selected
- Verify the policy was created in the database

### Toggle not working
- Check your internet connection
- Verify you have permission to modify policies
- Try refreshing the page

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify backend is running
3. Check network tab for failed API calls
4. Contact system administrator

## 🎉 Tips for Success

1. **Start Simple**: Create basic policies first, add complexity later
2. **Test Thoroughly**: Test policies with sample loans before going live
3. **Monitor Performance**: Track loan approval rates and defaults
4. **Adjust Regularly**: Update policies based on market conditions
5. **Document Changes**: Keep notes on why policies were changed
6. **Use Descriptive Names**: Make policies easy to identify
7. **Keep Backups**: Export policies regularly
8. **Review Quarterly**: Ensure policies still make sense

---

**Need Help?** Contact your system administrator or refer to the technical documentation.

**Version**: 1.0.0
**Last Updated**: December 2024
