import React, { useState, useEffect } from 'react';
import './Invoice.css';
import { FaShoppingCart, FaPlus } from 'react-icons/fa';
import { getCustomers } from '../services/customerService';


function Invoice() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    getCustomers()
      .then(data => setCustomers(data))
      .catch(error => console.error(error));
  }, []);

  return (
    <>
      <div className="invoice-header">
        <h1>
          <FaShoppingCart /> New Sales Invoice
        </h1>
      </div>

      <div>
        <button className="new-sale-btn">
          <FaPlus /> New Sale
        </button>
      </div>

      <div className="form-container">
        <label>
          Customer<span className="required">*</span>
        </label>

        <select>
          <option>Select Customer</option>

          {customers.map(customer => (
           <div key={customer.id}>
          <h3>{customer.name}</h3>
          <p>Code: {customer.code_client}</p>
          <p>Phone: {customer.phone || "N/A"}</p>
          <hr />
        </div>
          ))}
        </select>
      </div>
    </>
  );
}

export default Invoice;