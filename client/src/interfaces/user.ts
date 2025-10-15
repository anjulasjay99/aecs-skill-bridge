export enum UserRoles {
    ADMIN = "admin",
    CUSTOMER = "customer"
}

export interface UserData {
    name: string;
    surname: string;
    company?: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    selectedPackage: string;
}