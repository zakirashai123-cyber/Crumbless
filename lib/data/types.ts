export type PickupStatus = "open" | "claimed" | "in_transit" | "delivered" | "cancelled";
export type UserRole = "business" | "student" | "admin";
export type ProfileStatus = "pending" | "approved";
export type FoodCategory = "Prepared" | "Produce" | "Bakery" | "Dairy" | "Packaged";

export interface DropoffSite {
  id: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
}

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  status: ProfileStatus;
  businessName?: string;
  address?: string;
  school?: string;
  grade?: string;
  phone?: string;
  guardianContact?: string;
  licenseUrl?: string;
  insuranceUrl?: string;
}

export interface Pickup {
  id: string;
  businessId: string;
  businessName: string;
  food: string;
  category: FoodCategory;
  quantity: string;
  pickupWindow: string;
  pickupAddress: string;
  dropoffSiteId: string;
  status: PickupStatus;
  photoUrl?: string;
  notes?: string;
  hoursCredit: number;
  createdAt: string;
  studentId?: string;
  studentName?: string;
  distanceMiles?: number;
}

export interface NewPickup {
  businessId: string;
  businessName: string;
  food: string;
  category: FoodCategory;
  quantity: string;
  pickupWindow: string;
  pickupAddress: string;
  dropoffSiteId: string;
  notes?: string;
}

export interface HoursEntry {
  id: string;
  pickupId: string;
  food: string;
  businessName: string;
  dropoffSiteName: string;
  deliveredAt: string;
  hours: number;
}

export interface DB {
  listDropoffSites(): Promise<DropoffSite[]>;
  listOpenPickups(): Promise<Pickup[]>;
  listBusinessPickups(businessId: string): Promise<Pickup[]>;
  createPickup(input: NewPickup): Promise<Pickup>;
  cancelPickup(id: string): Promise<void>;
  claimPickup(id: string, studentId: string): Promise<Pickup>;
  markPickedUp(id: string): Promise<Pickup>;
  markDelivered(id: string): Promise<Pickup>;
  getStudentHours(studentId: string): Promise<{ total: number; history: HoursEntry[] }>;
}

export const DEMO_BUSINESS_ID = "demo-business-1";
export const DEMO_BUSINESS_NAME = "Demo Business";
export const DEMO_STUDENT_ID = "demo-student-zakir";
export const DEMO_STUDENT_NAME = "Zakir";
export const HOURS_PER_TRIP = 1.5;
