import React, { useState, useEffect } from 'react';
import './Invoice.css';
import { FaShoppingCart, FaCircle } from 'react-icons/fa';
import { getCustomers } from '../data/customerApi';

// Helper: today's date in YYYY-MM-DD format (required by type="date" inputs)
function todayDate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function Invoice() {
  // ── CUSTOMERS ──────────────────────────────────────────────
  // Loaded from local JSON via customerApi.js
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    getCustomers()
      .then(res => setCustomers(res.data || []))
      .catch(err => console.error(err));
  }, []);

  // ── TOP FORM FIELDS ────────────────────────────────────────
  const [customer, setCustomer] = useState('');
  const [refCustomer, setRefCustomer] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayDate());
  const [project, setProject] = useState('');
  const [invoiceType, setInvoiceType] = useState('Normal Invoice');
  const [currency, setCurrency] = useState('Zambian Kwacha (ZMW)');

  // ── ITEM TABLE ─────────────────────────────────────────────
  // Each item row in the table
  const [items, setItems] = useState([]);

  // The current empty row at the bottom (being filled in)
  const [currentItem, setCurrentItem] = useState({
    product: '',
    lotBatch: '',
    vat: '0%',
    unitPriceExcl: 0,
    unitPriceInc: 0,
    qty: 1,
    disc: 0,
    costPrice: 0,
    total: 0,
  });

  const [barcode, setBarcode] = useState('');

  // Add the current row to the items list
  function handleAddItem() {
    if (!currentItem.product) return;
    setItems([...items, currentItem]);
    setCurrentItem({
      product: '', lotBatch: '', vat: '0%',
      unitPriceExcl: 0, unitPriceInc: 0,
      qty: 1, disc: 0, costPrice: 0, total: 0,
    });
  }

  // ── PAYMENT / WAREHOUSE FIELDS ─────────────────────────────
  const [warehouse, setWarehouse] = useState('MAIN_BRANCH');
  const [bankAccount, setBankAccount] = useState('');
  const [date, setDate] = useState(todayDate());
  const [paymentType, setPaymentType] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due Upon Receipt');
  const [incoterms, setIncoterms] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // ── SUMMARY CALCULATIONS ───────────────────────────────────
  const subTotal = items.reduce((sum, item) => sum + Number(item.total), 0);
  const [shippingChargeType, setShippingChargeType] = useState('A-16%');
  const [shippingCharge, setShippingCharge] = useState('');
  const vatAmount = 0;                          // extend later with real VAT logic
  const totalExcl = subTotal;
  const totalIncl = subTotal + vatAmount;
  const paidAmount = 0;
  const totalZMW = totalIncl + Number(shippingCharge || 0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const balanceAmount = totalZMW - receivedAmount;

  // ── SHIPMENT DETAILS ───────────────────────────────────────
  const [gdnNo, setGdnNo] = useState('');
  const [grnNo, setGrnNo] = useState('');
  const [month, setMonth] = useState('');
  const [shippingVia, setShippingVia] = useState('');
  const [shippingDate, setShippingDate] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [transporter, setTransporter] = useState('');
  const [truckDetails, setTruckDetails] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="invoice-page">

      {/* ── 1. HEADER ── */}
      <div className="invoice-header">
        <h1 className="invoice-title">
          <FaShoppingCart className="cart-icon" />
          New Sales Invoice
        </h1>
        <button className="new-sale-btn">
          <FaCircle className="dot-icon" /> New Sale
        </button>
      </div>

      <div className="invoice-body">

        {/* ── 2. CUSTOMER DROPDOWN ── */}
        {/* Full-width row. The * means this field is required */}
        <div className="form-section">
          <div className="field full-width">
            <label className="label-required">Customer<span>*</span></label>
            <select value={customer} onChange={e => setCustomer(e.target.value)}>
              <option value="">Select a thirdparty</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── 3. REF CUSTOMER | INVOICE DATE | PROJECT ── */}
        {/* Three columns in one row */}
        <div className="form-section form-row-3">
          <div className="field">
            <label>Ref. customer</label>
            <input
              type="text"
              value={refCustomer}
              onChange={e => setRefCustomer(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label-required">Invoice date<span>*</span></label>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
            />
            <span className="now-link" onClick={() => setInvoiceDate(todayDate())}>Now</span>
          </div>

          <div className="field">
            <label>Project</label>
            <select value={project} onChange={e => setProject(e.target.value)}>
              <option value="">Select a project</option>
            </select>
          </div>
        </div>

        {/* ── 4. TYPE | CURRENCY ── */}
        <div className="form-section form-row-2">
          <div className="field">
            <label className="label-required">Type<span>*</span></label>
            <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
              <option>Normal Invoice</option>
              <option>Credit Note</option>
              <option>Debit Note</option>
            </select>
          </div>

          <div className="field">
            <label>Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}>
              <option>Zambian Kwacha (ZMW)</option>
              <option>US Dollar (USD)</option>
            </select>
          </div>
        </div>

        {/* ── 5. ITEM TABLE ── */}
        <div className="item-table-section">
          <div className="item-table-header">
            <h3>Item Table</h3>
            <input
              className="barcode-input"
              type="text"
              placeholder="Scan or type barcode..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
            />
          </div>

          {/* Table: shows all added items + one empty input row */}
          <table className="item-table">
            <thead>
              <tr>
                <th>Product / Service ⇅</th>
                <th>Lot/Batch</th>
                <th>VAT</th>
                <th>Unit Price<br />(Excl.)</th>
                <th>Unit Price<br />(Inc. Tax)</th>
                <th>Qty</th>
                <th>Disc.</th>
                <th>Cost Price</th>
                <th>Total<br />(Incl.)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Already-added items */}
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product}</td>
                  <td>{item.lotBatch}</td>
                  <td>{item.vat}</td>
                  <td>{Number(item.unitPriceExcl).toFixed(2)}</td>
                  <td>{Number(item.unitPriceInc).toFixed(2)}</td>
                  <td>{item.qty}</td>
                  <td>{item.disc}%</td>
                  <td>{Number(item.costPrice).toFixed(2)}</td>
                  <td>{Number(item.total).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn-remove"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                    >✕</button>
                  </td>
                </tr>
              ))}

              {/* New empty input row */}
              <tr className="input-row">
                <td>
                  <select
                    value={currentItem.product}
                    onChange={e => setCurrentItem({ ...currentItem, product: e.target.value })}
                  >
                    <option value="">Select Predefined Product/Services</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={currentItem.lotBatch}
                    onChange={e => setCurrentItem({ ...currentItem, lotBatch: e.target.value })}
                  />
                </td>
                <td><span className="vat-label">0%</span></td>
                <td>
                  <input
                    type="number"
                    value={currentItem.unitPriceExcl}
                    onChange={e => setCurrentItem({ ...currentItem, unitPriceExcl: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={currentItem.unitPriceInc}
                    onChange={e => setCurrentItem({ ...currentItem, unitPriceInc: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={currentItem.qty}
                    onChange={e => setCurrentItem({ ...currentItem, qty: e.target.value })}
                  />
                </td>
                <td>
                  <div className="disc-row">
                    <input
                      type="number"
                      value={currentItem.disc}
                      onChange={e => setCurrentItem({ ...currentItem, disc: e.target.value })}
                    />
                    <select><option>%</option></select>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    value={currentItem.costPrice}
                    onChange={e => setCurrentItem({ ...currentItem, costPrice: e.target.value })}
                  />
                </td>
                <td>{Number(currentItem.total).toFixed(2)}</td>
                <td>
                  <button className="btn-add" onClick={handleAddItem}>
                    ● Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── 6. PAYMENT FIELDS + SUMMARY SIDE BY SIDE ── */}
        {/* Left side = payment form fields, Right side = totals summary */}
        <div className="bottom-section">

          {/* LEFT: payment fields */}
          <div className="payment-fields">

            {/* Row: Warehouse | Bank Account | Date */}
            <div className="form-row-3">
              <div className="field">
                <label className="label-required">Warehouse<span>*</span></label>
                <select value={warehouse} onChange={e => setWarehouse(e.target.value)}>
                  <option>MAIN_BRANCH</option>
                </select>
              </div>
              <div className="field">
                <label className="label-required">Bank account<span>*</span></label>
                <select value={bankAccount} onChange={e => setBankAccount(e.target.value)}>
                  <option value="">Select a bank account</option>
                </select>
              </div>
              <div className="field">
                <label className="label-required">Date<span>*</span></label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
                <span className="now-link" onClick={() => setDate(todayDate())}>Now</span>
              </div>
            </div>

            {/* Row: Payment Type | Payment Terms | Incoterms */}
            <div className="form-row-3">
              <div className="field">
                <label className="label-required">Payment Type<span>*</span></label>
                <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                  <option value="">Select a payment type</option>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div className="field">
                <label className="label-required">Payment Terms<span>*</span></label>
                <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                  <option>Due Upon Receipt</option>
                  <option>Net 30</option>
                  <option>Net 60</option>
                </select>
              </div>
              <div className="field">
                <label>Incoterms</label>
                <div className="incoterms-row">
                  <select value={incoterms} onChange={e => setIncoterms(e.target.value)}>
                    <option value="">Select a incoterms</option>
                  </select>
                  <input type="text" />
                </div>
              </div>
            </div>

            {/* Payment Note */}
            <div className="field">
              <label>Payment Note</label>
              <textarea
                placeholder="Note"
                value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
              />
            </div>

            {/* + Add Shipment Details: right-aligned at bottom of payment fields */}
            <div className="add-shipment-label">+ Add Shipment Details</div>
          </div>

          {/* RIGHT: totals summary box */}
          <div className="summary-box">
            <div className="summary-row">
              <span>Sub Total</span>
              <span>{subTotal.toFixed(4)} ZMW</span>
            </div>
            <div className="summary-row">
              <span>Shipping Charges</span>
              <div className="shipping-row">
                <select
                  value={shippingChargeType}
                  onChange={e => setShippingChargeType(e.target.value)}
                >
                  <option>A-16%</option>
                  <option>None</option>
                </select>
                <input
                  type="number"
                  value={shippingCharge}
                  onChange={e => setShippingCharge(e.target.value)}
                />
              </div>
            </div>
            <div className="summary-row">
              <span>VAT :</span>
              <span>{vatAmount.toFixed(4)} ZMW</span>
            </div>
            <div className="summary-row">
              <span>Total (excl. tax) :</span>
              <span>{totalExcl.toFixed(4)} ZMW</span>
            </div>
            <div className="summary-row">
              <span>Total (inc. tax) :</span>
              <span>{totalIncl.toFixed(4)} ZMW</span>
            </div>
            <div className="summary-row">
              <span>Paid Amount :</span>
              <span>{paidAmount.toFixed(4)} ZMW</span>
            </div>
            <div className="summary-row advance-row">
              <label>
                <input type="checkbox" /> UseAdvancePayment : 0.00
              </label>
            </div>
            <div className="summary-total">
              <span>Total (ZMW) :</span>
              <span className="total-value">{totalZMW.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* ── 7. SHIPMENT DETAILS — full width below the payment+summary section ── */}
        <div className="shipment-section">
          <div className="shipment-fields">
            <div className="form-row-3">
              <div className="field">
                <label>GDN Nº</label>
                <input placeholder="GDN Number" value={gdnNo} onChange={e => setGdnNo(e.target.value)} />
              </div>
              <div className="field">
                <label>GRN Nº</label>
                <input placeholder="GRN Number" value={grnNo} onChange={e => setGrnNo(e.target.value)} />
              </div>
              <div className="field">
                <label>Month</label>
                <input placeholder="e.g. January 2025" value={month} onChange={e => setMonth(e.target.value)} />
              </div>
            </div>
            <div className="form-row-3">
              <div className="field">
                <label>Shipping Via</label>
                <input placeholder="Via" value={shippingVia} onChange={e => setShippingVia(e.target.value)} />
              </div>
              <div className="field">
                <label>Shipping Date</label>
                <input placeholder="Date" value={shippingDate} onChange={e => setShippingDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Tracking ID</label>
                <input placeholder="Tracking ID" value={trackingId} onChange={e => setTrackingId(e.target.value)} />
              </div>
            </div>
            <div className="form-row-3">
              <div className="field">
                <label>Transporter</label>
                <input placeholder="Transporter name" value={transporter} onChange={e => setTransporter(e.target.value)} />
              </div>
              <div className="field">
                <label>Truck Details</label>
                <input placeholder="Truck/Vehicle details" value={truckDetails} onChange={e => setTruckDetails(e.target.value)} />
              </div>
              <div className="field">
                <label>Shipping Address</label>
                <textarea placeholder="Address" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 8. RECEIVED AMOUNT / BALANCE AMOUNT ── */}
        <div className="received-section">
          <div className="received-row">
            <span>Received Amount (ZMW)</span>
            <input
              type="number"
              value={receivedAmount}
              onChange={e => setReceivedAmount(e.target.value)}
            />
          </div>
          <div className="balance-row">
            <span className="balance-label">Balance Amount (ZMW)</span>
            <span className="balance-value">{Number(balanceAmount).toFixed(4)}</span>
          </div>
        </div>

        {/* ── 9. ACTION BUTTONS ── */}
        <div className="action-buttons">
          <div className="btn-group-left">
            <button className="btn-draft">Save as Draft</button>
            <button className="btn-online">Online Payment</button>
            <button className="btn-mail">Mail Invoice</button>
            <button className="btn-save-print">Save and Print</button>
            <button className="btn-cancel">Cancel</button>
          </div>
          <div className="footer-totals">
            <span>Total Amount: {totalZMW.toFixed(4)}</span>
            <span>Total Quantity: {items.reduce((s, i) => s + Number(i.qty), 0)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Invoice;
