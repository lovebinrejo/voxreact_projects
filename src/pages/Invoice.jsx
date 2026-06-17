import React, { useState, useEffect, useRef } from 'react';
import './Invoice.css';
import { FaShoppingCart, FaCircle, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { getCustomers } from '../data/customerApi';
import productsData from '../data/product.json';

function todayDate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Calculate total for one item row: price_incl × qty × (1 - discount%)
function calcItemTotal(unitPriceInc, qty, disc) {
  return Number(unitPriceInc || 0) * Number(qty || 0) * (1 - Number(disc || 0) / 100);
}

// Custom searchable dropdown for "Select Tax Category" fields — matches the
// customer/product picker styling instead of the native browser <select>.
function TaxCategoryDropdown({ label, required, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="field">
      <label className={required ? 'label-required' : ''}>{label}{required && <span>*</span>}</label>
      <div className="customer-dropdown-wrapper" ref={ref}>
        <div
          className={`customer-select-box${open ? ' open' : ''}`}
          onClick={() => { setOpen(v => !v); setSearch(''); }}
        >
          <span className={value ? '' : 'placeholder'}>{value || 'Select Tax Category'}</span>
          <span className="cust-arrow">{open ? '▲' : '▼'}</span>
        </div>
        {open && (
          <div className="customer-dropdown-panel">
            <input
              className="customer-search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="customer-list">
              {filtered.map(o => (
                <div
                  key={o}
                  className={`customer-option${value === o ? ' selected' : ''}`}
                  onClick={() => { onChange(o); setOpen(false); setSearch(''); }}
                >
                  <div className="cust-opt-name">{o}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const TAX_CATEGORY_OPTIONS = ['ECM-5%', 'EXEEG-3%'];

function Invoice() {

  // ── CUSTOMERS ──────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    getCustomers()
      .then(res => setCustomers(res.data || []))
      .catch(err => console.error(err));
  }, []);

  // ── PRODUCTS — loaded directly from product.json ──────────
  const [products, setProducts] = useState(productsData.data || []);

  // ── ADD PRODUCT MODAL ──────────────────────────────────────
  const [showAddProduct, setShowAddProduct] = useState(false);
  const emptyNewProduct = {
    ref: '', label: '', statusSell: 'For sale', statusPurchase: 'For purchase',
    classification: '', natureFinished: true, natureRaw: false, natureService: false,
    countryOrigin: 'Zambia (ZM)', defaultWarehouse: '',
    stockLimit: '', desiredStock: '', unit: '', packagingUnit: '',
    sellingPrice: '', sellingPriceTaxType: 'Inc. tax', minSellingPrice: '',
    vatCategoryCode: 'A-16%', iplCategoryCode: '', tourismLevyCode: '', exciseTaxCategoryCode: '',
    manufactureTPIN: '', manufacturerItemCode: '', rrp: '', barcodeType: 'Code 128',
    barcodeValue: '', tags: '',
  };
  const [newProduct, setNewProduct] = useState(emptyNewProduct);

  function updateNewProduct(field, value) {
    setNewProduct(prev => ({ ...prev, [field]: value }));
  }

  function handleCreateItem() {
    if (!newProduct.ref || !newProduct.label) return;
    const isIncTax = newProduct.sellingPriceTaxType === 'Inc. tax';
    const product = {
      id: String(Date.now()),
      ref: newProduct.ref,
      label: newProduct.label,
      price: isIncTax ? '' : newProduct.sellingPrice,
      price_ttc: isIncTax ? newProduct.sellingPrice : '',
      price_base_type: isIncTax ? 'TTC' : 'HT',
      tva_tx: newProduct.vatCategoryCode,
      stock: '0',
      classification: newProduct.classification,
    };
    setProducts(prev => [...prev, product]);
    setNewProduct(emptyNewProduct);
    setShowAddProduct(false);
  }

  // ── TOP FORM FIELDS ────────────────────────────────────────
  const [customer, setCustomer] = useState('');
  const [refCustomer, setRefCustomer] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayDate());
  const [project, setProject] = useState('');
  const [invoiceType, setInvoiceType] = useState('Normal Invoice');
  const [currency, setCurrency] = useState('Zambian Kwacha (ZMW)');

  // ── CUSTOMER CUSTOM DROPDOWN ───────────────────────────────
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const customerDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
        setCustomerSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCustomer = customers.find(c => String(c.id) === String(customer)) || null;
  const selectedCustomerName = selectedCustomer
    ? `${selectedCustomer.name}${selectedCustomer.code_client ? ' ' + selectedCustomer.code_client : ''} | Tpin : ${selectedCustomer.tpin || '-'} | Country : ${selectedCustomer.country || 'Zambia'}`
    : '';
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.tpin && c.tpin.includes(customerSearch))
  );

  // ── PRODUCT CUSTOM DROPDOWN ────────────────────────────────
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const productDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutsideProduct(e) {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target)) {
        setShowProductDropdown(false);
        setProductSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutsideProduct);
    return () => document.removeEventListener('mousedown', handleClickOutsideProduct);
  }, []);

  const filteredProducts = products.filter(p =>
    p.label.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.ref.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ── ITEM TABLE ─────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  const emptyItem = {
    product: '', productLabel: '', ref: '', lotBatch: '', vat: '0%',
    unitPriceExcl: '', unitPriceInc: '', qty: 1, disc: 0, costPrice: '', total: 0,
  };
  const [currentItem, setCurrentItem] = useState(emptyItem);
  const [barcode, setBarcode] = useState('');

  // When product is selected — use functional setState to avoid stale closure
  function handleProductSelect(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    setCurrentItem(prev => {
      if (!product) return { ...prev, product: productId, productLabel: '' };
      const priceExcl = Number(product.price).toFixed(2);
      const priceInc  = Number(product.price_ttc).toFixed(2);
      const vatLabel  = product.tva_tx || '0%';
      const total     = calcItemTotal(priceInc, prev.qty, prev.disc);
      return {
        ...prev,
        product: String(productId),
        productLabel: product.label,
        ref: product.ref,
        unitPriceExcl: priceExcl,
        unitPriceInc: priceInc,
        vat: vatLabel,
        costPrice: priceExcl,
        total,
      };
    });
  }

  // Recalculate total whenever qty, price or discount changes
  function updateCurrentItem(field, value) {
    setCurrentItem(prev => {
      const updated = { ...prev, [field]: value };
      updated.total = calcItemTotal(updated.unitPriceInc, updated.qty, updated.disc);
      return updated;
    });
  }

  function handleAddItem() {
    if (!currentItem.product) return;
    const finalItem = {
      ...currentItem,
      total: calcItemTotal(currentItem.unitPriceInc, currentItem.qty, currentItem.disc),
    };
    setItems(prev => [...prev, finalItem]);
    setCurrentItem({ ...emptyItem }); // fresh object so React always detects the change
  }

  // ── PAYMENT FIELDS ─────────────────────────────────────────
  const [warehouse, setWarehouse] = useState('MAIN_BRANCH');
  const [bankAccount, setBankAccount] = useState('');
  const [date, setDate] = useState(todayDate());
  const [paymentType, setPaymentType] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due Upon Receipt');
  const [incoterms, setIncoterms] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // ── SUMMARY CALCULATIONS ───────────────────────────────────
  // subTotal = sum of all item totals (incl. VAT)
  const subTotal = items.reduce((sum, item) => sum + Number(item.total), 0);

  // VAT = sum of (price_incl - price_excl) × qty × (1 - disc%)
  const vatAmount = items.reduce((sum, item) => {
    const vatPerUnit = Number(item.unitPriceInc || 0) - Number(item.unitPriceExcl || 0);
    return sum + vatPerUnit * Number(item.qty || 0) * (1 - Number(item.disc || 0) / 100);
  }, 0);

  const totalExcl = subTotal - vatAmount;
  const totalIncl = subTotal;
  const paidAmount = 0;

  const [shippingChargeType, setShippingChargeType] = useState('A-16%');
  const [shippingCharge, setShippingCharge] = useState('');
  const totalZMW = totalIncl + Number(shippingCharge || 0);

  const [receivedAmount, setReceivedAmount] = useState('');
  const balanceAmount = totalZMW - Number(receivedAmount || 0);

  // ── SHIPMENT DETAILS ───────────────────────────────────────
  const [showShipment, setShowShipment] = useState(true);
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

      {/* 1. HEADER */}
      <div className="invoice-header">
        <h1 className="invoice-title">
          <FaShoppingCart className="cart-icon" />
          New Sales Invoice
        </h1>
        <button type="button" className="new-sale-btn">
          <FaCircle className="dot-icon" /> New Sale
        </button>
      </div>

      <div className="invoice-body">

        <div className="top-form-section">
          {/* 2. CUSTOMER */}
          <div className="form-section">
            <div className="field full-width">
              <label className="label-required">Customer<span>*</span></label>
              <div className="customer-dropdown-wrapper" ref={customerDropdownRef}>
                <div
                  className={`customer-select-box${showCustomerDropdown ? ' open' : ''}`}
                  onClick={() => {
                    setShowCustomerDropdown(v => !v);
                    setCustomerSearch('');
                  }}
                >
                  <span className={selectedCustomerName ? '' : 'placeholder'}>
                    {selectedCustomerName || 'Select a thirdparty'}
                  </span>
                  <span className="cust-arrow">{showCustomerDropdown ? '▲' : '▼'}</span>
                </div>
                {showCustomerDropdown && (
                  <div className="customer-dropdown-panel">
                    <input
                      className="customer-search-input"
                      type="text"
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="customer-list">
                      {filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          className={`customer-option${String(customer) === String(c.id) ? ' selected' : ''}`}
                          onClick={() => {
                            setCustomer(c.id);
                            setShowCustomerDropdown(false);
                            setCustomerSearch('');
                          }}
                        >
                          <div className="cust-opt-name">{c.name}</div>
                          {c.company && <div className="cust-opt-sub">{c.company}</div>}
                          <div className="cust-opt-meta">
                            TPIN : {c.tpin || '-'} | Country : {c.country || 'Zambia'}
                            {c.tracking_id ? ` | Tracking Id : ${c.tracking_id}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="customer-add-new">
                      <FaCircle className="add-new-dot" /> Add New Customer
                    </div>
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <div className="customer-info-box">
                  <div className="customer-info-name">
                    {selectedCustomer.code_client ? `${selectedCustomer.code_client} - ${selectedCustomer.name}` : selectedCustomer.name}
                  </div>
                  <div className="customer-info-line">Tpin: {selectedCustomer.tpin || '-'}</div>
                  <div className="customer-info-line">
                    (Current outstanding bill: {Number(selectedCustomer.outstanding_amount || 0).toFixed(2)} ZMW)
                  </div>
                  <div className="customer-info-line">
                    (Current Advance Amount is {Number(selectedCustomer.advance_amount || 0).toFixed(2)} ZMW)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. REF CUSTOMER | INVOICE DATE | PROJECT */}
          <div className="form-row-3 form-section">
            <div className="field">
              <label>Ref. customer</label>
              <input type="text" value={refCustomer} onChange={e => setRefCustomer(e.target.value)} />
            </div>
            <div className="field">
              <label className="label-required">Invoice date<span>*</span></label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              <span className="now-link" onClick={() => setInvoiceDate(todayDate())}>Now</span>
            </div>
            <div className="field">
              <label>Project</label>
              <select value={project} onChange={e => setProject(e.target.value)}>
                <option value="">Select a project</option>
              </select>
            </div>
          </div>

          {/* 4. TYPE | CURRENCY */}
          <div className="form-row-3 form-section">
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
            <div></div>
          </div>
        </div>

        {/* 5. ITEM TABLE */}
        <div className="item-table-section">
          <div className="item-table-header">
            <h3 className="section-heading">Item Table</h3>
            <input
              className="barcode-input"
              type="text"
              placeholder="Scan or type barcode..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
            />
          </div>

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
              {/* Added items */}
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.productLabel || item.product}</td>
                  <td>{item.lotBatch}</td>
                  <td>{item.vat}</td>
                  <td>{Number(item.unitPriceExcl).toFixed(2)}</td>
                  <td>{Number(item.unitPriceInc).toFixed(2)}</td>
                  <td>{item.qty}</td>
                  <td>{item.disc}%</td>
                  <td>{Number(item.costPrice).toFixed(2)}</td>
                  <td>{Number(item.total).toFixed(2)}</td>
                  <td>
                    <button className="btn-remove" onClick={() => { setItemToRemove(index); setShowRemoveConfirm(true); }}>✕</button>
                  </td>
                </tr>
              ))}

              {/* Input row — live total updates as user types */}
              <tr className="input-row">
                <td style={{ position: 'relative', minWidth: '220px' }}>
                  <div className="prod-dropdown-wrapper" ref={productDropdownRef}>
                    <div
                      className={`prod-select-box${showProductDropdown ? ' open' : ''}`}
                      onClick={() => {
                        setShowProductDropdown(v => !v);
                        setProductSearch('');
                      }}
                    >
                      <span className={currentItem.productLabel ? '' : 'placeholder'}>
                        {currentItem.productLabel
                          ? `${currentItem.ref || ''} - ${currentItem.productLabel}`
                          : 'Select Predefined Product/Services'}
                      </span>
                      <span className="cust-arrow">{showProductDropdown ? '▲' : '▼'}</span>
                    </div>
                    {showProductDropdown && (
                      <div className="prod-dropdown-panel">
                        <input
                          className="customer-search-input"
                          type="text"
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          autoFocus
                        />
                        <div className="customer-list">
                          {filteredProducts.map(p => {
                            const isExcl = p.price_base_type === 'HT';
                            const displayPrice = isExcl
                              ? `${Number(p.price).toFixed(2)} Excl. tax`
                              : `${Number(p.price_ttc).toFixed(2)} Inc. tax`;
                            const stock = Number(p.stock || 0).toLocaleString('en', { minimumFractionDigits: 2 });
                            const classification = p.classification || '10101501';
                            const isSelected = String(currentItem.product) === String(p.id);
                            return (
                              <div
                                key={p.id}
                                className={`customer-option${isSelected ? ' selected' : ''}`}
                                onClick={() => {
                                  handleProductSelect(p.id);
                                  setShowProductDropdown(false);
                                  setProductSearch('');
                                }}
                              >
                                <div className="cust-opt-name">☆ {p.label}</div>
                                <div className="cust-opt-sub">Ref :{p.ref} | Classification : {classification}</div>
                                <div className="cust-opt-meta">Price: {displayPrice} | Stock: {stock}</div>
                              </div>
                            );
                          })}
                        </div>
                        <div
                          className="customer-add-new"
                          onClick={() => {
                            setShowProductDropdown(false);
                            setProductSearch('');
                            setShowAddProduct(true);
                          }}
                        >
                          <FaCircle className="add-new-dot" /> Add New
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    value={currentItem.lotBatch}
                    onChange={e => updateCurrentItem('lotBatch', e.target.value)}
                  />
                </td>
                <td><span className="vat-label">{currentItem.vat}</span></td>
                <td>
                  <input
                    type="number"
                    value={currentItem.unitPriceExcl}
                    onChange={e => updateCurrentItem('unitPriceExcl', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={currentItem.unitPriceInc}
                    onChange={e => updateCurrentItem('unitPriceInc', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={currentItem.qty}
                    onChange={e => updateCurrentItem('qty', e.target.value)}
                  />
                </td>
                <td>
                  <div className="disc-row">
                    <input
                      type="number"
                      value={currentItem.disc}
                      onChange={e => updateCurrentItem('disc', e.target.value)}
                    />
                    <select>
                      <option>%</option>
                      <option>P</option>
                    </select>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    value={currentItem.costPrice}
                    onChange={e => updateCurrentItem('costPrice', e.target.value)}
                  />
                </td>
                {/* Total auto-calculated from qty × unit price inc × (1 - disc%) */}
                <td>{calcItemTotal(currentItem.unitPriceInc, currentItem.qty, currentItem.disc).toFixed(2)}</td>
                <td>
                  <button className="btn-add" onClick={handleAddItem}>● Add</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. PAYMENT FIELDS + SUMMARY */}
        <div className="bottom-section">

          <div className="payment-fields">
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
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <span className="now-link" onClick={() => setDate(todayDate())}>Now</span>
              </div>
            </div>

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

            <div className="field">
              <label>Payment Note</label>
              <textarea placeholder="Note" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
            </div>

            <div className="add-shipment-label" onClick={() => setShowShipment(!showShipment)}>
              + Add Shipment Details
            </div>
            <div className="shipment-fields" style={{ display: showShipment ? 'block' : 'none' }}>
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

          {/* RIGHT: summary box */}
          <div className="summary-box">
            <div className="summary-row">
              <span>Sub Total</span>
              <span>{subTotal.toFixed(4)} ZMW</span>
            </div>
            <div className="summary-row">
              <span>Shipping Charges</span>
              <div className="shipping-row">
                <select value={shippingChargeType} onChange={e => setShippingChargeType(e.target.value)}>
                  <option>A-16%</option>
                  <option>None</option>
                </select>
                <input type="number" value={shippingCharge} onChange={e => setShippingCharge(e.target.value)} />
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

        {/* 8. RECEIVED / BALANCE */}
        <div className="received-section">
          <div className="received-row">
            <span>Received Amount (ZMW)</span>
            <input
              type="number"
              value={receivedAmount}
              placeholder="0.0000"
              onChange={e => setReceivedAmount(e.target.value)}
            />
          </div>
          <div className="balance-row">
            <span className="balance-label">Balance Amount (ZMW)</span>
            <span className="balance-value">{balanceAmount.toFixed(4)}</span>
          </div>
        </div>

        {/* 9. ACTION BUTTONS */}
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

      {/* REMOVE CONFIRMATION MODAL */}
      {showRemoveConfirm && (
        <div className="modal-overlay" onClick={() => setShowRemoveConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-icon"><FaTrash /></div>
            <h3 className="modal-title">Remove Line</h3>
            <p className="modal-msg">Are you sure you want to remove this line?</p>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowRemoveConfirm(false)}>Cancel</button>
              <button className="modal-btn-remove" onClick={() => {
                setItems(prev => prev.filter((_, i) => i !== itemToRemove));
                setShowRemoveConfirm(false);
                setItemToRemove(null);
              }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProduct && (
        <div className="modal-overlay addproduct-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="addproduct-box" onClick={e => e.stopPropagation()}>
            <div className="addproduct-header">
              <h3>Add Products</h3>
              <button type="button" className="addproduct-close" onClick={() => setShowAddProduct(false)}>✕</button>
            </div>

            <div className="addproduct-body">
              <div className="form-row-2">
                <div className="field">
                  <label className="label-required">Ref.<span>*</span></label>
                  <input value={newProduct.ref} onChange={e => updateNewProduct('ref', e.target.value)} />
                </div>
                <div className="field">
                  <label className="label-required">Label<span>*</span></label>
                  <input value={newProduct.label} onChange={e => updateNewProduct('label', e.target.value)} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label className="label-required">Status (Sell)<span>*</span></label>
                  <select value={newProduct.statusSell} onChange={e => updateNewProduct('statusSell', e.target.value)}>
                    <option>For sale</option>
                    <option>Not for sale</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label-required">Status (Purchase)<span>*</span></label>
                  <select value={newProduct.statusPurchase} onChange={e => updateNewProduct('statusPurchase', e.target.value)}>
                    <option>For purchase</option>
                    <option>Not for purchase</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label className="label-required">Product Classification<span>*</span></label>
                  <input
                    placeholder="Search Classification Code.."
                    value={newProduct.classification}
                    onChange={e => updateNewProduct('classification', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label-required">Nature of product <span>*</span></label>
                  <div className="nature-checkboxes">
                    <label>
                      <input
                        type="checkbox"
                        checked={newProduct.natureFinished}
                        onChange={e => updateNewProduct('natureFinished', e.target.checked)}
                      /> Finished Product
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={newProduct.natureRaw}
                        onChange={e => updateNewProduct('natureRaw', e.target.checked)}
                      /> Raw Material
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={newProduct.natureService}
                        onChange={e => updateNewProduct('natureService', e.target.checked)}
                      /> Service
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label className="label-required">Country of origin<span>*</span></label>
                  <select value={newProduct.countryOrigin} onChange={e => updateNewProduct('countryOrigin', e.target.value)}>
                    <option>Zambia (ZM)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Default warehouse</label>
                  <select value={newProduct.defaultWarehouse} onChange={e => updateNewProduct('defaultWarehouse', e.target.value)}>
                    <option value="">Select a warehouse</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label>Stock limit for alert</label>
                  <input type="number" value={newProduct.stockLimit} onChange={e => updateNewProduct('stockLimit', e.target.value)} />
                </div>
                <div className="field">
                  <label>Desired Stock</label>
                  <input type="number" value={newProduct.desiredStock} onChange={e => updateNewProduct('desiredStock', e.target.value)} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label className="label-required">Unit<span>*</span></label>
                  <select value={newProduct.unit} onChange={e => updateNewProduct('unit', e.target.value)}>
                    <option value="">Unit of Quantity</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label-required">Packaging Unit<span>*</span></label>
                  <select value={newProduct.packagingUnit} onChange={e => updateNewProduct('packagingUnit', e.target.value)}>
                    <option value="">Packaging Unit</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label className="label-required">Selling price<span>*</span></label>
                  <div className="disc-row">
                    <input type="number" value={newProduct.sellingPrice} onChange={e => updateNewProduct('sellingPrice', e.target.value)} />
                    <select value={newProduct.sellingPriceTaxType} onChange={e => updateNewProduct('sellingPriceTaxType', e.target.value)}>
                      <option>Inc. tax</option>
                      <option>Excl. tax</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Min. selling price</label>
                  <input type="number" value={newProduct.minSellingPrice} onChange={e => updateNewProduct('minSellingPrice', e.target.value)} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label className="label-required">VAT category Code<span>*</span></label>
                  <select value={newProduct.vatCategoryCode} onChange={e => updateNewProduct('vatCategoryCode', e.target.value)}>
                    <option>A-16%</option>
                    <option>B-0%</option>
                    <option>C-Exempt</option>
                  </select>
                </div>
                <TaxCategoryDropdown
                  label="IPL category code"
                  value={newProduct.iplCategoryCode}
                  onChange={v => updateNewProduct('iplCategoryCode', v)}
                  options={TAX_CATEGORY_OPTIONS}
                />
              </div>

              <div className="form-row-2">
                <TaxCategoryDropdown
                  label="Tourism levy Code"
                  value={newProduct.tourismLevyCode}
                  onChange={v => updateNewProduct('tourismLevyCode', v)}
                  options={TAX_CATEGORY_OPTIONS}
                />
                <TaxCategoryDropdown
                  label="Excise tax category code"
                  value={newProduct.exciseTaxCategoryCode}
                  onChange={v => updateNewProduct('exciseTaxCategoryCode', v)}
                  options={TAX_CATEGORY_OPTIONS}
                />
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label>Manufacture TPIN</label>
                  <input value={newProduct.manufactureTPIN} onChange={e => updateNewProduct('manufactureTPIN', e.target.value)} />
                </div>
                <div className="field">
                  <label>Manufacturer item code</label>
                  <input value={newProduct.manufacturerItemCode} onChange={e => updateNewProduct('manufacturerItemCode', e.target.value)} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label>RRP</label>
                  <input value={newProduct.rrp} onChange={e => updateNewProduct('rrp', e.target.value)} />
                </div>
                <div className="field">
                  <label>Barcode type</label>
                  <select value={newProduct.barcodeType} onChange={e => updateNewProduct('barcodeType', e.target.value)}>
                    <option>Code 128</option>
                    <option>EAN-13</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label>Barcode value</label>
                  <input value={newProduct.barcodeValue} onChange={e => updateNewProduct('barcodeValue', e.target.value)} />
                </div>
                <div className="field">
                  <label>Tags/categories</label>
                  <input value={newProduct.tags} onChange={e => updateNewProduct('tags', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="addproduct-footer">
              <button type="button" className="btn-create-item" onClick={handleCreateItem}>
                <FaCheckCircle /> Create Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoice;
