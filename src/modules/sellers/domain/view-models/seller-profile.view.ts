export type SellerWarehouseView = {
  id: number;
  phone: string | null;
  postalCode: string | null;
  city: string | null;
  address: string | null;
  sortOrder: number;
};

export type SellerProfileView = {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  avatarKey: string | null;
  shopName: string | null;
  workplacePhone: string | null;
  province: string | null;
  city: string | null;
  postalCode: string | null;
  salesType: string | null;
  address: string | null;
  industryType: string;
  category: string;
  activityType: string;
  documentType: string;
  documentKey: string;
  status: string;
  profileComplete: boolean;
  warehouses: SellerWarehouseView[];
};

export type RetailSellerProfileView = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  province: string | null;
  city: string | null;
  occupation: string | null;
  address: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  avatarKey: string | null;
};
