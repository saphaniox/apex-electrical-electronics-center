/**
 * User-friendly error messages for API responses
 * Centralized location for all API error messages to ensure consistency
 */

export const ERROR_MESSAGES = {
  // Authentication
  auth: {
    passwordTooShort: 'Password must be at least 8 characters long for security',
    userExists: 'This username or email is already registered. Please try a different one.',
    invalidCredentials: 'Username or password is incorrect. Please try again.',
    usernameNotFound: 'Username not found. Please check your credentials and try again.',
    incorrectPassword: 'Incorrect password. Please try again.',
    unauthorized: 'You are not authorized to perform this action',
    sessionExpired: 'Your session has expired. Please log in again.',
    invalidToken: 'Invalid authentication token. Please log in again.',
  },

  // Products
  products: {
    skuExists: (sku) => `This SKU "${sku}" is already in use. Please use a unique SKU for each product.`,
    notFound: 'Product not found. It may have been deleted. Please refresh and try again.',
    insufficientStock: (name, available, requested) => 
      `Sorry, we don't have enough stock for ${name}. Available: ${available} units, but you requested: ${requested} units. Please reduce the quantity.`,
    invalidPrice: 'Please enter a valid price greater than zero.',
    invalidQuantity: 'Please enter a valid quantity.',
  },

  // Customers
  customers: {
    phoneExists: (phone) => `A customer with phone number "${phone}" already exists. Please use a different phone number or update the existing customer.`,
    notFound: 'Customer not found. They may have been deleted.',
    invalidPhone: 'Please enter a valid phone number.',
    invalidEmail: 'Please enter a valid email address.',
  },

  // Sales Orders
  sales: {
    noItems: 'Please add at least one item to create an order.',
    invalidCurrency: 'Please select a valid currency (UGX or USD).',
    productNotFound: 'Product not found. It may have been deleted. Please refresh and try again.',
    insufficientStock: (name, available, requested) => 
      `Sorry, we don't have enough stock for ${name}. Available: ${available} units, but you requested: ${requested} units. Please reduce the quantity.`,
    notFound: 'Sales order not found. It may have been deleted.',
    cannotModify: 'This order cannot be modified because it has already been processed.',
  },

  // Invoices
  invoices: {
    noItems: 'Please add at least one item to create an invoice.',
    notFound: 'Invoice not found. It may have been deleted.',
    alreadyPaid: 'This invoice has already been marked as paid and cannot be modified.',
    invalidStatus: 'Please select a valid invoice status.',
  },

  // Returns
  returns: {
    noItems: 'Please select at least one item to return.',
    orderNotFound: 'Sales order not found for this return.',
    invalidStatus: 'Invalid return status.',
    alreadyProcessed: 'This return has already been processed and cannot be modified.',
    reasonRequired: 'Please provide a reason for the return.',
  },

  // Backup
  backup: {
    creationFailed: 'Unable to create backup. Please try again or contact support.',
    restoreFailed: 'Unable to restore backup. The backup file may be corrupted.',
    notFound: 'Backup file not found.',
    invalidFile: 'Invalid backup file format.',
    permissionDenied: 'Only administrators can manage database backups.',
  },

  // Users
  users: {
    notFound: 'User not found.',
    cannotDeleteSelf: 'You cannot delete your own account.',
    permissionDenied: 'You do not have permission to manage users. Only administrators can perform this action.',
    invalidRole: 'Please select a valid user role.',
    passwordChangeFailed: 'Unable to change password. Please ensure the current password is correct.',
  },

  // General
  general: {
    serverError: 'An unexpected error occurred. Please try again later.',
    invalidRequest: 'Invalid request. Please check your input and try again.',
    notFound: 'The requested resource was not found.',
    validationError: 'Please check your input and try again.',
    databaseError: 'Database error. Please try again later.',
    connectionError: 'Unable to connect to the server. Please check your connection.',
  },
};

export const SUCCESS_MESSAGES = {
  // Authentication
  auth: {
    registerSuccess: 'User registered successfully',
    loginSuccess: 'Login successful',
    logoutSuccess: 'Logged out successfully',
  },

  // Products
  products: {
    created: 'Product created successfully',
    updated: 'Product updated successfully',
    deleted: 'Product deleted successfully',
  },

  // Customers
  customers: {
    created: 'Customer created successfully',
    updated: 'Customer updated successfully',
    deleted: 'Customer deleted successfully',
  },

  // Sales Orders
  sales: {
    created: 'Sales order created successfully',
    updated: 'Sales order updated successfully',
    deleted: 'Sales order deleted successfully',
  },

  // Invoices
  invoices: {
    created: 'Invoice created successfully',
    updated: 'Invoice updated successfully',
    deleted: 'Invoice deleted successfully',
  },

  // Returns
  returns: {
    created: 'Return request created successfully',
    approved: 'Return approved successfully',
    rejected: 'Return rejected',
    deleted: 'Return deleted successfully',
  },

  // Backup
  backup: {
    created: 'Backup created successfully',
    restored: 'Database restored successfully',
    deleted: 'Backup deleted successfully',
  },

  // Users
  users: {
    roleUpdated: 'User role updated successfully',
    passwordChanged: 'Password changed successfully',
    deleted: 'User deleted successfully',
  },
};

export default { ERROR_MESSAGES, SUCCESS_MESSAGES };
