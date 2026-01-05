# 📋 How to Assign a Load to a Broker

## 🎯 **Overview**

Assigning a broker to a load is the first step in the broker workflow. Once assigned, the broker can:
- Facilitate matching with transporters
- Create contracts
- Manage escrow
- Earn commission when the load is completed

---

## 🔌 **API Method**

### **Endpoint:**
```
POST /api/brokers/loads/:loadId/assign
```

### **Required Roles:**
- `TENANT_ADMIN`
- `ADMIN`
- `SUPER_ADMIN`
- `CARGO_OWNER` (can assign to their own loads)

### **Request Body:**
```json
{
  "brokerId": "broker-uuid-here",
  "commissionRate": 5.5  // Optional: Override default commission rate (0-100%)
}
```

### **What Happens:**
1. ✅ Broker is assigned to the load
2. ✅ Commission is calculated automatically
3. ✅ Commission record is created
4. ✅ Email notification sent to broker
5. ✅ Load updated with broker info

---

## 📝 **Step-by-Step Guide**

### **Method 1: Using API Directly (cURL)**

```bash
# 1. Get your authentication token (login first)
TOKEN="your-jwt-token-here"

# 2. Get available brokers
curl -X GET "http://localhost:3002/api/brokers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 3. Assign broker to load
curl -X POST "http://localhost:3002/api/brokers/loads/LOAD_ID/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "BROKER_ID",
    "commissionRate": 5.5
  }'
```

### **Method 2: Using Frontend API Service**

```typescript
import { brokerAPI } from './services/brokerApi';

// Assign broker to load
const assignBroker = async (loadId: string, brokerId: string, commissionRate?: number) => {
  try {
    const response = await brokerAPI.assignBrokerToLoad(loadId, {
      brokerId,
      commissionRate, // Optional: 5.5 means 5.5%
    });
    console.log('Broker assigned:', response.data);
  } catch (error) {
    console.error('Failed to assign broker:', error);
  }
};

// Example usage
assignBroker('load-uuid-123', 'broker-uuid-456', 5.5);
```

### **Method 3: Using Postman/Thunder Client**

1. **Request Type:** `POST`
2. **URL:** `http://localhost:3002/api/brokers/loads/{loadId}/assign`
3. **Headers:**
   ```
   Authorization: Bearer YOUR_TOKEN
   Content-Type: application/json
   ```
4. **Body (JSON):**
   ```json
   {
     "brokerId": "broker-uuid",
     "commissionRate": 5.5
   }
   ```

---

## 💡 **Example Workflow**

### **Scenario: Cargo Owner wants to assign a broker to their load**

**Step 1: List Available Brokers**
```bash
GET /api/brokers
```

**Response:**
```json
[
  {
    "id": "broker-1-uuid",
    "email": "broker1@example.com",
    "defaultCommissionRate": 5.0,
    "totalCommissionEarned": 50000,
    "profile": {
      "firstName": "John",
      "lastName": "Broker",
      "companyName": "ABC Logistics"
    }
  },
  {
    "id": "broker-2-uuid",
    "email": "broker2@example.com",
    "defaultCommissionRate": 7.5,
    "totalCommissionEarned": 120000
  }
]
```

**Step 2: Assign Broker to Load**
```bash
POST /api/brokers/loads/load-123/assign
Body: {
  "brokerId": "broker-1-uuid",
  "commissionRate": 5.5  // Optional: custom rate
}
```

**Response:**
```json
{
  "id": "load-123",
  "title": "Electronics Shipment",
  "loadValue": 100000,
  "brokerId": "broker-1-uuid",
  "brokerCommissionRate": 5.5,
  "brokerCommissionAmount": 5500,
  "broker": {
    "id": "broker-1-uuid",
    "email": "broker1@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Broker"
    }
  }
}
```

**Step 3: Verify Assignment**
```bash
GET /api/brokers/broker-1-uuid/loads
```

**Response:**
```json
[
  {
    "id": "load-123",
    "title": "Electronics Shipment",
    "status": "ASSIGNED",
    "brokerCommissionRate": 5.5,
    "brokerCommissionAmount": 5500
  }
]
```

---

## 🔄 **What Happens After Assignment?**

### **Automatic Actions:**
1. ✅ **Load Updated:**
   - `brokerId` set
   - `brokerCommissionRate` set
   - `brokerCommissionAmount` calculated

2. ✅ **Commission Record Created:**
   - Status: `PENDING`
   - Will be `APPROVED` when load is completed
   - Will be `PAID` when commission is paid

3. ✅ **Email Sent to Broker:**
   - Notification about new load assignment
   - Load details
   - Commission rate and amount

4. ✅ **Broker Can Now:**
   - View the load in "My Loads"
   - Use Smart Matching to find transporters
   - Create contracts
   - Set up escrow
   - Facilitate the deal

---

## 🎨 **Frontend UI Integration**

### **Option 1: Add to Load Details Page**

You can add a "Assign Broker" button to the load details page:

```typescript
// In LoadDetails component
const handleAssignBroker = async (brokerId: string, commissionRate?: number) => {
  try {
    await brokerAPI.assignBrokerToLoad(loadId, {
      brokerId,
      commissionRate,
    });
    toast.success('Broker assigned successfully');
    // Refresh load data
  } catch (error) {
    toast.error('Failed to assign broker');
  }
};
```

### **Option 2: Add to Cargo Owner Dashboard**

Add a broker selection dropdown when creating/editing loads:

```typescript
// In LoadForm component
const [selectedBroker, setSelectedBroker] = useState<string>('');
const [brokers, setBrokers] = useState([]);

useEffect(() => {
  // Load available brokers
  brokerAPI.getBrokers().then(res => {
    setBrokers(res.data || []);
  });
}, []);

// In form submission
const handleSubmit = async (loadData) => {
  // Create load first
  const load = await createLoad(loadData);
  
  // Then assign broker if selected
  if (selectedBroker) {
    await brokerAPI.assignBrokerToLoad(load.id, {
      brokerId: selectedBroker,
    });
  }
};
```

---

## 📊 **Commission Calculation**

### **How Commission is Calculated:**

```typescript
commissionRate = assignDto.commissionRate ?? broker.defaultCommissionRate ?? 5.0
commissionAmount = (load.loadValue * commissionRate) / 100
```

### **Example:**
- Load Value: 100,000 KES
- Commission Rate: 5.5%
- Commission Amount: 5,500 KES

### **Commission Status Flow:**
```
PENDING → (when load completed) → APPROVED → (when paid) → PAID
```

---

## 🔐 **Permissions & Access Control**

### **Who Can Assign:**
- ✅ **Cargo Owner:** Can assign to their own loads
- ✅ **Tenant Admin:** Can assign to any load in their tenant
- ✅ **Admin/Super Admin:** Can assign to any load

### **Who Cannot Assign:**
- ❌ **Broker:** Cannot assign themselves (must be assigned by cargo owner/admin)
- ❌ **Transporter:** Cannot assign brokers

---

## 🚫 **Unassigning a Broker**

### **Endpoint:**
```
DELETE /api/brokers/loads/:loadId/assign
```

### **What Happens:**
- ✅ Broker removed from load
- ✅ Commission record cancelled (if still PENDING)
- ✅ Load broker fields cleared

### **Example:**
```bash
curl -X DELETE "http://localhost:3002/api/brokers/loads/LOAD_ID/assign" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📧 **Email Notifications**

When a broker is assigned, they receive an email with:
- Load title and ID
- Commission rate
- Commission amount
- Link to view load details

---

## ✅ **Verification**

### **Check if Load Has Broker:**
```bash
GET /api/loads/LOAD_ID
```

**Response includes:**
```json
{
  "id": "load-123",
  "brokerId": "broker-uuid",
  "brokerCommissionRate": 5.5,
  "brokerCommissionAmount": 5500,
  "broker": {
    "id": "broker-uuid",
    "email": "broker@example.com"
  }
}
```

### **Check Broker's Assigned Loads:**
```bash
GET /api/brokers/BROKER_ID/loads
```

---

## 🎯 **Quick Reference**

### **API Endpoint:**
```
POST /api/brokers/loads/:loadId/assign
```

### **Required Body:**
```json
{
  "brokerId": "uuid",
  "commissionRate": 5.5  // Optional
}
```

### **Required Headers:**
```
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

### **Success Response:**
```json
{
  "id": "load-id",
  "brokerId": "broker-id",
  "brokerCommissionRate": 5.5,
  "brokerCommissionAmount": 5500
}
```

---

## 💻 **Frontend Integration Example**

If you want to add a UI for this, here's a simple component:

```typescript
// AssignBrokerModal.tsx
const AssignBrokerModal = ({ loadId, onClose, onSuccess }) => {
  const [brokers, setBrokers] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState('');
  const [commissionRate, setCommissionRate] = useState(5.0);

  useEffect(() => {
    brokerAPI.getBrokers().then(res => {
      const brokersData = res.data || res || [];
      setBrokers(Array.isArray(brokersData) ? brokersData : []);
    });
  }, []);

  const handleAssign = async () => {
    await brokerAPI.assignBrokerToLoad(loadId, {
      brokerId: selectedBroker,
      commissionRate,
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="modal">
      <select value={selectedBroker} onChange={e => setSelectedBroker(e.target.value)}>
        <option value="">Select Broker</option>
        {brokers.map(broker => (
          <option key={broker.id} value={broker.id}>
            {broker.profile?.firstName} {broker.profile?.lastName} 
            (Default: {broker.defaultCommissionRate}%)
          </option>
        ))}
      </select>
      <input
        type="number"
        value={commissionRate}
        onChange={e => setCommissionRate(parseFloat(e.target.value))}
        placeholder="Commission Rate %"
      />
      <button onClick={handleAssign}>Assign Broker</button>
    </div>
  );
};
```

---

## 🎉 **Summary**

**To assign a broker to a load:**

1. **Get broker ID** (from `/api/brokers`)
2. **Call assignment endpoint** (`POST /api/brokers/loads/:loadId/assign`)
3. **Provide broker ID and optional commission rate**
4. **System automatically:**
   - Calculates commission
   - Creates commission record
   - Sends email to broker
   - Updates load

**That's it! The broker is now assigned and can start working on the load.** 🚀

