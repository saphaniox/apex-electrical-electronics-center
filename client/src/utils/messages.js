/**
 * User-friendly messages for the application
 * Centralized location for all user-facing messages to ensure consistency and ease of updates
 */

export const MESSAGES = {
  // Authentication
  auth: {
    loginSuccess: 'Welcome back! Logging you in...',
    loginFailed: 'Unable to log in. Please check your credentials and try again.',
    registerSuccess: '🎉 Account created successfully! Welcome aboard!',
    registerFailed: 'Unable to create account. Please try again.',
    passwordMismatch: "Passwords don't match. Please make sure both passwords are the same.",
    logoutSuccess: 'You\'ve been logged out successfully. See you soon!',
  },

  // Products
  products: {
    addSuccess: '✅ New product added to inventory!',
    updateSuccess: '✅ Product updated successfully!',
    deleteSuccess: '🗑️ Product removed from inventory successfully',
    deleteFailed: 'Unable to delete this product. It may be referenced in existing orders or invoices.',
    fetchFailed: 'Unable to load products. Please refresh the page.',
    saveFailed: 'Unable to save product. Please check all fields and try again.',
    noProductsToExport: 'No products available to export. Try adjusting your filters or adding products first.',
    noProductsToPrint: 'No products available to print. Please add some products first.',
    exportSuccess: '✅ Products exported successfully!',
    exportFailed: 'Unable to export products. Please try again.',
  },

  // Customers
  customers: {
    addSuccess: '✅ New customer added to your records!',
    updateSuccess: '✅ Customer information updated successfully!',
    deleteSuccess: '🗑️ Customer deleted successfully',
    deleteFailed: 'Unable to delete customer. They may have existing orders or invoices.',
    fetchFailed: 'Unable to load customers. Please refresh the page to try again.',
    saveFailed: 'Unable to save customer. Please check all fields and try again.',
    noCustomersToExport: 'No customers available to export. Try adding customers or adjusting filters.',
    noCustomersToPrint: 'No customers available to print. Add some customers first or adjust your filters.',
    exportSuccess: '✅ Customer list exported successfully!',
    exportFailed: 'Unable to export customers. Please try again.',
    historyFailed: 'Unable to load purchase history. Please try again.',
  },

  // Sales Orders
  sales: {
    createSuccess: '🎉 Sales order created successfully!',
    updateSuccess: '✅ Sales order updated successfully!',
    deleteSuccess: '🗑️ Sales order deleted successfully',
    deleteFailed: 'Unable to delete sales order. Please try again.',
    fetchFailed: 'Unable to load sales orders. Please refresh and try again.',
    saveFailed: 'Unable to save sales order. Please check all fields and try again.',
    noItemsError: 'Please add at least one product to the order before saving.',
    noOrdersToExport: 'No sales orders available to export. Try adjusting your filters.',
    noOrdersToPrint: 'No sales orders available to print.',
    exportSuccess: '✅ Sales orders exported successfully!',
    exportFailed: 'Unable to export sales orders. Please try again.',
  },

  // Invoices
  invoices: {
    generateSuccess: '✅ Invoice generated successfully!',
    updateSuccess: '✅ Invoice updated successfully!',
    deleteSuccess: '🗑️ Invoice deleted successfully',
    deleteFailed: 'Unable to delete invoice. Please try again.',
    fetchFailed: 'Unable to load invoices. Please refresh and try again.',
    saveFailed: 'Unable to save invoice. Please check all fields and try again.',
    noItemsError: 'Please add at least one product to the invoice before saving.',
    noInvoicesToExport: 'No invoices available to export. Try adjusting your filters.',
    exportSuccess: '✅ Invoices exported successfully!',
    exportFailed: 'Unable to export invoices. Please try again.',
  },

  // Returns
  returns: {
    createSuccess: '✅ Return request submitted successfully! It will be reviewed by management.',
    approveSuccess: '✅ Return approved! Inventory has been restored automatically.',
    rejectSuccess: '✅ Return request rejected',
    deleteSuccess: '🗑️ Return deleted successfully',
    fetchFailed: 'Unable to load returns. Please refresh the page.',
    createFailed: 'Unable to create return request. Please try again.',
    approveFailed: 'Unable to approve return. Please try again.',
    rejectFailed: 'Unable to reject return. Please try again.',
    deleteFailed: 'Unable to delete return. Please try again.',
    noItemsError: 'Please select at least one item to return before submitting.',
    reasonRequired: 'Please provide a reason for rejection.',
  },

  // Backup
  backup: {
    createSuccess: '✅ Database backup created successfully! Your data is safe.',
    createFailed: 'Unable to create backup. Please try again.',
    restoreSuccess: '✅ Database restored successfully! Please refresh the page.',
    restoreFailed: 'Unable to restore backup. Please try again or contact support.',
    downloadSuccess: '✅ Backup downloaded successfully!',
    downloadFailed: 'Unable to download backup. Please try again.',
    deleteSuccess: '🗑️ Backup deleted successfully',
    deleteFailed: 'Unable to delete backup. Please try again.',
    fetchFailed: 'Unable to load backup list. Please refresh and try again.',
  },

  // Profile
  profile: {
    uploadSuccess: '✅ Profile picture updated successfully!',
    uploadFailed: 'Unable to upload profile picture. Please try again.',
    deleteSuccess: '🗑️ Profile picture removed successfully',
    deleteFailed: 'Unable to remove profile picture. Please try again.',
    passwordChangeSuccess: '🔒 Password changed successfully! Your account is now more secure.',
    passwordChangeFailed: 'Unable to change password. Please check your current password and try again.',
    invalidFileType: 'Please upload an image file (JPG, PNG, or GIF)',
    fileTooLarge: 'Image file size must be less than 5MB. Please choose a smaller image.',
  },

  // Users
  users: {
    roleUpdateSuccess: (role) => `✅ User role updated to ${role} successfully!`,
    deleteSuccess: '🗑️ User account deleted successfully',
    deleteFailed: 'Unable to delete user. They may have existing records in the system.',
    fetchFailed: 'Unable to load users. Please refresh and try again.',
    roleUpdateFailed: 'Unable to update user role. Please try again.',
    passwordChangeSuccess: (username) => `🔒 Password updated successfully for ${username}. They can now use their new password to log in.`,
    passwordChangeFailed: 'Unable to change password. Please try again.',
    permissionDenied: 'You do not have permission to perform this action. Only administrators can manage users.',
  },

  // Form Validation
  validation: {
    required: (field) => `Please enter ${field}`,
    requiredSelect: (field) => `Please select ${field}`,
    invalidEmail: 'Please enter a valid email address',
    passwordTooShort: 'Password must be at least 8 characters for security',
  },

  // Confirmations
  confirmations: {
    deleteProduct: {
      title: 'Delete Product',
      content: 'Are you sure you want to permanently delete this product? This action cannot be undone and will remove all product history.',
      okText: 'Yes, Delete',
      cancelText: 'No, Keep It',
    },
    deleteCustomer: {
      title: 'Delete Customer',
      content: 'Are you sure you want to permanently delete this customer? This will remove all their information and cannot be undone.',
      okText: 'Yes, Delete',
      cancelText: 'No, Keep',
    },
    deleteSalesOrder: {
      title: 'Delete Sales Order',
      content: 'Are you sure you want to permanently delete this sales order? This action cannot be undone.',
      okText: 'Yes, Delete',
      cancelText: 'No, Keep',
    },
    deleteInvoice: {
      title: 'Delete Invoice',
      content: 'Are you sure you want to permanently delete this invoice? This action cannot be undone.',
      okText: 'Yes, Delete',
      cancelText: 'No, Keep',
    },
    deleteUser: {
      title: 'Delete User Account',
      content: 'Are you sure you want to permanently delete this user account? This action cannot be undone and will remove all their data.',
      okText: 'Yes, Delete',
      cancelText: 'No, Cancel',
    },
    removeProfilePicture: {
      title: 'Remove Profile Picture',
      content: 'Are you sure you want to remove your profile picture?',
      okText: 'Yes, Remove',
      cancelText: 'No, Keep It',
    },
    createBackup: {
      title: 'Create Database Backup',
      content: 'This will create a complete backup of your database. It may take a few moments.',
      okText: 'Yes, Create Backup',
      cancelText: 'Cancel',
    },
    restoreBackup: {
      title: '⚠️ Restore Database from Backup',
      content: 'This will replace ALL current data with the backup data. This cannot be undone! Are you absolutely sure you want to continue?',
      okText: 'Yes, Restore Now',
      cancelText: 'No, Cancel',
    },
  },

  // General
  general: {
    loading: 'Loading...',
    saving: 'Saving...',
    deleting: 'Deleting...',
    processing: 'Processing...',
    pleaseWait: 'Please wait...',
    success: 'Success!',
    error: 'An error occurred',
    noData: 'No data available',
    connectionError: 'Connection error. Please check your internet and try again.',
    permissionDenied: 'You don\'t have permission to perform this action.',
    sessionExpired: 'Your session has expired. Please log in again.',
  },
};

export default MESSAGES;
