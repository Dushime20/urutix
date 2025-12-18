export interface Receiver {
  id: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface CreateReceiverDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface AssignCargoDto {
  receiverId: string;
}

