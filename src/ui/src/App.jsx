import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconChartBar,
  IconCalendar,
  IconCoin,
  IconReceipt,
} from '@tabler/icons-react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Layout } from './components/layout/Layout';
import { TitleBar } from './components/TitleBar';
import { BottomBar } from './components/layout/BottomBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { InvoicesPage } from './pages/InvoicesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { BudgetYearsPage } from './pages/BudgetYearsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TemplateEditorPage } from './pages/TemplateEditorPage';
import { BudgetYearModal } from './components/budget/BudgetYearModal';
import { ProductModal } from './components/products/ProductModal';
import { CustomerModal } from './components/customers/CustomerModal';
import { InvoiceModal } from './components/invoices/InvoiceModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { ExpenseCategoryModal } from './components/expenses/ExpenseCategoryModal';
import { ExpenseCategoryManagementModal } from './components/expenses/ExpenseCategoryManagementModal';
import { InvoiceStatusModal } from './components/invoices/InvoiceStatusModal';
import { InvoiceViewModal } from './components/invoices/InvoiceViewModal';
import { TimelineModal } from './components/events/TimelineModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { navItems, workflowShortcuts, statusBadge, statusLabel } from './data/mockData.jsx';
import { formatCurrency } from './utils/formatCurrency';
import { formatDate } from './utils/formatDate';
import { useDashboardData } from './hooks/useDashboardData';
import { useInvoices } from './hooks/useInvoices';
import { useExpenses } from './hooks/useExpenses';
import { useCustomers } from './hooks/useCustomers';
import { useProducts } from './hooks/useProducts';
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';
import { useSupporterPack } from './hooks/useSupporterPack';
import { useKonamiCode } from './hooks/useKonamiCode';
import i18n from './i18n/config';

function hasCompletedOnboarding() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('fattern:onboardingComplete') === 'true';
}

function App() {
  // Initialize theme early
  useTheme();
  const { getSetting, settings } = useSettings();
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => !hasCompletedOnboarding());
  const [isBudgetYearModalOpen, setIsBudgetYearModalOpen] = useState(false);
  const [editingBudgetYear, setEditingBudgetYear] = useState(null);
  const [budgetYearModalMode, setBudgetYearModalMode] = useState('create');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productModalMode, setProductModalMode] = useState('create');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerModalMode, setCustomerModalMode] = useState('create');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceModalMode, setInvoiceModalMode] = useState('create');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseModalMode, setExpenseModalMode] = useState('create');
  const [expensesRefreshKey, setExpensesRefreshKey] = useState(0);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [isExpenseCategoryModalOpen, setIsExpenseCategoryModalOpen] = useState(false);
  const [editingExpenseCategory, setEditingExpenseCategory] = useState(null);
  const [expenseCategoryModalMode, setExpenseCategoryModalMode] = useState('create');
  const [isInvoiceStatusModalOpen, setIsInvoiceStatusModalOpen] = useState(false);
  const [editingInvoiceStatus, setEditingInvoiceStatus] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [isInvoiceViewModalOpen, setIsInvoiceViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [invoicesRefreshKey, setInvoicesRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState('Oversikt');
  const [templateEditorId, setTemplateEditorId] = useState(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);
  const [customersRefreshKey, setCustomersRefreshKey] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null, type: null, onConfirm: null, onDeactivate: null, showDeactivate: false });
  const { toasts, toast, removeToast } = useToast();
  const { isSupporter, activateSupporterPack, deactivateSupporterPack } = useSupporterPack();

  const handleKonami = useCallback(async () => {
    if (isSupporter) {
      deactivateSupporterPack();
      toast('👋 Supporter-modus deaktivert', 'info');
    } else {
      await activateSupporterPack({
        features: ['premium_themes', 'premium_templates', 'ai', 'ai_csv_mapping'],
      });
      toast('🎉 Supporter-modus aktivert!', 'success');
    }
  }, [isSupporter, activateSupporterPack, deactivateSupporterPack, toast]);

  useKonamiCode(handleKonami);

  const {
    company,
    budgetYears,
    summary: dbSummary,
    selectedBudgetYearId,
    monthlyBreakdown,
    selectBudgetYear,
    refreshMetadata,
    refreshSummary,
    createBudgetYear,
    updateBudgetYear,
    deleteBudgetYear,
  } = useDashboardData();

  const { invoices: liveInvoices } = useInvoices(selectedBudgetYearId, { limit: 10, refreshKey: invoicesRefreshKey });
  const { invoices: allInvoices } = useInvoices(selectedBudgetYearId, { limit: null, refreshKey: invoicesRefreshKey });
  const { expenses: liveExpenses } = useExpenses(selectedBudgetYearId, { limit: 10, refreshKey: expensesRefreshKey });
  const { expenses: allExpenses, breakdown: expenseBreakdown } = useExpenses(selectedBudgetYearId, { limit: null, refreshKey: expensesRefreshKey });
  const { customers } = useCustomers(customersRefreshKey);
  const { products } = useProducts({ includeInactive: true, refreshKey: productsRefreshKey });

  const invoices = useMemo(
    () => (Array.isArray(liveInvoices) && liveInvoices.length ? liveInvoices : []),
    [liveInvoices]
  );

  const expenses = useMemo(
    () => (Array.isArray(liveExpenses) && liveExpenses.length ? liveExpenses : []),
    [liveExpenses]
  );

  const fallbackSummary = useMemo(() => {
    const totals = {
      income: 0,
      expenses: 0,
      overdue: 0,
      unpaid: 0
    };

    invoices.forEach((invoice) => {
      totals.income += invoice.amount;
      if (invoice.status === 'overdue') totals.overdue += invoice.amount;
      if (invoice.status === 'sent') totals.unpaid += invoice.amount;
    });

    expenses.forEach((expense) => {
      totals.expenses += expense.amount;
    });

    return {
      ...totals,
      net: totals.income - totals.expenses
    };
  }, [expenses, invoices]);

  const summary = dbSummary ?? fallbackSummary;

  const availableBudgetYears = budgetYears;
  const selectedYear = selectedBudgetYearId ?? availableBudgetYears[0]?.id ?? null;
  const activeBudgetYear = availableBudgetYears.find((year) => year.id === selectedYear);
  const payableInvoice = (allInvoices || []).find((invoice) =>
    invoice?.dbId && ['sent', 'overdue'].includes(invoice.status)
  );

  useEffect(() => {
    let isMounted = true;
    const minTimer = setTimeout(() => {
      if (isMounted) {
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          // Hide HTML loading screen once React loading is complete
          if (typeof window.hideLoadingScreen === 'function') {
            window.hideLoadingScreen();
          }
        }, 150);
      }
    }, 1400);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => Math.min(prev + Math.random() * 15, 95));
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(minTimer);
      clearInterval(progressInterval);
    };
  }, []);

  useEffect(() => {
    if (company && company.name !== 'Default Company' && hasCompletedOnboarding()) {
      setShowOnboarding(false);
    }
  }, [company]);

  // Apply saved language preference from DB settings
  useEffect(() => {
    if (!settings) return;
    const savedLang = settings['app.language'];
    if (savedLang && ['nb', 'en'].includes(savedLang)) {
      i18n.changeLanguage(savedLang);
    }
  }, [settings]);

  // Fallback: use system locale only if no saved preference
  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.fattern?.system : null;
    if (!api?.getLocale) return;

    api
      .getLocale()
      .then((locale) => {
        if (!locale) return;
        // Only apply system locale if user hasn't saved a preference
        const savedLang = getSetting('app.language', null);
        if (savedLang) return; // saved preference takes priority

        const normalized = locale.split?.('-')[0] || locale;
        // Fattern is a Norwegian app — only switch language for Norwegian locales;
        // non-Norwegian system locales (e.g. en-US on Linux) keep the 'nb' default.
        if (['nb', 'nn', 'no'].includes(normalized)) {
          i18n.changeLanguage('nb');
        }
      })
      .catch((err) => {
        console.error('Unable to detect locale', err);
      });
  }, []);

  const utilization =
    summary.income > 0 ? Math.min(100, Math.round((summary.expenses / summary.income) * 100)) : 0;
  // Collection rate: percentage of invoices that are paid
  // Only count invoices that are sent or paid (exclude drafts)
  const collectionRate = useMemo(() => {
    if (!summary) return 0;
    const totalInvoiced = (summary.paid || 0) + (summary.unpaid || 0) + (summary.overdue || 0);
    if (totalInvoiced === 0) return 0; // No invoices sent yet
    const paid = summary.paid || 0;
    return Math.round((paid / totalInvoiced) * 100);
  }, [summary]);
  const netMargin = summary.income > 0 ? Math.round((summary.net / summary.income) * 100) : 0;

  const statHighlights = [
    { title: 'Inntekter', value: formatCurrency(summary.income), subtitle: 'Hittil i år', icon: <IconCoin size={18} stroke={1.6} />, tone: 'accent' },
    {
      title: 'Utgifter',
      value: formatCurrency(summary.expenses),
      subtitle: 'Registrerte kostnader',
      icon: <IconReceipt size={18} stroke={1.6} />,
      tone: 'warn',
    },
    {
      title: 'Netto margin',
      value: `${netMargin}%`,
      subtitle: 'av omsetning',
      icon: <IconChartBar size={18} stroke={1.6} />,
      tone: 'default',
    },
    {
      title: 'Forfalt',
      value: formatCurrency(summary.overdue),
      subtitle: 'Krever oppfølging',
      icon: <IconCalendar size={18} stroke={1.6} />,
      tone: 'danger',
    },
  ];

  const activityFeed = useMemo(() => {
    const items = [];

    // Use all invoices and expenses for complete timeline
    const allInvoicesForFeed = allInvoices || [];
    const allExpensesForFeed = allExpenses || [];

    allInvoicesForFeed.forEach((invoice) => {
      items.push({
        id: `inv-${invoice.id}`,
        title: invoice.status === 'overdue' ? 'Purring nødvendig' : 'Faktura opprettet',
        detail: `Faktura ${invoice.invoice_number || invoice.id} · ${invoice.customer}`,
        time: invoice.date ? formatDate(invoice.date) : 'Ukjent dato',
        amount: invoice.amount,
        status: invoice.status === 'overdue' ? 'warn' : 'success',
        timestamp: invoice.date ? new Date(invoice.date).getTime() : 0,
      });
    });

    allExpensesForFeed.forEach((expense) => {
      items.push({
        id: `exp-${expense.id}`,
        title: 'Utgift registrert',
        detail: `${expense.vendor} · ${expense.category}`,
        time: expense.date ? formatDate(expense.date) : 'Ukjent dato',
        amount: -Math.abs(expense.amount),
        status: 'neutral',
        timestamp: expense.date ? new Date(expense.date).getTime() : 0,
      });
    });

    // Sort by timestamp (newest first)
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [allInvoices, allExpenses]);

  const clientHighlights = useMemo(() => {
    const totals = new Map();

    invoices.forEach((invoice) => {
      if (!invoice.customer) return;
      const current = totals.get(invoice.customer) ?? 0;
      totals.set(invoice.customer, current + (invoice.amount || 0));
    });

    const derived = Array.from(totals.entries())
      .map(([name, value]) => ({
        name,
        value,
        meta: 'Fakturerte beløp i aktivt år',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    return derived;
  }, [invoices]);

  const handleOnboardingComplete = () => {
    refreshMetadata();
    setShowOnboarding(false);
  };

  // Load expense categories
  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.fattern?.db : null;
    if (!api?.listExpenseCategories) return;

    api
      .listExpenseCategories()
      .then((categories) => {
        setExpenseCategories(categories || []);
      })
      .catch((error) => {
        console.error('Kunne ikke hente utgiftskategorier', error);
      });
  }, [expensesRefreshKey]);

  const openCreateBudgetYearModal = () => {
    setEditingBudgetYear(null);
    setBudgetYearModalMode('create');
    setIsBudgetYearModalOpen(true);
  };

  const openEditBudgetYearModal = (year) => {
    setEditingBudgetYear(year);
    setBudgetYearModalMode('edit');
    setIsBudgetYearModalOpen(true);
  };

  const handleDeleteBudgetYear = async (year) => {
    if (!year || !year.id) return;
    if (year.is_current) {
      setDeleteConfirm({
        isOpen: true,
        item: year,
        type: 'budgetYear',
        title: 'Kan ikke slette',
        description: 'Kan ikke slette aktivt budsjettår. Velg et annet år som aktivt først.',
        variant: 'warning',
        confirmLabel: 'OK',
        onConfirm: () => {},
      });
      return;
    }

    setDeleteConfirm({
      isOpen: true,
      item: year,
      type: 'budgetYear',
      title: 'Slett budsjettår',
      description: `Er du sikker på at du vil slette budsjettåret "${year.label}"? Denne handlingen kan ikke angres.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteBudgetYear?.(year.id);
          toast.success('Budsjettår slettet');
        } catch (error) {
          console.error('Kunne ikke slette budsjettår', error);
          toast.error('Kunne ikke slette budsjettår');
          throw error;
        }
      },
    });
  };

  const handleSelectYear = (yearId) => {
    if (budgetYears.length) {
      selectBudgetYear(yearId);
    }
  };

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProductModalMode('create');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductModalMode('edit');
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (product) => {
    if (!product || !product.id) return;

    setDeleteConfirm({
      isOpen: true,
      item: product,
      type: 'product',
      title: 'Slett eller deaktiver produkt',
      description: `Produktet "${product.name}" kan være i bruk i eksisterende fakturaer. Vi anbefaler å deaktivere produktet i stedet for å slette det. Deaktiverte produkter vil ikke vises i lister, men vil fortsatt være tilgjengelige i eksisterende fakturaer.`,
      variant: 'danger',
      showDeactivate: true,
      onDeactivate: async () => {
        const api = typeof window !== 'undefined' ? window.fattern?.db : null;
        if (!api?.setProductActive) {
          throw new Error('API ikke tilgjengelig');
        }
        await api.setProductActive(product.id, false);
        // Force refresh of products list
        setProductsRefreshKey((prev) => prev + 1);
        toast.success('Produkt deaktivert');
      },
      onConfirm: async () => {
        try {
          const api = typeof window !== 'undefined' ? window.fattern?.db : null;
          if (api?.deleteProduct) {
            await api.deleteProduct(product.id);
            setProductsRefreshKey((prev) => prev + 1);
            toast.success('Produkt slettet');
          }
        } catch (error) {
          console.error('Kunne ikke slette produkt', error);
          toast.error('Kunne ikke slette produkt');
          throw error;
        }
      },
    });
  };

  const handleProductSubmit = async (payload) => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api) return;

      if (productModalMode === 'edit' && payload.id) {
        await api.updateProduct(payload.id, payload);
      } else {
        // Remove id from payload when creating
        const { id, ...createPayload } = payload;
        await api.createProduct(createPayload);
      }
      setProductsRefreshKey((prev) => prev + 1);
      toast.success(productModalMode === 'edit' ? 'Produkt oppdatert' : 'Produkt opprettet');
    } catch (error) {
      console.error('Kunne ikke lagre produkt', error);
      toast.error('Kunne ikke lagre produkt');
      throw error;
    }
  };

  const openCreateCustomerModal = () => {
    setEditingCustomer(null);
    setCustomerModalMode('create');
    setIsCustomerModalOpen(true);
  };

  const openEditCustomerModal = (customer) => {
    setEditingCustomer(customer);
    setCustomerModalMode('edit');
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = (customer) => {
    if (!customer || !customer.id) return;

    setDeleteConfirm({
      isOpen: true,
      item: customer,
      type: 'customer',
      title: 'Slett kunde',
      description: `Er du sikker på at du vil slette kunden "${customer.name}"? Denne handlingen kan ikke angres.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const api = typeof window !== 'undefined' ? window.fattern?.db : null;
          if (api?.deleteCustomer) {
            await api.deleteCustomer(customer.id);
            setCustomersRefreshKey((prev) => prev + 1);
          }
        } catch (error) {
          console.error('Kunne ikke slette kunde', error);
          throw error;
        }
      },
    });
  };

  const handleCustomerSubmit = async (payload) => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api) return;

      if (customerModalMode === 'edit' && payload.id) {
        await api.updateCustomer(payload.id, payload);
      } else {
        // Remove id from payload when creating
        const { id, ...createPayload } = payload;
        await api.createCustomer(createPayload);
      }
      setCustomersRefreshKey((prev) => prev + 1);
      toast.success(customerModalMode === 'edit' ? 'Kunde oppdatert' : 'Kunde opprettet');
    } catch (error) {
      console.error('Kunne ikke lagre kunde', error);
      toast.error('Kunne ikke lagre kunde');
      throw error;
    }
  };

  const openCreateExpenseModal = () => {
    setEditingExpense(null);
    setExpenseModalMode('create');
    setIsExpenseModalOpen(true);
  };

  const openEditExpenseModal = async (expense) => {
    if (!expense || !expense.id) return;
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api) return;
      const fullExpense = await api.getExpense(expense.id);
      setEditingExpense(fullExpense);
      setExpenseModalMode('edit');
      setIsExpenseModalOpen(true);
    } catch (error) {
      console.error('Kunne ikke hente utgift', error);
      toast.error('Kunne ikke hente utgift');
    }
  };

  const handleExpenseSubmit = async (payload) => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api) return;

      if (expenseModalMode === 'edit' && payload.id) {
        await api.updateExpense(payload.id, payload);
      } else {
        // Remove id from payload when creating
        const { id, ...createPayload } = payload;
        await api.createExpense(createPayload);
      }
      setExpensesRefreshKey((prev) => prev + 1);
      toast.success(expenseModalMode === 'edit' ? 'Utgift oppdatert' : 'Utgift registrert');
    } catch (error) {
      console.error('Kunne ikke lagre utgift', error);
      toast.error('Kunne ikke lagre utgift');
      throw error;
    }
  };

  const handleDeleteExpense = (expense) => {
    if (!expense || !expense.id) return;

    setDeleteConfirm({
      isOpen: true,
      item: expense,
      type: 'expense',
      title: 'Slett utgift',
      description: `Er du sikker på at du vil slette utgiften "${expense.vendor || 'Ukjent leverandør'}"? Denne handlingen kan ikke angres.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const api = typeof window !== 'undefined' ? window.fattern?.db : null;
          if (!api) return;
          await api.deleteExpense(expense.id);
          setExpensesRefreshKey((prev) => prev + 1);
          toast.success('Utgift slettet');
        } catch (error) {
          console.error('Kunne ikke slette utgift', error);
          toast.error('Kunne ikke slette utgift');
        }
      },
    });
  };

  const openManageExpenseCategories = () => {
    setIsExpenseCategoryModalOpen(true);
  };

  const handleExpenseCategorySubmit = async (payload) => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api) return;

      if (payload.id) {
        await api.updateExpenseCategory(payload.id, payload);
        toast.success('Kategori oppdatert');
      } else {
        const { id, ...createPayload } = payload;
        await api.createExpenseCategory(createPayload);
        toast.success('Kategori opprettet');
      }
      setExpensesRefreshKey((k) => k + 1); // Refresh categories
    } catch (error) {
      console.error('Kunne ikke lagre kategori', error);
      toast.error('Kunne ikke lagre kategori');
      throw error;
    }
  };

  const handleDeleteExpenseCategory = (category) => {
    if (!category || !category.id) return;

    setDeleteConfirm({
      isOpen: true,
      item: category,
      type: 'expenseCategory',
      title: 'Slett kategori',
      description: `Er du sikker på at du vil slette kategorien "${category.name}"? Denne handlingen kan ikke angres.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const api = typeof window !== 'undefined' ? window.fattern?.db : null;
          if (!api) return;
          await api.deleteExpenseCategory(category.id);
          toast.success('Kategori slettet');
          setExpensesRefreshKey((k) => k + 1);
        } catch (error) {
          console.error('Kunne ikke slette kategori', error);
          toast.error('Kunne ikke slette kategori');
          throw error;
        }
      },
    });
  };

  const openCreateInvoiceModal = () => {
    setEditingInvoice(null);
    setInvoiceModalMode('create');
    setIsInvoiceModalOpen(true);
  };

  const openEditInvoiceModal = async (invoice) => {
    // getInvoice() returns raw DB rows with .id; list items carry .dbId — accept both
    const invoiceId = invoice?.dbId ?? invoice?.id;
    if (!invoiceId) return;
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api?.getInvoice) return;
      const fullInvoice = await api.getInvoice(invoiceId);
      setEditingInvoice(fullInvoice);
      setInvoiceModalMode('edit');
      setIsInvoiceModalOpen(true);
    } catch (error) {
      console.error('Kunne ikke hente faktura', error);
    }
  };

  const handleDeleteInvoice = (invoice) => {
    if (!invoice || !invoice.dbId) return;

    setDeleteConfirm({
      isOpen: true,
      item: invoice,
      type: 'invoice',
      title: 'Slett faktura',
      description: `Er du sikker på at du vil slette faktura "${invoice.id}"? Denne handlingen kan ikke angres.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const api = typeof window !== 'undefined' ? window.fattern?.db : null;
          if (api?.deleteInvoice) {
            await api.deleteInvoice(invoice.dbId);
            setInvoicesRefreshKey((prev) => prev + 1);
            // Refresh dashboard summary to update collection rate
            if (selectedBudgetYearId) {
              refreshSummary?.(selectedBudgetYearId);
            }
          }
        } catch (error) {
          console.error('Kunne ikke slette faktura', error);
          throw error;
        }
      },
    });
  };

  const handleInvoiceSubmit = async (payload) => {
    const api = typeof window !== 'undefined' ? window.fattern?.db : null;
    if (!api) {
      throw new Error('Database API ikke tilgjengelig');
    }

    try {
      if (invoiceModalMode === 'edit' && payload.id) {
        await api.updateInvoice(payload.id, payload);
        toast.success('Faktura oppdatert');
      } else {
        // Remove id from payload when creating
        const { id, ...createPayload } = payload;
        if (!selectedBudgetYearId) {
          throw new Error('Ingen budsjettår valgt. Velg et budsjettår først.');
        }
        createPayload.budgetYearId = selectedBudgetYearId;
        const result = await api.createInvoice(createPayload);
        console.log('Invoice created successfully:', result);
        
        // Check if invoice date is outside the current budget year range
        const selectedYear = budgetYears.find((y) => y.id === selectedBudgetYearId);
        if (selectedYear && result?.invoice_date) {
          const invoiceDate = new Date(result.invoice_date);
          const yearStart = new Date(selectedYear.start_date);
          const yearEnd = new Date(selectedYear.end_date);
          
          if (invoiceDate < yearStart || invoiceDate > yearEnd) {
            toast.warning(
              `Faktura opprettet, men vises ikke i listen fordi fakturadatoen (${formatDate(result.invoice_date)}) er utenfor budsjettåret "${selectedYear.label}" (${formatDate(selectedYear.start_date)} - ${formatDate(selectedYear.end_date)})`
            );
          } else {
            toast.success('Faktura opprettet');
          }
        } else {
          toast.success('Faktura opprettet');
        }
      }
      setInvoicesRefreshKey((prev) => prev + 1);
      // Refresh dashboard summary to update collection rate
      if (selectedBudgetYearId) {
        refreshSummary?.(selectedBudgetYearId);
      }
    } catch (error) {
      console.error('Kunne ikke lagre faktura', error);
      const errorMessage = error?.message || 'Kunne ikke lagre faktura';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleInvoiceStatusChange = async (invoice, newStatus, paymentDate = null) => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api) return;
      
      const invoiceId = invoice?.dbId || invoice?.id;
      if (!invoiceId) {
        console.error('Invoice ID not found', invoice);
        return;
      }

      await api.updateInvoiceStatus(invoiceId, newStatus, paymentDate);
      toast.success('Status oppdatert');
      setInvoicesRefreshKey((prev) => prev + 1);
      // Refresh dashboard summary to update collection rate
      if (selectedBudgetYearId) {
        refreshSummary?.(selectedBudgetYearId);
      }
    } catch (error) {
      console.error('Kunne ikke oppdatere status', error);
      toast.error('Kunne ikke oppdatere status');
      throw error;
    }
  };

  const showInvoiceStatusModal = async (invoice, newStatus = null) => {
    if (!invoice?.dbId) return;
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api?.getInvoice) return;
      const fullInvoice = await api.getInvoice(invoice.dbId);
      setEditingInvoiceStatus(fullInvoice);
      setPendingStatus(newStatus);
      setIsInvoiceStatusModalOpen(true);
    } catch (error) {
      console.error('Kunne ikke hente faktura', error);
      // Fallback: use the invoice data we have
      setEditingInvoiceStatus(invoice);
      setPendingStatus(newStatus);
      setIsInvoiceStatusModalOpen(true);
    }
  };

  const handleInvoiceStatusModalSubmit = async (payload) => {
    if (!editingInvoiceStatus?.id && !editingInvoiceStatus?.dbId) return;
    const invoiceId = editingInvoiceStatus.id || editingInvoiceStatus.dbId;
    await handleInvoiceStatusChange({ ...editingInvoiceStatus, dbId: invoiceId }, payload.status, payload.paymentDate);
    setIsInvoiceStatusModalOpen(false);
    setEditingInvoiceStatus(null);
    setPendingStatus(null);
  };

  const openViewInvoiceModal = async (invoice) => {
    if (!invoice?.dbId) return;
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api?.getInvoice) return;
      const fullInvoice = await api.getInvoice(invoice.dbId);
      setViewingInvoice(fullInvoice);
      setIsInvoiceViewModalOpen(true);
    } catch (error) {
      console.error('Kunne ikke hente faktura', error);
      toast.error('Kunne ikke laste faktura');
    }
  };

  const handleViewInvoiceGeneratePDF = async (invoice) => {
    if (!invoice?.id && !invoice?.dbId) return;
    const invoiceId = invoice.id || invoice.dbId;
    try {
      const api = typeof window !== 'undefined' ? window.fattern : null;
      if (!api?.pdf?.generateInvoice) {
        throw new Error('PDF generation ikke tilgjengelig');
      }

      // Ensure default template exists
      if (api.template?.createDefault) {
        await api.template.createDefault();
      }

      // Get default template ID from settings
      const defaultTemplateId = getSetting('invoice.defaultTemplate', 'default_invoice');

      const result = await api.pdf.generateInvoice(invoiceId, defaultTemplateId);
      if (result?.success && result?.filepath) {
        toast.success('PDF lastet ned');
        if (api.openFile) {
          await api.openFile(result.filepath);
        }
      }
    } catch (error) {
      console.error('Kunne ikke generere PDF', error);
      toast.error('Kunne ikke generere PDF');
      throw error;
    }
  };

  // Don't render LoadingScreen component - HTML loading screen handles it
  // Just wait for loading to complete before showing the app
  if (isLoading) {
    return null;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'Fakturaer':
        return (
          <InvoicesPage
            invoices={allInvoices || []}
            formatCurrency={formatCurrency}
            onCreateInvoice={openCreateInvoiceModal}
            onEditInvoice={openEditInvoiceModal}
            onViewInvoice={openViewInvoiceModal}
            onDeleteInvoice={handleDeleteInvoice}
            onStatusChange={handleInvoiceStatusChange}
            showStatusModal={showInvoiceStatusModal}
            showToast={toast}
          />
        );
      case 'Utgifter':
        return (
          <ExpensesPage
            expenses={allExpenses || []}
            breakdown={expenseBreakdown || []}
            formatCurrency={formatCurrency}
            onCreateExpense={openCreateExpenseModal}
            onEditExpense={openEditExpenseModal}
            onDeleteExpense={handleDeleteExpense}
            onManageCategories={openManageExpenseCategories}
          />
        );
      case 'Kunder':
        return (
          <CustomersPage
            customers={customers || []}
            onEditCustomer={openEditCustomerModal}
            onDeleteCustomer={handleDeleteCustomer}
            onCreateCustomer={openCreateCustomerModal}
          />
        );
      case 'Produkter':
        return (
          <ProductsPage
            products={products || []}
            formatCurrency={formatCurrency}
            onCreateProduct={openCreateProductModal}
            onEditProduct={openEditProductModal}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'Budsjettår':
        return (
          <BudgetYearsPage
            budgetYears={availableBudgetYears}
            selectedYearId={selectedYear}
            onSelectYear={handleSelectYear}
            onCreateYear={openCreateBudgetYearModal}
            onEditYear={openEditBudgetYearModal}
            onDeleteYear={handleDeleteBudgetYear}
            formatCurrency={formatCurrency}
          />
        );
      case 'Innstillinger':
        return (
          <SettingsPage
            company={company}
            onCompanyUpdate={refreshMetadata}
            onOpenTemplateEditor={(templateId) => setTemplateEditorId(templateId || 'default_invoice')}
            onRefreshData={() => {
              setCustomersRefreshKey((prev) => prev + 1);
              setProductsRefreshKey((prev) => prev + 1);
              refreshMetadata();
            }}
          />
        );
      case 'Oversikt':
      default:
        return (
          <DashboardView
            budgetYears={availableBudgetYears}
            selectedYear={selectedYear}
            onSelectYear={handleSelectYear}
            statHighlights={statHighlights}
            invoices={invoices}
            expenses={expenses}
            activityFeed={activityFeed}
            clientHighlights={clientHighlights}
            summaries={summary}
            utilization={utilization}
            collectionRate={collectionRate}
            formatCurrency={formatCurrency}
            monthlyBreakdown={monthlyBreakdown}
            onOpenBudgetYearModal={openCreateBudgetYearModal}
            onEditBudgetYear={openEditBudgetYearModal}
            onDeleteBudgetYear={handleDeleteBudgetYear}
            onCreateInvoice={openCreateInvoiceModal}
            onCreateExpense={() => setCurrentPage('Utgifter')}
            onNavigate={setCurrentPage}
            onOpenTimeline={() => setIsTimelineModalOpen(true)}
            onInvoiceStatusChange={handleInvoiceStatusChange}
            showInvoiceStatusModal={showInvoiceStatusModal}
            onViewInvoice={openViewInvoiceModal}
            overdueInvoices={(allInvoices || []).filter(inv => inv.status === 'overdue')}
          />
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <TitleBar showBrand={!!templateEditorId} />
      {templateEditorId ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TemplateEditorPage
            templateId={templateEditorId}
            onClose={() => setTemplateEditorId(null)}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Layout
            company={company}
            navItems={navItems}
            workflowShortcuts={workflowShortcuts}
            activeNavItem={currentPage}
            onNavigate={setCurrentPage}
            badges={{ Fakturaer: (allInvoices || []).filter(inv => inv.status === 'overdue').length }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ padding: '24px 28px', minHeight: '100%' }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </Layout>
        </div>
      )}
      <BottomBar
        company={company}
        budgetYears={availableBudgetYears}
        selectedBudgetYearId={selectedYear}
        onBudgetYearChange={handleSelectYear}
        onCompanyClick={() => setCurrentPage('Innstillinger')}
        onCreateBudgetYear={openCreateBudgetYearModal}
        status={{
          currentPage,
          budgetYear: activeBudgetYear?.label || activeBudgetYear?.name,
        }}
        actions={[
          {
            id: 'new-invoice',
            labelKey: 'layout.shortcut_new_invoice',
            shortcut: '⌘ N',
            icon: 'invoice',
            onSelect: openCreateInvoiceModal,
          },
          {
            id: 'register-payment',
            labelKey: 'layout.shortcut_register_payment',
            shortcut: '⌘ P',
            icon: 'payment',
            disabled: !payableInvoice,
            disabledReasonKey: 'layout.bottom_bar.no_payable_invoices',
            onSelect: () => showInvoiceStatusModal(payableInvoice, 'paid'),
          },
          {
            id: 'add-expense',
            labelKey: 'layout.shortcut_add_expense',
            shortcut: '⌘ E',
            icon: 'expense',
            onSelect: openCreateExpenseModal,
          },
          {
            id: 'new-customer',
            labelKey: 'layout.shortcut_new_customer',
            icon: 'customer',
            onSelect: openCreateCustomerModal,
          },
          {
            id: 'new-product',
            labelKey: 'layout.shortcut_new_product',
            icon: 'product',
            onSelect: openCreateProductModal,
          },
          {
            id: 'new-budget-year',
            labelKey: 'layout.shortcut_new_budget_year',
            icon: 'budgetYear',
            onSelect: openCreateBudgetYearModal,
          },
        ]}
      />
      {showOnboarding ? (
        <OnboardingFlow initialCompany={company} onComplete={handleOnboardingComplete} />
      ) : null}
      <BudgetYearModal
        isOpen={isBudgetYearModalOpen}
        mode={budgetYearModalMode}
        initialYear={editingBudgetYear}
        onClose={() => setIsBudgetYearModalOpen(false)}
        onSubmit={async (payload) => {
          try {
            if (budgetYearModalMode === 'edit') {
              await updateBudgetYear?.(payload);
              toast.success('Budsjettår oppdatert');
            } else {
              await createBudgetYear?.(payload);
              toast.success('Budsjettår opprettet');
            }
          } catch (error) {
            console.error('Kunne ikke lagre budsjettår', error);
            toast.error('Kunne ikke lagre budsjettår');
            throw error;
          }
        }}
      />
      <ProductModal
        isOpen={isProductModalOpen}
        mode={productModalMode}
        initialProduct={editingProduct}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
      />
      <CustomerModal
        isOpen={isCustomerModalOpen}
        mode={customerModalMode}
        initialCustomer={editingCustomer}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleCustomerSubmit}
      />
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        mode={invoiceModalMode}
        initialInvoice={editingInvoice}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSubmit={handleInvoiceSubmit}
        customers={customers || []}
        products={products || []}
        company={company}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        mode={expenseModalMode}
        initialExpense={editingExpense}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
        categories={expenseCategories || []}
      />
      <ExpenseCategoryManagementModal
        isOpen={isExpenseCategoryModalOpen}
        onClose={() => setIsExpenseCategoryModalOpen(false)}
        categories={expenseCategories || []}
        onCreateCategory={handleExpenseCategorySubmit}
        onEditCategory={async (payload) => {
          const api = typeof window !== 'undefined' ? window.fattern?.db : null;
          if (!api || !payload.id) return;
          await api.updateExpenseCategory(payload.id, payload);
          toast.success('Kategori oppdatert');
          setExpensesRefreshKey((k) => k + 1);
        }}
        onDeleteCategory={handleDeleteExpenseCategory}
      />
      <InvoiceStatusModal
        isOpen={isInvoiceStatusModalOpen}
        invoice={editingInvoiceStatus}
        initialStatus={pendingStatus}
        onClose={() => {
          setIsInvoiceStatusModalOpen(false);
          setEditingInvoiceStatus(null);
          setPendingStatus(null);
        }}
        onSubmit={handleInvoiceStatusModalSubmit}
      />
      <InvoiceViewModal
        isOpen={isInvoiceViewModalOpen}
        invoice={viewingInvoice}
        company={company}
        formatCurrency={formatCurrency}
        budgetYearId={selectedBudgetYearId}
        onClose={() => {
          setIsInvoiceViewModalOpen(false);
          setViewingInvoice(null);
        }}
        onEdit={(invoice) => {
          setIsInvoiceViewModalOpen(false);
          setViewingInvoice(null);
          openEditInvoiceModal(invoice);
        }}
        onGeneratePDF={handleViewInvoiceGeneratePDF}
        onStatusChange={() => setInvoicesRefreshKey((prev) => prev + 1)}
      />
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null, type: null, onConfirm: null, onDeactivate: null })}
        onConfirm={deleteConfirm.onConfirm}
        onDeactivate={deleteConfirm.onDeactivate}
        title={deleteConfirm.title}
        description={deleteConfirm.description}
        variant={deleteConfirm.variant || 'danger'}
        confirmLabel={deleteConfirm.confirmLabel || 'Slett'}
        showDeactivate={deleteConfirm.showDeactivate || false}
      />
      <TimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        activityFeed={activityFeed}
        formatCurrency={formatCurrency}
      />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
