const API_URL = import.meta.env.CUSTOMER_URL;

export const getCustomers = async () => {
  const response = await fetch(`${API_URL}/customers`);
  return response.json();
};