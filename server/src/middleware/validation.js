// Input validation middleware
export function validateProduct(req, res, next) {
  const { name, sku, price, quantity } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Product name must be at least 2 characters' });
  }
  
  if (!sku || sku.trim().length < 1) {
    return res.status(400).json({ error: 'SKU is required' });
  }
  // Coerce price and quantity to numbers to accept string inputs from forms
  const parsedPrice = price === undefined || price === null ? NaN : Number(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: 'Price must be a valid non-negative number' });
  }

  const parsedQuantity = quantity === undefined || quantity === null ? NaN : Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a valid non-negative integer' });
  }
  
  next();
}

export function validateSalesOrder(req, res, next) {
  const { customer_name, customer_phone, items } = req.body;
  
  // Customer name and phone are now optional
  if (customer_name && customer_name.trim().length < 2) {
    return res.status(400).json({ error: 'Customer name must be at least 2 characters' });
  }
  
  if (customer_phone && customer_phone.trim().length < 5) {
    return res.status(400).json({ error: 'Customer phone must be at least 5 characters' });
  }
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }
  
  for (const item of items) {
    if (!item.product_id || item.product_id.trim().length === 0) {
      return res.status(400).json({ error: 'All items must have a product_id' });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ error: 'Item quantity must be a positive integer' });
    }
  }
  
  next();
}

export function validateCustomer(req, res, next) {
  const { name, phone, email } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Customer name must be at least 2 characters' });
  }
  
  if (!phone || phone.trim().length < 5) {
    return res.status(400).json({ error: 'Customer phone must be at least 5 characters' });
  }
  
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
}
