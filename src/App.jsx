import React, { useState } from "react";

const SaaSERPPlatform = () => {

  // ================= UI STATE =================
  const [activeView, setActiveView] = useState("login");
  const [activeModule, setActiveModule] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({});

  // ================= LOGIN =================
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ================= ERP DATA =================
  const [items, setItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [leads, setLeads] = useState([]);

  // ================= LOGIN HANDLER =================
  const handleLogin = () => {
    if (loginEmail === "superadmin@yourcompany.com" && loginPassword === "admin123") {
      setActiveView("superadmin");
      return;
    }

    if (loginEmail === "admin@acme.com" && loginPassword === "demo123") {
      setActiveView("erp");
      return;
    }

    alert("Invalid credentials");
  };

  // ================= MODAL CONTROL =================
  const openModal = (type) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = () => {
    if (modalType === "item") {
      setItems([...items, { ...formData, id: Date.now() }]);
    }

    if (modalType === "invoice") {
      setInvoices([...invoices, { ...formData, id: Date.now() }]);
    }

    if (modalType === "lead") {
      setLeads([...leads, { ...formData, id: Date.now() }]);
    }

    closeModal();
  };

  // ================= LOGIN SCREEN =================
  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl font-bold mb-4">ERP Login</h2>

        <input
          className="border p-2 w-full mb-2"
          placeholder="Email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-4"
          type="password"
          placeholder="Password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white w-full p-2 rounded"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );

  // ================= SUPER ADMIN =================
  const renderSuperAdmin = () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
      <p className="text-gray-600">Tenant management placeholder</p>
    </div>
  );

  // ================= ERP DASHBOARD =================
  const renderERP = () => (
    <div className="flex">
      <div className="w-60 bg-gray-900 text-white min-h-screen p-4">
        <div onClick={() => setActiveModule("dashboard")}>Dashboard</div>
        <div onClick={() => setActiveModule("items")}>Inventory</div>
        <div onClick={() => setActiveModule("invoices")}>Invoices</div>
        <div onClick={() => setActiveModule("crm")}>CRM</div>
      </div>

      <div className="flex-1 p-6">
        {activeModule === "dashboard" && <h2>Dashboard</h2>}

        {activeModule === "items" && (
          <>
            <button onClick={() => openModal("item")}>Add Item</button>
            {items.map((i) => (
              <div key={i.id}>{i.name} — {i.price}</div>
            ))}
          </>
        )}

        {activeModule === "invoices" && (
          <>
            <button onClick={() => openModal("invoice")}>Create Invoice</button>
            {invoices.map((i) => (
              <div key={i.id}>{i.customer} — ₹{i.amount}</div>
            ))}
          </>
        )}

        {activeModule === "crm" && (
          <>
            <button onClick={() => openModal("lead")}>Add Lead</button>
            {leads.map((l) => (
              <div key={l.id}>{l.name} — {l.company}</div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  // ================= MODAL =================
  const Modal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="bg-white p-6 rounded w-96">
          {modalType === "item" && (
            <>
              <input
                placeholder="Item name"
                className="border p-2 w-full mb-2"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                placeholder="Price"
                className="border p-2 w-full mb-2"
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </>
          )}

          {modalType === "invoice" && (
            <>
              <input
                placeholder="Customer"
                className="border p-2 w-full mb-2"
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
              <input
                placeholder="Amount"
                className="border p-2 w-full mb-2"
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </>
          )}

          {modalType === "lead" && (
            <>
              <input
                placeholder="Lead name"
                className="border p-2 w-full mb-2"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                placeholder="Company"
                className="border p-2 w-full mb-2"
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </>
          )}

          <button className="bg-blue-600 text-white p-2 w-full" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    );
  };

  // ================= MAIN RENDER =================
  return (
    <>
      {activeView === "login" && renderLogin()}
      {activeView === "superadmin" && renderSuperAdmin()}
      {activeView === "erp" && renderERP()}
      <Modal />
    </>
  );
};

export default SaaSERPPlatform;
