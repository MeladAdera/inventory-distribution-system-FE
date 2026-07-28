export { customersApi, type CollectPaymentInput } from './api/customers.api';
export { useCustomers } from './hooks/useCustomers';
export { useCustomerDetail } from './hooks/useCustomerDetail';
export { ClientCustomersPage } from './components/ClientCustomersPage';
export { CustomersTableCard } from './components/CustomersTableCard';
export { CustomerFormModal } from './components/CustomerFormModal';
export { CustomerDetailModal } from './components/CustomerDetailModal';
export { CollectPaymentModal } from './components/CollectPaymentModal';
export { CustomerPicker } from './components/CustomerPicker';
export { buildCustomerSchema, type CustomerFormData } from './validations/customers.schema';
export type {
  Customer,
  CustomerListParams,
  CustomerSummary,
  CreateCustomerInput,
  UpdateCustomerInput,
} from './types/customers.types';
export { CUSTOMER_NOTE_MAX_LENGTH } from './types/customers.types';
