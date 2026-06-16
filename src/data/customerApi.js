import customersData from "../data/customers.json";

export const getCustomers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(customersData);
    }, 1000); // 1 second delay
  });
};