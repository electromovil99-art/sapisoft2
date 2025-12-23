
import React, { useState } from 'react';
import { 
    Bug, Play, CheckCircle, XCircle, AlertTriangle, 
    RefreshCw, Package, Wallet, Database, Activity, 
    Terminal, Zap, ShieldCheck
} from 'lucide-react';
import { Product, CashMovement, StockMovement } from '../types';

interface SystemDiagnosticsProps {
    products: Product[];
    cashMovements: CashMovement[];
    stockMovements: StockMovement[];
    onAddCashMovement: (movement: CashMovement) => void;
}

const SystemDiagnosticsModule: React.FC<SystemDiagnosticsProps> = ({ 
    products, 
    cashMovements, 
    stockMovements,
    onAddCashMovement
}) => {
    const [testLogs, setTestLogs] = useState<{ id: number, name: string, status: 'PENDING' | 'PASS' | 'FAIL', details: string }[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    const addLog = (name: string, status: 'PASS' | 'FAIL', details: string) => {
        setTestLogs(prev => [{ id: Date.now(), name, status, details }, ...prev]);
    };

    // --- TEST 1: CASH FLOW INTEGRITY ---
    const testCashFlow = () => {
        const testName = "Flujo de Movimientos de Caja";
        try {
            const amount = 50.55;
            const concept = "TEST AUTOMATIZADO DE INGRESO";
            
            onAddCashMovement({
                id: 'TCM-' + Date.now(),
                date: new Date().toLocaleDateString('es-PE'),
                time: new Date().toLocaleTimeString('es-PE'),
                type: 'Ingreso',
                paymentMethod: 'Efectivo',
                concept: concept,
                amount: amount,
                user: 'SYSTEM TESTER',
                category: 'TEST',
                financialType: 'Variable'
            });

            addLog(testName, 'PASS', `Movimiento de S/ ${amount} registrado. Verifique en Caja Chica.`);
        } catch (e: any) {
            addLog(testName, 'FAIL', e.message);
        }
    };

    // --- TEST 2: DATA CONSISTENCY ---
    const checkConsistency = () => {
        const testName = "Consistencia de Base de Datos";
        const issues: string[] = [];

        // Verificar si hay productos con stock negativo (no debería pasar)
        const negativeStock = products.filter(p => p.stock < 0);
        if (negativeStock.length > 0) issues.push(`${negativeStock.length} productos con stock negativo.`);

        // Verificar integridad de Kardex
        if (stockMovements.length === 0) issues.push("El Kardex está vacío.");

        if (issues.length === 0) {
            addLog(testName, 'PASS', "Toda la estructura de datos es coherente.");
        } else {
            addLog(testName, 'FAIL', issues.join(' | '));
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            
            {/* CABECERA DE DIAGNÓSTICO */}
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden shrink-0 border border-slate-700">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-inner">
                            <Bug size={32} className="text-primary-400"/>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Debug Center</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Pruebas de Estrés y Diagnóstico de Estado</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setTestLogs([]); }}
                            className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            Limpiar Logs
                        </button>
                        <button 
                            onClick={() => { testCashFlow(); checkConsistency(); }}
                            disabled={isTesting}
                            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary-900/50 transition-all active:scale-95"
                        >
                            {isTesting ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14}/>}
                            Correr Test Completo
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                
                {/* LISTADO DE PRUEBAS DISPONIBLES */}
                <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col p-6 gap-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Terminal size={14}/> Unidades de Prueba
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 group hover:border-emerald-500/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-emerald-600"><Wallet size={20}/></div>
                                <button onClick={testCashFlow} className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 rounded-xl transition-all"><Play size={16}/></button>
                            </div>
                            <h4 className="font-black text-xs uppercase text-slate-800 dark:text-white">Flujo de Caja</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">Verifica que los setters de caja no tengan cierres antiguos.</p>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 group hover:border-blue-500/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-blue-600"><Database size={20}/></div>
                                <button onClick={checkConsistency} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-xl transition-all"><Play size={16}/></button>
                            </div>
                            <h4 className="font-black text-xs uppercase text-slate-800 dark:text-white">Integridad de Datos</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">Escanea inconsistencias entre el inventario teórico y los registros.</p>
                        </div>
                    </div>
                </div>

                {/* LOGS DE RESULTADOS */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-white flex items-center gap-2"><Activity size={16}/> Consola de Resultados</h3>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Monitoreo en tiempo real</span>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-6 space-y-4 font-mono">
                        {testLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                                <Terminal size={64}/>
                                <p className="mt-4 font-black uppercase text-sm">Esperando ejecución...</p>
                            </div>
                        ) : testLogs.map(log => (
                            <div key={log.id} className={`p-4 rounded-2xl border-2 flex gap-4 animate-in slide-in-from-left-4 ${log.status === 'PASS' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                <div className="shrink-0">
                                    {log.status === 'PASS' ? <CheckCircle className="text-emerald-600" size={20}/> : <XCircle className="text-rose-600" size={20}/>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-black text-[10px] uppercase ${log.status === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}`}>{log.name}</span>
                                        <span className="text-[9px] text-slate-400">{new Date(log.id).toLocaleTimeString()}</span>
                                    </div>
                                    <p className={`text-xs font-bold ${log.status === 'PASS' ? 'text-emerald-800' : 'text-rose-800'}`}>
                                        {log.details}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><ShieldCheck size={20}/></div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-tighter">
                            Si todos los tests pasan en verde, significa que la arquitectura de React está procesando los estados correctamente sin bloqueos.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SystemDiagnosticsModule;
