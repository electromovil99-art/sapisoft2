
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Minus, Wallet, Banknote, QrCode, Landmark, CreditCard, Eye, FileText, ArrowRight, X, Lock, Unlock, Filter, CheckCircle, Wrench, ShoppingCart, History, User, Calendar, Clock, Tag, RefreshCw, Printer, RotateCcw, Info, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';
import { CashMovement, PaymentMethodType, BankAccount, SaleRecord } from '../types';

interface CashModuleProps {
    movements: CashMovement[];
    salesHistory: SaleRecord[];
    onAddMovement: (m: CashMovement) => void;
    bankAccounts: BankAccount[];
    onUniversalTransfer: (fromId: string, toId: string, amount: number, exchangeRate: number, reference: string) => void;
    fixedExpenseCategories: string[];
    fixedIncomeCategories: string[];
    onAddFixedCategory: (category: string, type: 'Ingreso' | 'Egreso') => void;
    isCashBoxOpen: boolean;
    lastClosingCash: number;
    onOpenCashBox: (openingCash: number, notes: string, confirmedBankBalances: Record<string, string>) => void;
    onCloseCashBox: (countedCash: number, systemCash: number, systemDigital: number, notes: string, confirmedBankBalances: Record<string, string>) => void;
    systemBaseCurrency: string; // Nueva Prop
}

const DetailRow: React.FC<{ label: string; value: string | React.ReactNode; color?: string }> = ({ label, value, color }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <span className="text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest">{label}</span>
        <div className={`font-bold text-xs text-right ${color || 'text-slate-700 dark:text-slate-200'}`}>{value}</div>
    </div>
);

const ArqueoPanel: React.FC<{ onArqueoChange: (total: number) => void }> = ({ onArqueoChange }) => {
    const [arqueoData, setArqueoData] = useState({
        b200: 0, b100: 0, b50: 0, b20: 0, b10: 0,
        m5: 0, m2: 0, m1: 0, m05: 0, m02: 0, m01: 0,
    });
    
    useEffect(() => {
        const total = (arqueoData.b200 * 200) + (arqueoData.b100 * 100) + (arqueoData.b50 * 50) +
            (arqueoData.b20 * 20) + (arqueoData.b10 * 10) + (arqueoData.m5 * 5) +
            (arqueoData.m2 * 2) + (arqueoData.m1 * 1) + (arqueoData.m05 * 0.5) +
            (arqueoData.m02 * 0.2) + (arqueoData.m01 * 0.1);
        onArqueoChange(total);
    }, [arqueoData, onArqueoChange]);

    const handleChange = (k: keyof typeof arqueoData, v: string) => {
        const val = parseInt(v) || 0;
        setArqueoData(p => ({...p, [k]: val}));
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900/30 p-2 rounded-xl grid grid-cols-2 gap-x-3 gap-y-1 border border-slate-200 dark:border-slate-700 shadow-inner">
            <div className="col-span-2 text-[9px] font-bold text-slate-400 uppercase mb-1">Billetes / Monedas</div>
            {['b200', 'b100', 'b50', 'b20', 'b10'].map((k) => (
                <div key={k} className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{k.substring(1)}</span>
                    <input type="number" className="w-12 p-0.5 text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px]" placeholder="0" onChange={e => handleChange(k as any, e.target.value)} />
                </div>
            ))}
            <div className="col-span-2 text-[9px] font-bold text-slate-400 uppercase mt-1 mb-1 border-t border-slate-200 dark:border-slate-700 pt-1">Menor denominación</div>
            {['m5', 'm2', 'm1', 'm05', 'm02', 'm01'].map((k) => (
                 <div key={k} className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{k.replace('m','').replace('0','.')}</span>
                    <input type="number" className="w-12 p-0.5 text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px]" placeholder="0" onChange={e => handleChange(k as any, e.target.value)} />
                </div>
            ))}
        </div>
    );
};

export const CashModule: React.FC<CashModuleProps> = ({ 
    movements, salesHistory, onAddMovement, bankAccounts, onUniversalTransfer, 
    fixedExpenseCategories, fixedIncomeCategories, onAddFixedCategory, 
    isCashBoxOpen, lastClosingCash, onOpenCashBox, onCloseCashBox,
    systemBaseCurrency
}) => {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBankDetail, setShowBankDetail] = useState<BankAccount | null>(null);
  
  const [filter, setFilter] = useState<'ALL' | 'CASH' | 'DIGITAL'>('ALL');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState('');
  const [financialType, setFinancialType] = useState<'Fijo' | 'Variable'>('Variable');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo');
  const [bankAccountId, setBankAccountId] = useState('');
  const [countedCash, setCountedCash] = useState(0);
  const [notes, setNotes] = useState('');

  const [transferData, setTransferData] = useState({ from: 'CASH', to: '', amount: '', rate: '1.0', reference: '' });

  const filteredMovements = useMemo(() => {
      return movements
        .filter(m => {
          if (filter === 'CASH') return m.paymentMethod === 'Efectivo';
          if (filter === 'DIGITAL') return m.paymentMethod !== 'Efectivo';
          return true;
        })
        .sort((a, b) => {
            const dateA = (a.date || "").split('/').reverse().join('');
            const dateB = (b.date || "").split('/').reverse().join('');
            const timeA = a.time || "00:00:00";
            const timeB = b.time || "00:00:00";
            const fullA = dateA + timeA;
            const fullB = dateB + timeB;
            return fullB.localeCompare(fullA);
        });
  }, [movements, filter]);

  const bankBalances = useMemo(() => {
    return bankAccounts.map(acc => {
      const relatedMoves = movements.filter(m => m.accountId === acc.id);
      const currentBalance = relatedMoves.reduce((sum, m) => m.type === 'Ingreso' ? sum + m.amount : sum - m.amount, 0);
      const initialToday = relatedMoves
        .filter(m => m.date !== new Date().toLocaleDateString('es-PE'))
        .reduce((sum, m) => m.type === 'Ingreso' ? sum + m.amount : sum - m.amount, 0);
      
      return { ...acc, currentBalance, initialToday };
    });
  }, [bankAccounts, movements]);

  const saldoEfectivo = movements.reduce((acc, m) => m.paymentMethod === 'Efectivo' ? (m.type === 'Ingreso' ? acc + m.amount : acc - m.amount) : acc, 0);
  const totalEfectivoActual = lastClosingCash + saldoEfectivo;

  const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSaveMovement = (type: 'Ingreso' | 'Egreso') => {
      if (!amount || !concept) return alert("Ingrese monto y concepto.");
      if (financialType === 'Fijo' && !category) return alert("Seleccione una categoría para el gasto/ingreso fijo.");

      const finalCategory = financialType === 'Fijo' ? category.toUpperCase() : 'VARIABLE';

      onAddMovement({ 
        id: Math.random().toString(36).substr(2, 9), 
        date: new Date().toLocaleDateString('es-PE'), 
        time: new Date().toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit', second: '2-digit'}), 
        type: type, 
        paymentMethod, 
        concept: concept.toUpperCase(), 
        amount: parseFloat(amount), 
        user: 'ADMIN', 
        category: finalCategory, 
        financialType: financialType, 
        accountId: paymentMethod !== 'Efectivo' ? bankAccountId : undefined,
        currency: paymentMethod === 'Efectivo' ? systemBaseCurrency : bankAccounts.find(b=>b.id===bankAccountId)?.currency || systemBaseCurrency
      });
      
      setIsIncomeModalOpen(false); 
      setIsExpenseModalOpen(false); 
      setAmount(''); 
      setConcept('');
      setCategory('');
      setFinancialType('Variable');
  };

  const handleExecuteTransfer = () => {
      const amountNum = parseFloat(transferData.amount);
      const rateNum = parseFloat(transferData.rate || '1');
      if (!transferData.from || !transferData.to) return alert("Seleccione origen y destino");
      if (isNaN(amountNum) || amountNum <= 0) return alert("Monto inválido");
      if (transferData.from === transferData.to) return alert("Origen y destino no pueden ser iguales");

      onUniversalTransfer(transferData.from, transferData.to, amountNum, rateNum, transferData.reference);
      setIsTransferModalOpen(false);
      setTransferData({ from: 'CASH', to: '', amount: '', rate: '1.0', reference: '' });
  };

  const getMethodIcon = (method: PaymentMethodType) => {
    switch(method) {
        case 'Efectivo': return <Banknote size={12} className="text-emerald-500"/>;
        case 'Yape': case 'Plin': case 'Yape/Plin': return <QrCode size={12} className="text-purple-500"/>;
        case 'Tarjeta': return <CreditCard size={12} className="text-blue-500"/>;
        case 'Deposito': case 'Transferencia': return <Landmark size={12} className="text-slate-500"/>;
        default: return <Wallet size={12}/>;
    }
  };

  const linkedSale = useMemo(() => {
    if (!selectedMovement?.referenceId) return null;
    return salesHistory.find(s => s.id === selectedMovement.referenceId);
  }, [selectedMovement, salesHistory]);

  const sourceCurrency = transferData.from === 'CASH' ? systemBaseCurrency : bankAccounts.find(b => b.id === transferData.from)?.currency || systemBaseCurrency;
  const destCurrency = transferData.to === 'CASH' ? systemBaseCurrency : bankAccounts.find(b => b.id === transferData.to)?.currency || systemBaseCurrency;
  const showExchangeRate = sourceCurrency !== destCurrency;

  if (!isCashBoxOpen) {
      return (
          <div className="h-full flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-lg p-5 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 font-black text-slate-400 text-xl">!</div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Apertura de Caja Requerida</h2>
                  <div className="grid grid-cols-2 gap-3 text-left mb-4">
                      <ArqueoPanel onArqueoChange={setCountedCash}/>
                      <div className="space-y-3">
                          <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                               <p className="text-[9px] text-primary font-bold uppercase">Saldo Anterior</p>
                               <p className="text-lg font-black text-primary">{systemBaseCurrency} {lastClosingCash.toFixed(2)}</p>
                          </div>
                          <button onClick={() => onOpenCashBox(countedCash, 'Apertura', {})} className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg">ABRIR CAJA</button>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-1 animate-in fade-in duration-500">
        
        {/* PANEL BANCARIO MINIMALISTA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 shrink-0">
            <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                <div className="flex items-center justify-between w-full mb-1 border-b border-slate-50 dark:border-slate-700 pb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase">EFECTIVO / CAJA</span>
                    <Wallet size={12} className="text-slate-400"/>
                </div>
                <div className="w-full space-y-0.5">
                    <div className="flex justify-between items-center text-[8px] text-slate-400">
                        <span className="font-bold">INICIO:</span>
                        <span className="font-mono">{systemBaseCurrency} {lastClosingCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-emerald-600 uppercase">ACTUAL:</span>
                        <span className="text-xs font-black text-slate-800 dark:text-white">{systemBaseCurrency} {totalEfectivoActual.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="col-span-3 flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                {bankBalances.map(acc => (
                    <button 
                        key={acc.id}
                        onClick={() => setShowBankDetail(acc as any)}
                        className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 min-w-[160px] flex flex-col items-start hover:border-primary-300 transition-all group shadow-sm shrink-0"
                    >
                        <div className="flex items-center justify-between w-full mb-1 border-b border-slate-50 dark:border-slate-700 pb-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[110px]">{acc.alias || acc.bankName}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[7px] font-black bg-slate-100 dark:bg-slate-700 px-1 rounded">{acc.currency}</span>
                                <Info size={10} className="text-slate-300 group-hover:text-primary-500 transition-colors"/>
                            </div>
                        </div>
                        <div className="w-full space-y-0.5">
                            <div className="flex justify-between items-center text-[8px] text-slate-400">
                                <span className="font-bold">INICIO:</span>
                                <span className="font-mono">{acc.currency} {acc.initialToday.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-emerald-600 uppercase">ACTUAL:</span>
                                <span className="text-xs font-black text-slate-800 dark:text-white">{acc.currency} {acc.currentBalance.toFixed(2)}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* TABLA DE MOVIMIENTOS */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-[10px] text-slate-700 dark:text-white uppercase tracking-wider">Historial de Movimientos</h3>
                    <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[8px] py-0.5 px-1 font-bold uppercase outline-none">
                        <option value="ALL">Todos</option><option value="CASH">Caja</option><option value="DIGITAL">Digital</option>
                    </select>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setIsTransferModalOpen(true)} className="px-2 py-1 bg-blue-600 text-white rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-1 hover:bg-blue-700 transition-colors"><ArrowRightLeft size={10}/> Transferir</button>
                    <button onClick={() => setIsCloseModalOpen(true)} className="px-2 py-1 bg-slate-800 text-white rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-1 hover:bg-slate-900 transition-colors"><Lock size={10}/> Cierre</button>
                    <button onClick={() => setIsIncomeModalOpen(true)} className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-1 hover:bg-emerald-700 transition-colors"><Plus size={10}/> Ingreso</button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="px-2 py-1 bg-orange-600 text-white rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-1 hover:bg-orange-700 transition-colors"><Minus size={10}/> Egreso</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                        <tr><th className="px-3 py-1.5 w-32">Momento</th><th className="px-3 py-1.5 w-24">Metodo</th><th className="px-3 py-1.5">Concepto</th><th className="px-3 py-1.5 text-right w-24">Monto</th><th className="px-3 py-1.5 text-center w-10"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredMovements.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-3 py-2 font-mono text-[9px] text-slate-500">
                                    <div className="font-bold text-slate-700 dark:text-slate-300">{m.date}</div>
                                    <div className="text-[8px] opacity-70">{m.time}</div>
                                </td>
                                <td className="px-3 py-2 font-bold uppercase text-[9px] flex items-center gap-1 mt-1.5">{getMethodIcon(m.paymentMethod)} {m.paymentMethod}</td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold truncate max-w-[220px] uppercase">{m.concept}</div>
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{m.category}</div>
                                </td>
                                <td className={`px-3 py-2 text-right font-black ${m.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>{m.currency || systemBaseCurrency} {m.amount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-center">
                                    <button onClick={() => setSelectedMovement(m)} className="text-slate-300 hover:text-primary-600 transition-colors"><Eye size={12}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL TRANSFERENCIA MULTICUENTA */}
        {isTransferModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><ArrowRightLeft size={18} className="text-blue-600"/> Transferencia de Fondos</h3>
                        <button onClick={() => setIsTransferModalOpen(false)}><X className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" size={20}/></button>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Origen</label>
                                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})}>
                                    <option value="CASH">Caja ({systemBaseCurrency})</option>
                                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} ({b.currency})</option>)}
                                </select>
                            </div>
                            <div className="pb-3 text-center"><ArrowRight size={16} className="text-slate-300"/></div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Destino</label>
                                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})}>
                                    <option value="">-- Seleccionar --</option>
                                    <option value="CASH">Caja ({systemBaseCurrency})</option>
                                    {bankAccounts.filter(b => b.id !== transferData.from).map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} ({b.currency})</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={`grid gap-4 ${showExchangeRate ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Monto a Transferir</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{sourceCurrency}</span>
                                    <input type="number" className="w-full pl-10 p-3 bg-white border-2 border-slate-100 rounded-xl text-lg font-black outline-none focus:border-blue-500" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00"/>
                                </div>
                            </div>
                            {showExchangeRate && (
                                <div className="space-y-1 animate-in fade-in">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tipo de Cambio</label>
                                    <input type="number" step="0.01" className="w-full p-3 bg-yellow-50 border-2 border-yellow-100 rounded-xl text-lg font-black text-yellow-700 outline-none" value={transferData.rate} onChange={e => setTransferData({...transferData, rate: e.target.value})} placeholder="1.00"/>
                                </div>
                            )}
                        </div>

                        <button onClick={handleExecuteTransfer} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all uppercase text-xs tracking-widest">Confirmar Transferencia</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL INGRESO/EGRESO DINÁMICO */}
        {(isIncomeModalOpen || isExpenseModalOpen) && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-sm p-6 space-y-4 border border-white/10 animate-in zoom-in-95">
                    <div className="flex justify-between items-center">
                        <h3 className={`font-black text-base uppercase tracking-tighter flex items-center gap-2 ${isIncomeModalOpen ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {isIncomeModalOpen ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
                            {isIncomeModalOpen ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
                        </h3>
                        <button onClick={() => {setIsIncomeModalOpen(false); setIsExpenseModalOpen(false)}} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={18}/></button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto Principal</label>
                        <input type="number" className="w-full text-4xl font-black text-center border-b-2 border-slate-100 dark:border-slate-700 outline-none p-2 bg-transparent text-slate-800 dark:text-white focus:border-primary-500 transition-all" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus/>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medio</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                                value={paymentMethod} 
                                onChange={e => setPaymentMethod(e.target.value as any)}
                            >
                                <option value="Efectivo">Efectivo ({systemBaseCurrency})</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Deposito">Depósito</option>
                            </select>
                        </div>
                    </div>

                    {paymentMethod !== 'Efectivo' && (
                        <div className="space-y-1 animate-in slide-in-from-top-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cuenta {isIncomeModalOpen ? 'Destino' : 'Origen'}</label>
                            <select 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-[10px] font-bold uppercase outline-none"
                                value={bankAccountId}
                                onChange={e => setBankAccountId(e.target.value)}
                            >
                                <option value="">-- SELECCIONAR CUENTA --</option>
                                {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} ({b.currency})</option>)}
                            </select>
                        </div>
                    )}

                    <button 
                        onClick={() => handleSaveMovement(isIncomeModalOpen ? 'Ingreso' : 'Egreso')} 
                        className={`w-full py-4 text-white font-black rounded-2xl shadow-xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${isIncomeModalOpen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                    >
                        <CheckCircle size={18}/>
                        Registrar Movimiento
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default CashModule;
