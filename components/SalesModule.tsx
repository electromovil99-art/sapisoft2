
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Search, Trash2, CreditCard, Banknote, UserPlus, FileText, Printer, 
    Plus, Minus, X, Check, ShoppingCart, User, Smartphone, Receipt, 
    QrCode, Landmark, CheckCircle, Edit3, Lock, ShieldAlert, MapPin, 
    History, AlertTriangle, ArrowRight, Wallet, RotateCcw, ClipboardList, 
    Upload, DollarSign, Save, ListChecks, ChevronDown, TrendingUp, Info, Tablet, Hash, Calendar, Globe, Zap
} from 'lucide-react';
import { Product, CartItem, Client, PaymentBreakdown, Category, PurchaseRecord, BankAccount, PaymentMethodType, GeoLocation, Quotation } from '../types';

interface SalesModuleProps {
    products: Product[];
    clients: Client[];
    categories: Category[]; 
    purchasesHistory: PurchaseRecord[];
    bankAccounts: BankAccount[]; 
    locations: GeoLocation[];
    onAddClient: (client: Client) => void;
    onProcessSale: (cart: CartItem[], total: number, docType: string, clientName: string, paymentBreakdown: PaymentBreakdown, ticketId: string, detailedPayments: any[], currency: string, exchangeRate: number) => void;
    cart: CartItem[];
    setCart: (cart: CartItem[]) => void;
    client: Client | null;
    setClient: (client: Client | null) => void;
    quotations: Quotation[];
    onLoadQuotation: (quotation: Quotation) => void;
    onAddQuotation: (quotation: Quotation) => void;
    systemBaseCurrency: string; // Nueva Prop: Moneda base configurada
}

interface PaymentDetail {
    id: string;
    method: PaymentMethodType;
    amount: number;
    reference?: string;
    accountId?: string;
    bankName?: string; 
}

export const SalesModule: React.FC<SalesModuleProps> = ({ 
    products, clients, categories, purchasesHistory, bankAccounts, locations, 
    onAddClient, onProcessSale, cart, setCart, client, setClient, quotations, onLoadQuotation, onAddQuotation,
    systemBaseCurrency
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); 
  const [clientSearchTerm, setClientSearchTerm] = useState('CLIENTE VARIOS'); 
  const [docType, setDocType] = useState('TICKET DE VENTA');
  const [docNumber, setDocNumber] = useState(''); 
  
  const [currency, setCurrency] = useState<string>(systemBaseCurrency);
  const [exchangeRate, setExchangeRate] = useState<string>('3.75');

  const [paymentCondition, setPaymentCondition] = useState<'Contado' | 'Credito'>('Contado');
  const [creditDays, setCreditDays] = useState<number>(30);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState<Product | null>(null);

  const [paymentList, setPaymentList] = useState<PaymentDetail[]>([]);
  const [currentPayment, setCurrentPayment] = useState<{
      method: PaymentMethodType;
      amount: string;
      reference: string;
      accountId: string;
  }>({ method: 'Efectivo', amount: '', reference: '', accountId: '' });

  const cartRef = useRef(cart);
  const clientRef = useRef(client);
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { clientRef.current = client; }, [client]);

  // Sincronizar moneda cuando cambia la configuración del sistema
  useEffect(() => {
    setCurrency(systemBaseCurrency);
  }, [systemBaseCurrency]);

  useEffect(() => {
    return () => {
        if (cartRef.current.length > 0) {
            const autoQuotation: Quotation = {
                id: 'AUTO-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                date: new Date().toLocaleDateString('es-PE'),
                time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                clientName: clientRef.current?.name || 'CLIENTE VARIOS',
                items: [...cartRef.current],
                total: cartRef.current.reduce((acc, i) => acc + i.total, 0)
            };
            onAddQuotation(autoQuotation);
            setCart([]); 
        }
    };
  }, []);

  const costAnalysis = useMemo(() => {
      if (!showCostModal) return null;
      const history = purchasesHistory
          .filter(p => p.items.some(it => it.id === showCostModal.id))
          .map(p => ({
              date: p.date, supplier: p.supplierName,
              qty: p.items.find(it => it.id === showCostModal.id)?.quantity || 0,
              cost: p.items.find(it => it.id === showCostModal.id)?.price || 0
          })).slice(0, 5);

      const totalSpent = history.reduce((acc, curr) => acc + (curr.cost * curr.qty), 0);
      const totalQty = history.reduce((acc, curr) => acc + curr.qty, 0);
      const avgCost = totalQty > 0 ? totalSpent / totalQty : (showCostModal.cost || 0);

      return { history, avgCost };
  }, [showCostModal, purchasesHistory]);

  const [newClientData, setNewClientData] = useState({ 
      name: '', dni: '', phone: '', address: '', email: '',
      department: 'CUSCO', province: 'CUSCO', district: '' 
  });

  const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null); 
  const [authPassword, setAuthPassword] = useState(''); 
  const [isAuthorized, setIsAuthorized] = useState(false); 
  const [newPriceInput, setNewPriceInput] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  const departments = locations.filter(l => l.type === 'DEP');
  const provinces = locations.filter(l => l.type === 'PROV' && l.parentId === (departments.find(d => d.name === newClientData.department)?.id));
  const districts = locations.filter(l => l.type === 'DIST' && l.parentId === (provinces.find(p => p.name === newClientData.province)?.id));

  const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    if (client) setClientSearchTerm(client.name);
    else if (!client && clientSearchTerm === '') setClientSearchTerm('CLIENTE VARIOS');
  }, [client]);

  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setClientSearchTerm(val);
      
      const searchWords = normalize(val).split(" ").filter(w => w !== "");
      const found = clients.find(c => {
          const target = normalize(`${c.name} ${c.dni}`);
          return searchWords.length > 0 && searchWords.every(word => target.includes(word));
      });
      
      if (found) setClient(found);
      else setClient(null);
  };

  const filteredProducts = products.filter(p => {
    const searchWords = normalize(searchTerm).split(" ").filter(w => w !== "");
    const targetString = normalize(`${p.name} ${p.code}`);
    
    const matchesSearch = searchTerm === '' || searchWords.every(word => targetString.includes(word));
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    return (searchTerm.length > 0 || selectedCategory !== '') && matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Sin stock disponible");
    const existing = cart.find(item => item.id === product.id);
    if (existing && existing.quantity >= product.stock) return alert("No hay más stock disponible");

    // Lógica multimoneda dinámica
    let basePrice = product.price;
    if (currency !== systemBaseCurrency) {
        const rate = parseFloat(exchangeRate) || 3.75;
        basePrice = basePrice / rate;
    }

    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item));
    } else {
      setCart([...cart, { ...product, price: basePrice, quantity: 1, discount: 0, total: basePrice }]);
    }
    setSearchTerm('');
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        if(!product) return item;
        const newQ = Math.max(1, item.quantity + delta);
        if (newQ > product.stock) { alert("Excede el stock disponible"); return item; }
        return { ...item, quantity: newQ, total: newQ * item.price };
      }
      return item;
    }));
  };

  const handleAuthorize = () => {
      if (authPassword === '1234') { setIsAuthorized(true); } 
      else { alert("Contraseña de administrador incorrecta."); }
  };

  const handleApplyNewPrice = () => {
      const price = parseFloat(newPriceInput);
      if (isNaN(price) || price <= 0) return alert("Precio inválido");
      setCart(cart.map(item => item.id === priceEditItem?.id ? { ...item, price: price, total: item.quantity * price } : item));
      setShowAuthModal(false); setPriceEditItem(null); setIsAuthorized(false);
  };

  const total = cart.reduce((acc, item) => acc + item.total, 0);
  const getPaymentTotal = () => paymentList.reduce((acc, p) => acc + p.amount, 0);
  const remainingTotal = Math.max(0, total - getPaymentTotal());

  const handleAddPayment = () => {
      const amountVal = parseFloat(currentPayment.amount);
      if (isNaN(amountVal) || amountVal <= 0) return alert("Ingrese un monto válido");
      
      if (currentPayment.method !== 'Efectivo' && currentPayment.method !== 'Saldo Favor' && !currentPayment.accountId) {
          return alert("Debe seleccionar la CUENTA BANCARIA DE DESTINO para este medio de pago.");
      }

      const bankInfo = bankAccounts.find(b => b.id === currentPayment.accountId);
      const newPay: PaymentDetail = { 
          id: Math.random().toString(), 
          method: currentPayment.method, 
          amount: amountVal, 
          reference: currentPayment.reference, 
          accountId: currentPayment.accountId, 
          bankName: bankInfo ? (bankInfo.alias || bankInfo.bankName) : undefined 
      };
      
      setPaymentList([...paymentList, newPay]);
      
      setCurrentPayment({ ...currentPayment, amount: '', reference: '', accountId: '' });
      if (paymentAmountRef.current) paymentAmountRef.current.focus();
  };

  const handleProcessSaleRequest = () => {
    if (cart.length === 0) return;
    
    const fullDocType = docType + (docNumber ? ` #${docNumber}` : '');

    if (paymentCondition === 'Contado') {
        setPaymentList([]);
        setCurrentPayment({...currentPayment, amount: total.toFixed(2), method: 'Efectivo', reference: '', accountId: ''});
        setShowPaymentModal(true);
    } else {
        const ticketId = 'CR-' + Math.floor(Math.random() * 1000000).toString();
        const emptyBreakdown: PaymentBreakdown = { cash: 0, yape: 0, card: 0, bank: 0, wallet: 0 };
        onProcessSale([...cart], total, fullDocType, client?.name || 'CLIENTE VARIOS', emptyBreakdown, ticketId, [], currency, parseFloat(exchangeRate));
        setCart([]); setClient(null); setClientSearchTerm('CLIENTE VARIOS'); setDocNumber('');
        alert("Venta a crédito registrada correctamente.");
    }
  };

  const handleFinalizeSale = () => {
      if (getPaymentTotal() < total - 0.05) return alert("Falta completar el pago.");
      const ticketId = Math.floor(Math.random() * 1000000).toString();
      const fullDocType = docType + (docNumber ? ` #${docNumber}` : '');
      const breakdown: PaymentBreakdown = {
          cash: paymentList.filter(p => p.method === 'Efectivo').reduce((a, b) => a + b.amount, 0),
          yape: paymentList.filter(p => p.method === 'Yape' || p.method === 'Plin' || p.method === 'Yape/Plin').reduce((a, b) => a + b.amount, 0),
          card: paymentList.filter(p => p.method === 'Tarjeta').reduce((a, b) => a + b.amount, 0),
          bank: paymentList.filter(p => p.method === 'Deposito' || p.method === 'Transferencia').reduce((a, b) => a + b.amount, 0),
          wallet: paymentList.filter(p => p.method === 'Saldo Favor').reduce((a, b) => a + b.amount, 0),
      };
      onProcessSale([...cart], total, fullDocType, client?.name || 'CLIENTE VARIOS', breakdown, ticketId, paymentList, currency, parseFloat(exchangeRate));
      setCart([]); setClient(null); setClientSearchTerm('CLIENTE VARIOS'); setDocNumber(''); setShowPaymentModal(false);
  };

  // Filtrar cuentas habilitadas para VENTAS y que coincidan con la moneda de la venta
  const availableBankAccounts = useMemo(() => {
      return bankAccounts.filter(acc => acc.useInSales && acc.currency === currency);
  }, [bankAccounts, currency]);

  return (
    <div className="flex h-full gap-4 animate-in fade-in duration-500">
      
      <div className="flex-1 flex flex-col gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50/50 dark:bg-slate-900/50">
           <div className="flex-1 flex gap-2">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                 <input ref={searchInputRef} type="text" className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:border-primary-500 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <button onClick={() => setShowRecoverModal(true)} className="px-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-primary-600 transition-colors shadow-sm" title="Ventas Pendientes">
                   <History size={18}/>
               </button>
               <select className="w-40 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-white outline-none" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    <option value="">Categorías</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
           </div>
           {filteredProducts.length > 0 && (
              <div className="absolute top-[70px] left-4 right-[310px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[500] max-h-[50vh] overflow-y-auto p-1">
                 {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-b border-slate-50 dark:border-slate-700 flex justify-between items-center rounded-lg group">
                       <div>
                          <div className="font-bold text-slate-800 dark:text-white group-hover:text-primary-600 text-xs uppercase">{p.name}</div>
                          <div className="text-[10px] text-slate-400">SKU: {p.code} | STOCK: {p.stock}</div>
                       </div>
                       <div className="font-black text-slate-900 dark:text-white text-sm">
                           {currency === systemBaseCurrency ? `${currency} ${p.price.toFixed(2)}` : `${currency} ${(p.price / parseFloat(exchangeRate)).toFixed(2)}`}
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>

        <div className="flex-1 overflow-auto">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                <ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-20"/>
                <p className="text-xs font-black uppercase tracking-widest">Carrito Vacío</p>
             </div>
           ) : (
             <table className="w-full text-left text-xs">
                <thead>
                   <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100 dark:border-slate-700 tracking-widest">
                     <th className="py-3 px-4">Descripción</th>
                     <th className="py-3 text-center">Cant.</th>
                     <th className="py-3 text-right">Precio</th>
                     <th className="py-3 text-right">Total</th>
                     <th className="py-3 text-center"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                   {cart.map(item => (
                      <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                         <td className="py-2 px-4">
                            <div className="font-bold text-slate-800 dark:text-white text-sm uppercase">{item.name}</div>
                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Stock: {item.stock}</div>
                         </td>
                         <td className="py-2">
                            <div className="flex items-center justify-center gap-2">
                               <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"><Minus size={12}/></button>
                               <span className="w-6 text-center font-black text-slate-800 dark:text-white text-sm">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"><Plus size={12}/></button>
                            </div>
                         </td>
                         <td className="py-2 text-right">
                            <button onClick={() => { setPriceEditItem(item); setAuthPassword(''); setIsAuthorized(false); setNewPriceInput(item.price.toString()); setShowAuthModal(true); }} className="text-slate-700 dark:text-slate-200 hover:text-primary-600 font-bold group/edit px-1.5 py-0.5 rounded-lg hover:bg-primary-50 transition-all text-sm">
                                {currency} {item.price.toFixed(2)} <Edit3 size={10} className="inline opacity-0 group-hover/edit:opacity-100 ml-1"/>
                            </button>
                         </td>
                         <td className="py-2 text-right font-black text-slate-900 dark:text-white text-sm">{currency} {item.total.toFixed(2)}</td>
                         <td className="py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setShowCostModal(item)} className="p-1.5 text-slate-300 hover:text-orange-500 transition-all opacity-0 group-hover:opacity-100" title="Costo">
                                    <ShieldAlert size={14}/>
                                </button>
                                <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="p-1.5 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Venta</span>
                  {currency !== systemBaseCurrency && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase">TC: {exchangeRate}</span>}
              </div>
              <span className="text-2xl font-black text-primary-600 dark:text-primary-400">{currency} {total.toFixed(2)}</span>
           </div>
        </div>
      </div>
      
      {/* PANEL DERECHO MINIMALISTA (W-72) */}
      <div className="w-72 flex flex-col gap-3 shrink-0">
         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><User size={12}/> Cliente</label>
                <button onClick={() => setShowClientModal(true)} className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-all" title="Nuevo Cliente"><UserPlus size={14}/></button>
            </div>
            <div className="min-w-0 relative">
                <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-50" size={14}/>
                    <input list="pos-clients" className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-white outline-none focus:border-primary-500 text-xs uppercase" value={clientSearchTerm} onChange={handleClientSearchChange} onFocus={() => clientSearchTerm === 'CLIENTE VARIOS' && setClientSearchTerm('')} placeholder="BUSCAR..." />
                    <datalist id="pos-clients">{clients.map(c => <option key={c.id} value={c.name}>{c.dni}</option>)}</datalist>
                </div>
            </div>
         </div>

         {/* MULTIMONEDA - NUEVO PANEL */}
         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Globe size={12}/> Divisa de Venta</label>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button onClick={() => setCurrency(systemBaseCurrency)} className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all uppercase ${currency === systemBaseCurrency ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>{systemBaseCurrency}</button>
                    <button onClick={() => setCurrency('USD')} className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all uppercase ${currency === 'USD' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>USD ($)</button>
                </div>
             </div>
             {currency !== systemBaseCurrency && (
                 <div className="space-y-1 animate-in slide-in-from-top-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Zap size={12}/> Tipo de Cambio</label>
                    <input type="number" step="0.01" className="w-full p-2 bg-yellow-50 dark:bg-slate-900 border border-yellow-200 dark:border-slate-700 rounded-lg text-xs font-black text-yellow-700 dark:text-yellow-400 outline-none" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} />
                 </div>
             )}
         </div>

         {/* COMPROBANTE INTEGRADO */}
         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><FileText size={12}/> Comprobante</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full p-2 bg-slate-900 text-white rounded-lg font-bold text-xs outline-none cursor-pointer uppercase">
                    <option value="TICKET DE VENTA">TICKET DE VENTA</option>
                    <option value="BOLETA ELECTRÓNICA">BOLETA ELECTRÓNICA</option>
                    <option value="FACTURA ELECTRÓNICA">FACTURA ELECTRÓNICA</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Hash size={12}/> Nro Comprobante</label>
                <input type="text" className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white uppercase outline-none focus:border-primary-500" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="EJ: 001-001234" />
             </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
             <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><CreditCard size={12}/> Pago</label>
             <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                 <button onClick={() => setPaymentCondition('Contado')} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all uppercase ${paymentCondition === 'Contado' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>CONTADO</button>
                 <button onClick={() => setPaymentCondition('Credito')} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all uppercase ${paymentCondition === 'Credito' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>CRÉDITO</button>
             </div>
             {paymentCondition === 'Credito' && (
                 <div className="animate-in fade-in slide-in-from-top-1 pt-1">
                     <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                            <input type="number" value={creditDays} onChange={e => setCreditDays(Number(e.target.value))} className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-xs text-slate-700" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Días</span>
                     </div>
                 </div>
             )}
         </div>

         <div className="flex-1"></div>

         <button disabled={cart.length === 0} onClick={handleProcessSaleRequest} className="w-full py-4 bg-primary-600 text-white rounded-2xl shadow-lg hover:bg-primary-700 transition-all flex flex-col items-center justify-center group active:scale-95 disabled:opacity-50">
            <div className="text-[9px] font-black opacity-80 uppercase tracking-widest mb-0.5">FINALIZAR VENTA</div>
            <div className="text-xl font-black flex items-center gap-2">{currency} {total.toFixed(2)} <Banknote size={18}/></div>
         </button>
      </div>

      {/* --- MODAL CONFIRMAR PAGO --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-[720px] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><Banknote size={18} className="text-primary-600"/> Confirmar Pago <span className="mx-1 text-slate-300">|</span> <span className="text-slate-400 font-bold text-[10px] uppercase">{docType}</span></h3>
                  <button onClick={() => setShowPaymentModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18}/></button>
              </div>
              <div className="flex flex-1 min-h-[360px]">
                  <div className="w-[45%] p-6 flex flex-col border-r border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ListChecks size={14}/> DESGLOSE DE PAGOS ({currency})</h4>
                      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl mb-6 bg-white dark:bg-slate-800/50 overflow-hidden">
                          {paymentList.length === 0 ? (
                              <div className="text-center p-8 opacity-40"><Tablet size={48} className="mx-auto mb-3 text-slate-300"/><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay pagos registrados</p></div>
                          ) : (
                              <div className="w-full h-full overflow-y-auto p-3 space-y-2">
                                  {paymentList.map(p => (
                                      <div key={p.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                                          <div><p className="text-[10px] font-black uppercase text-slate-700 dark:text-white">{p.method}</p>{p.bankName && <p className="text-[8px] text-slate-400 truncate uppercase mt-1">{p.bankName}</p>}{p.reference && <p className="text-[8px] text-slate-400 font-mono mt-0.5">REF: {p.reference}</p>}</div>
                                          <div className="flex items-center gap-3"><span className="font-black text-xs">{currency} {p.amount.toFixed(2)}</span><button onClick={() => setPaymentList(paymentList.filter(x => x.id !== p.id))} className="text-red-300 hover:text-red-500"><Trash2 size={14}/></button></div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                      <div className="space-y-2 pt-3">
                          <div className="flex justify-between text-xs font-bold text-slate-500"><span>Total Venta:</span><span className="text-slate-800 dark:text-white">{currency} {total.toFixed(2)}</span></div>
                          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200"><span className="font-black text-red-600 text-[10px] uppercase">Falta por Pagar:</span><span className="text-2xl font-black text-red-600 tracking-tighter">{currency} {remainingTotal.toFixed(2)}</span></div>
                      </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> AGREGAR PAGO</h4>
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                              {['Efectivo', 'Transferencia', 'Yape/Plin', 'Tarjeta', 'Deposito', 'Saldo Favor'].map(m => (
                                <button key={m} onClick={() => setCurrentPayment({...currentPayment, method: m as any, reference: '', accountId: ''})} className={`py-2 px-3 rounded-xl border-2 font-bold text-[10px] uppercase transition-all ${currentPayment.method === m ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-400 border-slate-100 hover:border-slate-200'}`}>{m}</button>
                              ))}
                          </div>
                          
                          {currentPayment.method !== 'Efectivo' && currentPayment.method !== 'Saldo Favor' && (
                              <div className="space-y-3 animate-in slide-in-from-top-1 duration-200 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cuenta Destino ({currency})</label>
                                      <select className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none" value={currentPayment.accountId} onChange={e => setCurrentPayment({...currentPayment, accountId: e.target.value})}>
                                          <option value="">-- SELECCIONAR CUENTA --</option>
                                          {availableBankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} - {b.accountNumber}</option>)}
                                      </select>
                                      {availableBankAccounts.length === 0 && <p className="text-[8px] text-red-500 font-bold mt-1 uppercase">No hay cuentas de {currency} habilitadas para VENTAS.</p>}
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">NRO. OPERACIÓN / REF</label>
                                      <input type="text" className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase outline-none focus:border-primary-500" placeholder="EJ. 123456" value={currentPayment.reference} onChange={e => setCurrentPayment({...currentPayment, reference: e.target.value})} />
                                  </div>
                              </div>
                          )}

                          <div className="space-y-1 pt-1">
                              <div className="flex justify-between items-center mb-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MONTO A COBRAR</label><span className="text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">RESTANTE: {remainingTotal.toFixed(2)}</span></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">{currency}</span><input ref={paymentAmountRef} type="number" className="w-full pl-12 p-4 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-4xl font-black text-slate-800 dark:text-white outline-none focus:border-primary-500 shadow-inner" value={currentPayment.amount} onChange={e => setCurrentPayment({...currentPayment, amount: e.target.value})} /></div>
                          </div>
                          <button onClick={handleAddPayment} className="w-full py-3.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all uppercase text-[11px] tracking-widest"><Plus size={18}/> Agregar Pago</button>
                      </div>
                  </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                  <button onClick={() => setShowPaymentModal(false)} className="px-6 py-3.5 text-slate-500 font-black hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
                  <button onClick={handleFinalizeSale} disabled={remainingTotal > 0.05} className="px-10 py-3.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"><CheckCircle size={18}/> Confirmar Venta</button>
              </div>
           </div>
        </div>
      )}

      {showCostModal && costAnalysis && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-[600px] border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><h3 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter"><ShieldAlert className="text-orange-500" size={24}/> Análisis de Costo</h3><button onClick={() => setShowCostModal(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button></div>
                <div className="p-8 space-y-6"><div className="flex gap-4"><div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Unitario (Base)</p><p className="text-2xl font-black text-slate-800 dark:text-white">{systemBaseCurrency} {showCostModal.cost?.toFixed(2) || '0.00'}</p></div><div className="flex-1 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl border border-primary-100 dark:border-primary-800 text-center"><p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Costo Promedio (Historia)</p><p className="text-2xl font-black text-primary-700 dark:text-primary-300">{systemBaseCurrency} {costAnalysis.avgCost.toFixed(2)}</p></div></div><div><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14}/> Últimas Compras</h4><div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"><table className="w-full text-xs text-left"><thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3 text-center">Cant.</th><th className="px-4 py-3 text-right">Costo</th></tr></thead><tbody className="divide-y divide-slate-50 dark:divide-slate-800">{costAnalysis.history.length === 0 ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic font-bold">No hay compras registradas.</td></tr>) : costAnalysis.history.map((h, i) => (<tr key={i} className="text-slate-600 dark:text-slate-300"><td className="px-4 py-3 font-medium">{h.date}</td><td className="px-4 py-3 truncate max-w-[150px]">{h.supplier}</td><td className="px-4 py-3 text-center font-bold">{h.qty}</td><td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">{systemBaseCurrency} {h.cost.toFixed(2)}</td></tr>))}</tbody></table></div></div><button onClick={() => setShowCostModal(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl">CERRAR</button></div>
            </div>
        </div>
      )}

      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-3xl border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter"><UserPlus className="text-primary-600" size={20}/> Nuevo Cliente</h3><button onClick={() => setShowClientModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button></div>
               <div className="p-8 space-y-6">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nombre Completo</label><input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold uppercase outline-none focus:border-primary-500 shadow-sm text-sm" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} placeholder="EJ. JUAN PÉREZ" autoFocus /></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DNI / RUC</label><input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-primary-500 text-sm" value={newClientData.dni} onChange={e => setNewClientData({...newClientData, dni: e.target.value})} placeholder="00000000" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Teléfono</label><input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-primary-500 text-sm" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} placeholder="999 999 999" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Departamento</label><select className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={newClientData.department} onChange={e => setNewClientData({...newClientData, department: e.target.value})}>{departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Provincia</label><select className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={newClientData.province} onChange={e => setNewClientData({...newClientData, province: e.target.value})}>{provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Distrito</label><select className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={newClientData.district} onChange={e => setNewClientData({...newClientData, district: e.target.value})}><option value="">-- SELECCIONAR --</option>{districts.map(dist => <option key={dist.id} value={dist.name}>{dist.name}</option>)}</select></div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4"><button onClick={() => setShowClientModal(false)} className="px-10 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs">Cancelar</button><button onClick={() => { if (!newClientData.name || !newClientData.dni) return alert("Nombre y DNI obligatorios."); const cl: Client = { id: Date.now().toString(), name: newClientData.name.toUpperCase(), dni: newClientData.dni, phone: newClientData.phone, address: newClientData.address, department: newClientData.department, province: newClientData.province, district: newClientData.district, creditLine: 0, creditUsed: 0, totalPurchases: 0, paymentScore: 3, digitalBalance: 0 }; onAddClient(cl); setClient(cl); setClientSearchTerm(cl.name); setShowClientModal(false); }} className="px-12 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 shadow-xl transition-all text-xs uppercase tracking-widest">Guardar Cliente</button></div>
               </div>
           </div>
        </div>
      )}

      {showRecoverModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden"><div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><RotateCcw className="text-primary-600" size={20}/> Ventas Pendientes</h3><button onClick={() => setShowRecoverModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18}/></button></div><div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">{quotations.length === 0 ? (<div className="text-center py-10 text-slate-300 italic text-xs">No hay ventas para recuperar</div>) : quotations.map(q => (<div key={q.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary-300 transition-all group"><div className="min-w-0"><p className="font-black text-slate-800 dark:text-white uppercase text-xs truncate">{q.clientName}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{q.date} {q.time}</p></div><div className="flex items-center gap-3"><span className="font-black text-primary-600 text-sm">{systemBaseCurrency} {q.total.toFixed(2)}</span><button onClick={() => { onLoadQuotation(q); setShowRecoverModal(false); }} className="bg-primary-600 text-white p-2 rounded-xl shadow-lg hover:bg-primary-700"><Upload size={16}/></button></div></div>))}</div></div>
          </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-[380px] border border-white/20 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-[2rem]">
                    <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-slate-800 dark:text-white"><Lock className="text-primary-600" size={16}/> Autorización</h3>
                    <button onClick={() => { setShowAuthModal(false); setPriceEditItem(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18}/></button>
                </div>
                <div className="p-8 space-y-6">
                    {!isAuthorized ? (
                        <>
                            <div className="text-center">
                                <ShieldAlert className="text-primary-600 mx-auto mb-2" size={32}/><p className="text-xs font-bold text-slate-500 dark:text-slate-400">Se requiere clave de administrador</p>
                            </div>
                            <input type="password" className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-3xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white" placeholder="****" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoFocus />
                            <button onClick={handleAuthorize} className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 text-xs uppercase tracking-widest shadow-lg">Validar Clave</button>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="mb-4 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nuevo Precio Unitario</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase truncate">{priceEditItem?.name}</p>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">{currency}</span>
                                <input type="number" className="w-full pl-12 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-3xl font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" value={newPriceInput} onChange={e => setNewPriceInput(e.target.value)} autoFocus />
                            </div>
                            <button onClick={handleApplyNewPrice} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg mt-4 text-xs uppercase tracking-widest hover:bg-emerald-700">Aplicar Precio</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SalesModule;
