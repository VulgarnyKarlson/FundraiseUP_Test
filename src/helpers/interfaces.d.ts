export interface Customer {
  _id: any;
  firstName: string;
  lastName: string;
  email: string;
  address: CustomerAddress;
  createdAt: Date;
}

export interface CustomerAddress {
  line1: string;
  line2: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
}
