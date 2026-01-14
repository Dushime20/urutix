export interface BrokerContractData {
  // Parties Information
  cargoOwner: {
    name: string;
    company: string;
    address: string;
    phone: string;
    email: string;
    registrationNumber?: string;
  };
  broker: {
    name: string;
    company: string;
    address: string;
    phone: string;
    email: string;
    licenseNumber?: string;
    registrationNumber?: string;
  };
  
  // Load Details
  load: {
    id: string;
    title: string;
    description: string;
    value: number;
    currency: string;
    weight?: number;
    cargoType: string;
    pickupLocation: string;
    deliveryLocation: string;
    pickupDate: string;
    deliveryDate: string;
  };
  
  // Commission Agreement
  commission: {
    rate: number; // percentage
    amount: number; // calculated amount
    paymentTerms: string; // e.g., "Net 30 days"
    paymentMethod: string; // e.g., "Bank Transfer"
  };
  
  // Contract Details
  contract: {
    id: string;
    date: string;
    effectiveDate: string;
    expirationDate?: string;
    jurisdiction: string;
  };
}

export const generateBrokerContract = (data: BrokerContractData): string => {
  return `
BROKER SERVICE AGREEMENT

Contract ID: ${data.contract.id}
Date: ${data.contract.date}

PARTIES:

1. CARGO OWNER ("Principal"):
   Name: ${data.cargoOwner.name}
   Company: ${data.cargoOwner.company}
   Address: ${data.cargoOwner.address}
   Phone: ${data.cargoOwner.phone}
   Email: ${data.cargoOwner.email}
   ${data.cargoOwner.registrationNumber ? `Registration: ${data.cargoOwner.registrationNumber}` : ''}

2. BROKER ("Agent"):
   Name: ${data.broker.name}
   Company: ${data.broker.company}
   Address: ${data.broker.address}
   Phone: ${data.broker.phone}
   Email: ${data.broker.email}
   ${data.broker.licenseNumber ? `License: ${data.broker.licenseNumber}` : ''}
   ${data.broker.registrationNumber ? `Registration: ${data.broker.registrationNumber}` : ''}

LOAD DETAILS:

Load ID: ${data.load.id}
Description: ${data.load.title}
Cargo Type: ${data.load.cargoType}
${data.load.weight ? `Weight: ${data.load.weight} kg` : ''}
Load Value: ${data.load.currency} ${data.load.value.toLocaleString()}

Route:
From: ${data.load.pickupLocation}
To: ${data.load.deliveryLocation}
Pickup Date: ${data.load.pickupDate}
Delivery Date: ${data.load.deliveryDate}

COMMISSION AGREEMENT:

Commission Rate: ${data.commission.rate}%
Commission Amount: ${data.load.currency} ${data.commission.amount.toLocaleString()}
Payment Terms: ${data.commission.paymentTerms}
Payment Method: ${data.commission.paymentMethod}

TERMS AND CONDITIONS:

1. SCOPE OF SERVICES
   1.1 The Broker agrees to provide logistics brokerage services for the specified load.
   1.2 Services include carrier sourcing, rate negotiation, documentation, and shipment coordination.
   1.3 The Broker will act as an intermediary between the Cargo Owner and transportation providers.

2. BROKER OBLIGATIONS
   2.1 Exercise reasonable care and diligence in selecting qualified carriers.
   2.2 Verify carrier insurance, licensing, and safety records.
   2.3 Provide regular updates on shipment status and any issues.
   2.4 Maintain accurate records of all transactions and communications.
   2.5 Comply with all applicable transportation regulations and laws.

3. CARGO OWNER OBLIGATIONS
   3.1 Provide accurate and complete cargo information.
   3.2 Ensure cargo is properly packaged and labeled.
   3.3 Make cargo available for pickup at the agreed time and location.
   3.4 Pay the agreed commission upon successful delivery.
   3.5 Provide necessary documentation (invoices, permits, etc.).

4. COMMISSION AND PAYMENT
   4.1 Commission is earned upon successful delivery of the cargo.
   4.2 Payment is due within ${data.commission.paymentTerms} of delivery confirmation.
   4.3 Late payments may incur interest charges at 1.5% per month.
   4.4 Disputes must be raised within 30 days of delivery.

5. LIABILITY AND INSURANCE
   5.1 The Broker maintains professional liability insurance.
   5.2 Cargo insurance is the responsibility of the Cargo Owner unless otherwise agreed.
   5.3 The Broker's liability is limited to the commission amount for this shipment.
   5.4 Neither party is liable for consequential or indirect damages.

6. CONFIDENTIALITY
   6.1 Both parties agree to maintain confidentiality of business information.
   6.2 Customer lists, pricing, and trade secrets shall remain confidential.
   6.3 This obligation survives termination of this agreement.

7. FORCE MAJEURE
   7.1 Neither party is liable for delays due to acts of God, government actions, or other unforeseeable events.
   7.2 Affected party must notify the other party within 48 hours.

8. DISPUTE RESOLUTION
   8.1 Disputes shall be resolved through good faith negotiation.
   8.2 If negotiation fails, disputes will be submitted to binding arbitration.
   8.3 Arbitration shall be conducted under the rules of the jurisdiction specified below.

9. TERMINATION
   9.1 This agreement terminates upon completion of the specified shipment.
   9.2 Either party may terminate for material breach with 48 hours written notice.
   9.3 Termination does not affect accrued rights and obligations.

10. GENERAL PROVISIONS
    10.1 This agreement constitutes the entire agreement between the parties.
    10.2 Modifications must be in writing and signed by both parties.
    10.3 If any provision is invalid, the remainder remains in effect.
    10.4 This agreement is governed by the laws of ${data.contract.jurisdiction}.

SIGNATURES:

Cargo Owner: _________________________    Date: ___________
${data.cargoOwner.name}
${data.cargoOwner.company}

Broker: _________________________    Date: ___________
${data.broker.name}
${data.broker.company}

Effective Date: ${data.contract.effectiveDate}
${data.contract.expirationDate ? `Expiration Date: ${data.contract.expirationDate}` : ''}

This contract is legally binding upon signature by both parties.
`;
};

// Default contract template for quick generation
export const defaultBrokerContractTemplate = {
  commission: {
    paymentTerms: "Net 30 days",
    paymentMethod: "Bank Transfer"
  },
  contract: {
    jurisdiction: "Kenya"
  }
};

export default {
  generateBrokerContract,
  defaultBrokerContractTemplate
};