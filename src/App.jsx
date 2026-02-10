import React, { useState, useEffect } from "react";
import {
  Plus,
  Package,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  LogOut,
  Building2,
  Shield,
} from "lucide-react";

import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

const SaaSERPPlatform = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [activeView, setActiveView] = useState("login");
  const [activeModule, setActiveModule] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const [tenants, setTenants] = useState([]);

  const [tenantData, setTenantData] = useState({
    customers: [],
    products: [],
    salesOrders: [],
    ledgerEntries: [],
  });

  /*
  =========================
  AUTH LISTENER
  =========================
  */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setActiveView("login");
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      if (user.email === "superadmin@yourcompany.com") {
        setActiveView("superadmin");
        await load
